import { test, expect } from '@playwright/test'
import { getOrderByEmail, deleteOrdersByEmail } from './helpers/db'
import { TEST_PRODUCTS } from './global-setup'

const guestEmail = `guest+${Date.now()}@test.gajjuexpress`

test.describe('Guest checkout', () => {
  test.afterAll(async () => {
    await deleteOrdersByEmail(guestEmail)
  })

  test('completes a full guest checkout and lands on success page', async ({ page }) => {
    // 1. Add a product to cart from /products
    await page.goto('/products')

    const firstProductName = TEST_PRODUCTS[0].name
    const addBtn = page.getByRole('button', { name: new RegExp(`Add ${firstProductName}`, 'i') })
    const productCard = page.getByRole('link', { name: new RegExp(firstProductName, 'i') }).first()
    await productCard.hover()
    await expect(addBtn).toBeVisible({ timeout: 5_000 })
    await addBtn.click()

    // Dismiss cart drawer / overlay if it opens — navigate directly to checkout
    await page.goto('/checkout')

    // 2. Fill guest email
    await page.getByPlaceholder('you@example.com').fill(guestEmail)

    // 3. Click "Continue to Payment" to create the payment intent
    await page.getByRole('button', { name: /Continue to Payment/i }).click()

    // Wait for Stripe Elements to mount (PaymentElement + AddressElement appear in iframes)
    await expect(page.frameLocator('iframe[name^="__privateStripeFrame"]').first().getByRole('textbox').first()).toBeVisible({ timeout: 20_000 })

    // 4. Fill Stripe card details inside the PaymentElement iframe
    //    Stripe mounts a unified iframe; we target by label text within the frame
    const stripeFrame = page.frameLocator('iframe[title="Secure card payment input frame"], iframe[name^="__privateStripeFrame"]').first()

    await stripeFrame.getByRole('textbox', { name: /card number/i }).fill('4242424242424242')
    await stripeFrame.getByRole('textbox', { name: /expiry|mm \/ yy|expiration/i }).fill('12 / 34')
    await stripeFrame.getByRole('textbox', { name: /cvc|cvv|security/i }).fill('123')

    // 5. Fill the Stripe AddressElement (shipping address rendered inside its own iframe)
    //    Stripe's AddressElement uses a separate iframe
    const addressFrame = page.frameLocator('iframe[title="Secure address input frame"], iframe[name^="__privateStripeFrame"]').nth(1)

    await addressFrame.getByRole('textbox', { name: /full name|name/i }).fill('Test Guest User')
    await addressFrame.getByRole('textbox', { name: /address line 1|address/i }).fill('1 Test Street')
    await addressFrame.getByRole('textbox', { name: /city|town/i }).fill('London')
    await addressFrame.getByRole('textbox', { name: /postal code|postcode/i }).fill('E1 1AA')
    await addressFrame.getByRole('textbox', { name: /phone/i }).fill('07700900123')

    // 6. Submit payment
    await page.getByRole('button', { name: /Pay £/i }).click()

    // 7. Assert redirect to /checkout/success with success message
    await page.waitForURL(/\/checkout\/success/, { timeout: 30_000 })
    await expect(page.getByRole('heading', { name: /Bahot bahot dhanyavaad/i })).toBeVisible({ timeout: 15_000 })

    // 8. Assert order exists in DB using guest_email column
    const order = await getOrderByEmail(guestEmail)
    expect(order).not.toBeNull()
    expect(order!.guest_email).toBe(guestEmail)
  })
})
