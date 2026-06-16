import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'
import { getWishlistItems, getUserByEmail, getServiceClient } from './helpers/db'
import { TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD, TEST_PRODUCTS } from './global-setup'

const firstProductName = TEST_PRODUCTS[0].name
const addLabel = new RegExp(`Add ${firstProductName} to wishlist`, 'i')
const removeLabel = new RegExp(`Remove ${firstProductName} from wishlist`, 'i')

async function clearWishlistItem() {
  const user = await getUserByEmail(TEST_ADMIN_EMAIL)
  if (!user) return
  const db = getServiceClient()
  const { data: prod } = await db.from('products').select('id').eq('name', firstProductName).maybeSingle()
  if (prod) await db.from('user_wishlists').delete().eq('user_id', user.id).eq('product_id', prod.id)
}

async function addViaUI(page: import('@playwright/test').Page) {
  await page.goto('/products')
  const productCard = page.getByRole('link', { name: new RegExp(firstProductName, 'i') }).first()
  await productCard.hover()
  const addBtn = page.getByRole('button', { name: addLabel })
  await expect(addBtn).toBeVisible({ timeout: 5_000 })
  await addBtn.click()
  // Wait for server action to complete — button flips to "Remove..."
  await expect(page.getByRole('button', { name: removeLabel })).toBeVisible({ timeout: 10_000 })
}

test.describe('Wishlist', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD)
  })

  test.afterAll(async () => {
    const user = await getUserByEmail(TEST_ADMIN_EMAIL)
    if (!user) return
    const db = getServiceClient()
    await db.from('user_wishlists').delete().eq('user_id', user.id)
  })

  test('adds a product to wishlist from the product card and verifies it appears on /account/wishlist', async ({ page }) => {
    await clearWishlistItem()
    await addViaUI(page)

    await page.goto('/account/wishlist')
    await expect(page.getByRole('heading', { name: /Wishlist/i })).toBeVisible()
    await expect(page.getByText(firstProductName)).toBeVisible({ timeout: 10_000 })
  })

  test('removes a product from the wishlist page', async ({ page }) => {
    // Ensure a clean state then add via UI
    await clearWishlistItem()
    await addViaUI(page)

    await page.goto('/account/wishlist')
    await expect(page.getByText(firstProductName)).toBeVisible({ timeout: 10_000 })

    const wishlistCard = page.getByRole('link', { name: new RegExp(firstProductName, 'i') }).first()
    await wishlistCard.hover()
    const removeBtn = page.getByRole('button', { name: removeLabel })
    await expect(removeBtn).toBeVisible({ timeout: 5_000 })
    await removeBtn.click()
    // Wait for server action to complete — button flips back to "Add..."
    await expect(page.getByRole('button', { name: addLabel })).toBeVisible({ timeout: 10_000 })

    // Server Component doesn't re-render in place — navigate to get the fresh server render
    await page.goto('/account/wishlist')
    await expect(page.getByRole('heading', { name: /Wishlist/i })).toBeVisible()
    await expect(page.getByText(firstProductName)).not.toBeVisible({ timeout: 10_000 })

    const user = await getUserByEmail(TEST_ADMIN_EMAIL)
    if (user) {
      const items = await getWishlistItems(user.id)
      const still = items.some((i: { products: { name: string } | null }) => i.products?.name === firstProductName)
      expect(still).toBe(false)
    }
  })
})
