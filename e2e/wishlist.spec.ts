import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'
import { getWishlistItems, getUserByEmail, getServiceClient } from './helpers/db'
import { TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD, TEST_PRODUCTS } from './global-setup'

test.describe('Wishlist', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD)
  })

  test.afterAll(async () => {
    // Clean up: remove any wishlist items left by the admin test user
    const user = await getUserByEmail(TEST_ADMIN_EMAIL)
    if (!user) return
    const db = getServiceClient()
    await db.from('user_wishlists').delete().eq('user_id', user.id)
  })

  test('adds a product to wishlist from the product card and verifies it appears on /account/wishlist', async ({ page }) => {
    // Navigate to products and hover over the first card to reveal the heart button
    await page.goto('/products')

    // The first test product seeded in global-setup
    const firstProductName = TEST_PRODUCTS[0].name
    const wishlistBtn = page.getByRole('button', { name: new RegExp(`Add ${firstProductName} to wishlist`, 'i') })

    // Hover the card so the opacity-0 heart button becomes visible
    const productCard = page.getByRole('link', { name: new RegExp(firstProductName, 'i') }).first()
    await productCard.hover()

    await expect(wishlistBtn).toBeVisible({ timeout: 5_000 })
    await wishlistBtn.click()

    // Navigate to wishlist page and confirm the item is there
    await page.goto('/account/wishlist')
    await expect(page.getByRole('heading', { name: /Wishlist/i })).toBeVisible()
    await expect(page.getByText(firstProductName)).toBeVisible({ timeout: 10_000 })
  })

  test('removes a product from the wishlist page', async ({ page }) => {
    // First ensure the item is wishlisted via the products page
    await page.goto('/products')
    const firstProductName = TEST_PRODUCTS[0].name
    const wishlistBtn = page.getByRole('button', { name: new RegExp(`Add ${firstProductName} to wishlist`, 'i') })
    const productCard = page.getByRole('link', { name: new RegExp(firstProductName, 'i') }).first()
    await productCard.hover()

    // Only click if not already wishlisted (idempotent setup)
    const isVisible = await wishlistBtn.isVisible().catch(() => false)
    if (isVisible) {
      await wishlistBtn.click()
    }

    // Go to wishlist page
    await page.goto('/account/wishlist')
    await expect(page.getByText(firstProductName)).toBeVisible({ timeout: 10_000 })

    // Remove via the heart button on the ProductCard rendered on the wishlist page
    const removeBtn = page.getByRole('button', { name: new RegExp(`Remove ${firstProductName} from wishlist`, 'i') })
    const wishlistCard = page.getByRole('link', { name: new RegExp(firstProductName, 'i') }).first()
    await wishlistCard.hover()
    await expect(removeBtn).toBeVisible({ timeout: 5_000 })
    await removeBtn.click()

    // The wishlist page should now show the empty state or not contain the product
    await expect(page.getByText(firstProductName)).not.toBeVisible({ timeout: 10_000 })

    // Verify the DB is clean
    const user = await getUserByEmail(TEST_ADMIN_EMAIL)
    if (user) {
      const items = await getWishlistItems(user.id)
      const still = items.some((i: { products: { name: string } | null }) => i.products?.name === firstProductName)
      expect(still).toBe(false)
    }
  })
})
