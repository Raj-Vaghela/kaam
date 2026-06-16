import { Page } from '@playwright/test'

export async function loginAs(page: Page, email: string, password: string) {
  // Pre-accept cookie consent so the z-[100] banner never blocks clicks
  await page.addInitScript(() => {
    localStorage.setItem('cookie-consent-v2', 'accepted')
  })
  await page.goto('/auth')
  await page.getByPlaceholder('you@example.com').fill(email)
  await page.getByPlaceholder('••••••••').fill(password)
  await page.locator('form').getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(url => !url.pathname.startsWith('/auth'), { timeout: 15_000 })
}

export function testEmail(prefix: string): string {
  return `${prefix}+${Date.now()}@test.gajjuexpress`
}
