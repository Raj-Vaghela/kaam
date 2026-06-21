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

    // GDPR rewrite (2026-06) made the consent checkbox mandatory; Subscribe is
    // disabled until it is ticked.
    await page.getByRole('checkbox').check()

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

  test('duplicate submission returns success without enumerating subscribers', async ({ page }) => {
    // First subscription
    await page.goto('/')
    const emailInput = page.getByPlaceholder('your@email.com')
    await emailInput.fill(email)
    await page.getByRole('checkbox').check()

    const first = page.waitForResponse(
      resp => resp.url().includes('/api/newsletter') && resp.status() === 200
    )
    await page.getByRole('button', { name: 'Subscribe' }).click()
    await first

    // Wait for "Sent!" button label to revert to "Subscribe" — Footer.tsx flips
    // back via a 5000ms setTimeout, so 5s is racy; allow buffer.
    await expect(page.getByRole('button', { name: 'Subscribe' })).toBeVisible({ timeout: 8_000 })

    // Second submission with same email. The GDPR-compliant route returns 200 with
    // the same neutral success message regardless of whether the email is already
    // subscribed — this prevents address-enumeration via the form. The UI shows
    // "Sent!" both times; there is no "already subscribed" error path.
    await emailInput.fill(email)
    await page.getByRole('checkbox').check()

    const second = page.waitForResponse(
      resp => resp.url().includes('/api/newsletter') && resp.status() === 200
    )
    await page.getByRole('button', { name: 'Subscribe' }).click()
    await second
  })
})
