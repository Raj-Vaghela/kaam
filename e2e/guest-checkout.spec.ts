import { test, expect } from '@playwright/test'
import { getOrderByEmail, deleteOrdersByEmail, getServiceClient } from './helpers/db'
import { TEST_PRODUCTS } from './global-setup'

const guestEmail = `guest+${Date.now()}@test.gajjuexpress`

test.describe('Guest checkout', () => {
  test.afterAll(async () => {
    await deleteOrdersByEmail(guestEmail)
  })

  test('completes a full guest checkout and lands on success page', async ({ page }) => {
    // Fetch the test product from DB before any page navigation
    const db = getServiceClient()
    const { data: product } = await db
      .from('products')
      .select('id, name, price, image_url, unit, category')
      .eq('name', TEST_PRODUCTS[0].name)
      .single()

    expect(product).not.toBeNull()

    // addInitScript runs before EVERY navigation (including HMR reloads) — most reliable cart seed
    await page.addInitScript((cartItem) => {
      localStorage.setItem('cookie-consent-v2', 'accepted')
      localStorage.setItem('gajjuexpress-cart', JSON.stringify([cartItem]))
    }, {
      id: product!.id,
      name: product!.name,
      price: product!.price,
      image: product!.image_url ?? 'https://placehold.co/400',
      unit: product!.unit ?? '',
      category: product!.category ?? '',
      qty: 1,
    })

    await page.goto('/checkout')
    // "Checkout" heading only renders when cart is non-empty — confirms CartContext hydrated
    await expect(page.getByRole('heading', { name: /^Checkout$/i })).toBeVisible({ timeout: 30_000 })

    // Fill guest email
    await page.getByPlaceholder('you@example.com').fill(guestEmail)

    // Create the payment intent
    await page.getByRole('button', { name: /Continue to Payment/i }).click()

    const addressFrame = page.frameLocator('iframe[title="Secure address input frame"]')

    // Wait for address frame to mount — first visible input is the Name field
    await expect(addressFrame.locator('input').first()).toBeVisible({ timeout: 20_000 })

    // Fill address fields. click() before each fill ensures the previous field gets a blur event,
    // which triggers Stripe's AddressElement to commit the value to its internal state.
    const addrName = addressFrame.locator('input[autocomplete="shipping name"]')
    const addrLine1 = addressFrame.locator('input[autocomplete="shipping address-line1"]')
    const addrCity = addressFrame.locator('input[autocomplete="shipping address-level2"]')
    const addrPost = addressFrame.locator('input[autocomplete="shipping postal-code"]')
    const addrPhone = addressFrame.locator('input[autocomplete="shipping tel"]')

    await addrName.click()
    await addrName.fill('Test Guest User')
    await addrLine1.click()
    await addrLine1.fill('1 Test Street')
    await addrCity.click()
    await addrCity.fill('London')
    await addrPost.click()
    await addrPost.fill('E1 1AA')
    await addrPhone.click()
    await addrPhone.pressSequentially('7911123456', { delay: 20 })
    await addrPhone.press('Tab')

    // Fill Stripe card details (PaymentElement — exclude aria-hidden autocomplete frame).
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

    // Wait for Pay button to be enabled (confirms Stripe SDK loaded and card accepted)
    const payButton = page.getByRole('button', { name: /Pay £/i })
    await expect(payButton).toBeEnabled({ timeout: 10_000 })

    // Submit payment
    await payButton.click()

    // Assert redirect to /checkout/success with success message
    await page.waitForURL(/\/checkout\/success/, { timeout: 30_000 })
    await expect(page.getByRole('heading', { name: /Bahot bahot dhanyavaad/i })).toBeVisible({ timeout: 15_000 })

    // Assert order exists in DB
    const order = await getOrderByEmail(guestEmail)
    expect(order).not.toBeNull()
    expect(order!.guest_email).toBe(guestEmail)
  })
})
