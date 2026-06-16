import { test, expect } from '@playwright/test'
import { testEmail } from './helpers/auth'
import { getOrderByUserId, deleteOrdersByUserId, getUserByEmail, getServiceClient } from './helpers/db'
import { TEST_PRODUCTS } from './global-setup'

const userEmail = testEmail('reguser')
const userPassword = 'TestUser@1234!'

test.describe('Authenticated user checkout', () => {
  test.beforeAll(async () => {
    // Create a pre-confirmed user via the admin API — bypasses sign-up UI and email confirmation
    const db = getServiceClient()
    await db.auth.admin.createUser({
      email: userEmail,
      password: userPassword,
      email_confirm: true,
    })
  })

  test.afterAll(async () => {
    const user = await getUserByEmail(userEmail)
    if (user) {
      await deleteOrdersByUserId(user.id)
      const db = getServiceClient()
      await db.auth.admin.deleteUser(user.id)
    }
  })

  test('signs in, completes checkout, and sees order on /account/orders', async ({ page }) => {
    // Fetch cart product before any navigation so we can seed via addInitScript
    const db = getServiceClient()
    const { data: cartProduct } = await db
      .from('products')
      .select('id, name, price, image_url, unit, category')
      .eq('name', TEST_PRODUCTS[0].name)
      .single()

    expect(cartProduct).not.toBeNull()

    // addInitScript seeds BOTH cookie consent AND cart on every navigation (including HMR reloads)
    await page.addInitScript((cartItem) => {
      localStorage.setItem('cookie-consent-v2', 'accepted')
      localStorage.setItem('gajjuexpress-cart', JSON.stringify([cartItem]))
    }, {
      id: cartProduct!.id,
      name: cartProduct!.name,
      price: cartProduct!.price,
      image: cartProduct!.image_url ?? 'https://placehold.co/400',
      unit: cartProduct!.unit ?? '',
      category: cartProduct!.category ?? '',
      qty: 1,
    })

    // 1. Sign in
    await page.goto('/auth')
    await page.getByPlaceholder('you@example.com').fill(userEmail)
    await page.getByPlaceholder('••••••••').fill(userPassword)
    await page.locator('form').getByRole('button', { name: /Sign In/i }).click()
    await page.waitForURL(url => !url.pathname.startsWith('/auth'), { timeout: 15_000 })

    // 2. Navigate directly to checkout (cart already seeded in localStorage via addInitScript)
    await page.goto('/checkout')
    // "Checkout" heading only renders when cart is non-empty — confirms CartContext hydrated
    // 30s timeout: allows for Next.js lazy route compilation in dev mode
    await expect(page.getByRole('heading', { name: /^Checkout$/i })).toBeVisible({ timeout: 30_000 })

    // 3. Email should be pre-filled and locked for logged-in user
    const emailInput = page.getByPlaceholder('you@example.com')
    await expect(emailInput).toHaveValue(userEmail, { timeout: 8_000 })
    await expect(emailInput).toBeDisabled()

    // 4. Proceed to payment
    await page.getByRole('button', { name: /Continue to Payment/i }).click()

    const addressFrame = page.frameLocator('iframe[title="Secure address input frame"]')

    // Wait for address frame to mount — first visible input is the Name field
    await expect(addressFrame.locator('input').first()).toBeVisible({ timeout: 20_000 })

    // 5. Fill address — click() before fill() triggers blur on the previous field,
    // which commits its value to Stripe's AddressElement internal state.
    const addrName = addressFrame.locator('input[autocomplete="shipping name"]')
    const addrLine1 = addressFrame.locator('input[autocomplete="shipping address-line1"]')
    const addrCity = addressFrame.locator('input[autocomplete="shipping address-level2"]')
    const addrPost = addressFrame.locator('input[autocomplete="shipping postal-code"]')
    const addrPhone = addressFrame.locator('input[autocomplete="shipping tel"]')

    await addrName.click()
    await addrName.fill('Reg Test User')
    await addrLine1.click()
    await addrLine1.fill('10 User Lane')
    await addrCity.click()
    await addrCity.fill('Manchester')
    await addrPost.click()
    await addrPost.fill('M1 1AA')
    await addrPhone.click()
    await addrPhone.pressSequentially('7911123456', { delay: 20 })
    await addrPhone.press('Tab')
    // Give Stripe's AddressElement time to async-validate after blur
    await page.waitForTimeout(1000)

    // 6. Fill Stripe card details (PaymentElement — exclude aria-hidden autocomplete frame).
    // Click "Card" tab first — Revolut Pay may be auto-selected by Stripe.
    const paymentFrame = page.frameLocator('iframe[title="Secure payment input frame"]:not([aria-hidden="true"])')
    const cardTab = paymentFrame.getByRole('tab', { name: /card/i })
    if (await cardTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await cardTab.click()
    }
    await expect(paymentFrame.locator('input[name="number"]')).toBeVisible({ timeout: 10_000 })
    await paymentFrame.locator('input[name="number"]').pressSequentially('4242424242424242', { delay: 30 })
    await paymentFrame.locator('input[name="expiry"]').pressSequentially('1234', { delay: 30 })
    await paymentFrame.locator('input[name="cvc"]').pressSequentially('123', { delay: 30 })

    // 7. Pay — wait for button to be enabled (Stripe SDK loaded and card accepted)
    const payButton = page.getByRole('button', { name: /Pay £/i })
    await expect(payButton).toBeEnabled({ timeout: 10_000 })
    await payButton.click()
    await page.waitForURL(/\/checkout\/success/, { timeout: 30_000 })
    await expect(page.getByRole('heading', { name: /Bahot bahot dhanyavaad/i })).toBeVisible({ timeout: 15_000 })

    // 8. Assert order in DB
    const user = await getUserByEmail(userEmail)
    const order = user ? await getOrderByUserId(user.id) : null
    expect(order).not.toBeNull()

    // 9. Assert order appears on /account/orders
    await page.goto('/account/orders')
    await expect(page.getByRole('heading', { name: /Orders/i })).toBeVisible()
    await expect(page.locator('[class*="rounded-3xl"]').first()).toBeVisible({ timeout: 10_000 })
  })
})
