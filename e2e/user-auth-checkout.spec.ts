import { test, expect } from '@playwright/test'
import { testEmail } from './helpers/auth'
import { getOrderByEmail, deleteOrdersByEmail, getUserByEmail, getServiceClient } from './helpers/db'
import { TEST_PRODUCTS } from './global-setup'

const userEmail = testEmail('reguser')
const userPassword = 'TestUser@1234!'

test.describe('Authenticated user checkout', () => {
  test.afterAll(async () => {
    // Delete orders first (FK constraint), then delete the user
    await deleteOrdersByEmail(userEmail)
    const user = await getUserByEmail(userEmail)
    if (user) {
      const db = getServiceClient()
      await db.auth.admin.deleteUser(user.id)
    }
  })

  test('registers, completes checkout, and sees order on /account/orders', async ({ page }) => {
    // 1. Go to /auth, switch to sign-up mode
    await page.goto('/auth')
    await page.getByRole('button', { name: /Sign Up/i }).click()

    // 2. Fill sign-up form
    await page.getByLabel(/Full name/i).fill('Reg Test User')
    await page.getByLabel(/Email/i).fill(userEmail)
    await page.getByLabel(/Password/i).fill(userPassword)

    // 3. Submit and wait for the confirmation message (Supabase sends confirm email)
    //    The app shows "Check your email for the confirmation link!" instead of redirecting
    await page.getByRole('button', { name: /Create Account/i }).click()
    await expect(page.getByText(/Check your email/i)).toBeVisible({ timeout: 10_000 })

    // 4. Bypass email confirmation: use the service client to confirm the user
    const user = await getUserByEmail(userEmail)
    expect(user).not.toBeNull()
    const db = getServiceClient()
    await db.auth.admin.updateUserById(user!.id, { email_confirm: true })

    // 5. Sign in now that email is confirmed
    await page.goto('/auth')
    await page.getByLabel(/Email/i).fill(userEmail)
    await page.getByLabel(/Password/i).fill(userPassword)
    await page.getByRole('button', { name: /Sign In/i }).click()
    await page.waitForURL(url => !url.pathname.startsWith('/auth'), { timeout: 15_000 })

    // 6. Add product to cart and go to checkout
    await page.goto('/products')
    const firstProductName = TEST_PRODUCTS[0].name
    const productCard = page.getByRole('link', { name: new RegExp(firstProductName, 'i') }).first()
    await productCard.hover()
    const addBtn = page.getByRole('button', { name: new RegExp(`Add ${firstProductName}`, 'i') })
    await expect(addBtn).toBeVisible({ timeout: 5_000 })
    await addBtn.click()

    await page.goto('/checkout')

    // 7. Email should be pre-filled and locked for logged-in user
    const emailInput = page.getByPlaceholder('you@example.com')
    await expect(emailInput).toHaveValue(userEmail, { timeout: 8_000 })
    await expect(emailInput).toBeDisabled()

    // 8. Proceed to payment
    await page.getByRole('button', { name: /Continue to Payment/i }).click()

    // Wait for Stripe Elements to mount
    await expect(page.frameLocator('iframe[name^="__privateStripeFrame"]').first().getByRole('textbox').first()).toBeVisible({ timeout: 20_000 })

    // 9. Fill Stripe card details
    const stripeFrame = page.frameLocator('iframe[title="Secure card payment input frame"], iframe[name^="__privateStripeFrame"]').first()
    await stripeFrame.getByRole('textbox', { name: /card number/i }).fill('4242424242424242')
    await stripeFrame.getByRole('textbox', { name: /expiry|mm \/ yy|expiration/i }).fill('12 / 34')
    await stripeFrame.getByRole('textbox', { name: /cvc|cvv|security/i }).fill('123')

    // 10. Fill address in AddressElement
    const addressFrame = page.frameLocator('iframe[title="Secure address input frame"], iframe[name^="__privateStripeFrame"]').nth(1)
    await addressFrame.getByRole('textbox', { name: /full name|name/i }).fill('Reg Test User')
    await addressFrame.getByRole('textbox', { name: /address line 1|address/i }).fill('10 User Lane')
    await addressFrame.getByRole('textbox', { name: /city|town/i }).fill('Manchester')
    await addressFrame.getByRole('textbox', { name: /postal code|postcode/i }).fill('M1 1AA')
    await addressFrame.getByRole('textbox', { name: /phone/i }).fill('07800123456')

    // 11. Pay
    await page.getByRole('button', { name: /Pay £/i }).click()

    // 12. Assert success page
    await page.waitForURL(/\/checkout\/success/, { timeout: 30_000 })
    await expect(page.getByRole('heading', { name: /Bahot bahot dhanyavaad/i })).toBeVisible({ timeout: 15_000 })

    // 13. Assert order in DB — authenticated orders may use user_id not guest_email,
    //     but the checkout page passes user email as guest_email when creating the payment intent
    const order = await getOrderByEmail(userEmail)
    expect(order).not.toBeNull()

    // 14. Assert order appears on /account/orders
    await page.goto('/account/orders')
    await expect(page.getByRole('heading', { name: /Orders/i })).toBeVisible()
    // The orders page lists orders by user_id; at least one order row should be present
    await expect(page.locator('[class*="rounded-3xl"]').first()).toBeVisible({ timeout: 10_000 })
  })
})
