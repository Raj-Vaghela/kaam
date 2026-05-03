import { Page } from '@playwright/test'

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/auth')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole('button', { name: /sign in|log in/i }).click()
  await page.waitForURL(url => !url.pathname.startsWith('/auth'), { timeout: 15_000 })
}

export function testEmail(prefix: string): string {
  return `${prefix}+${Date.now()}@test.gajjuexpress`
}
