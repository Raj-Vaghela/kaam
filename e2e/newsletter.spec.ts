import { test, expect } from '@playwright/test'
import { testEmail } from './helpers/auth'
import { getNewsletterSubscriber, deleteNewsletterSubscriber } from './helpers/db'

const email = testEmail('newsletter')

test.describe('Newsletter signup', () => {
  test.afterEach(async () => {
    await deleteNewsletterSubscriber(email)
  })

  test('subscribes successfully and persists to DB', async ({ page }) => {
    await page.goto('/')

    const emailInput = page.getByPlaceholder('your@email.com')
    await emailInput.fill(email)

    // Wait for the API response — more reliable than the 3s "Thanks!" button window
    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/api/newsletter') && resp.status() === 200
    )
    await page.getByRole('button', { name: 'Subscribe' }).click()
    await responsePromise

    const subscriber = await getNewsletterSubscriber(email)
    expect(subscriber).not.toBeNull()
    expect(subscriber.email).toBe(email)
    expect(subscriber.source).toBe('footer')
  })

  test('duplicate submission shows already-subscribed error without crashing', async ({ page }) => {
    // First subscription
    await page.goto('/')
    const emailInput = page.getByPlaceholder('your@email.com')
    await emailInput.fill(email)

    const first = page.waitForResponse(
      resp => resp.url().includes('/api/newsletter') && resp.status() === 200
    )
    await page.getByRole('button', { name: 'Subscribe' }).click()
    await first

    // Wait for "Thanks!" to revert before second submission
    await expect(page.getByRole('button', { name: 'Subscribe' })).toBeVisible({ timeout: 5_000 })

    // Second submission with same email — expect 409 and "already subscribed" UI
    await emailInput.fill(email)
    await page.getByRole('button', { name: 'Subscribe' }).click()

    await expect(page.getByText("You're already subscribed")).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('link', { name: 'Privacy', exact: true })).toBeVisible()
  })
})
