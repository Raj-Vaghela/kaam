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

    await page.getByRole('button', { name: 'Subscribe' }).click()

    await expect(page.getByRole('button', { name: 'Thanks!' })).toBeVisible({ timeout: 10_000 })

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
    await page.getByRole('button', { name: 'Subscribe' }).click()
    await expect(page.getByRole('button', { name: 'Thanks!' })).toBeVisible({ timeout: 10_000 })

    // Wait for the button to revert back to Subscribe after the 3s timeout
    await expect(page.getByRole('button', { name: 'Subscribe' })).toBeVisible({ timeout: 5_000 })

    // Second submission with the same email
    await emailInput.fill(email)
    await page.getByRole('button', { name: 'Subscribe' }).click()

    await expect(page.getByText("You're already subscribed")).toBeVisible({ timeout: 10_000 })

    // Page must still be functional — footer link should be present
    await expect(page.getByRole('link', { name: 'Privacy' })).toBeVisible()
  })
})
