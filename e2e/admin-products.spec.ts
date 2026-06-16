import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'
import { getProductByName, deleteProductByName, getServiceClient } from './helpers/db'
import { TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } from './global-setup'

// Stable across all 3 tests in this file — computed once at module load
const NEW_PRODUCT_NAME = `E2E Test Product ${Date.now()}`

const SUPABASE_URL = 'https://umlzfxbrnyftmoeayvqk.supabase.co'

test.describe('Admin — product management', () => {
  test.afterAll(async () => {
    // Clean up any product left behind by the test suite
    await deleteProductByName(NEW_PRODUCT_NAME)
    // Also clean up the edited name in case test 2 ran but test 3 didn't
    await deleteProductByName(NEW_PRODUCT_NAME)
  })

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD)
    await page.goto('/admin/products')
    await expect(page.getByRole('heading', { name: /products/i })).toBeVisible({ timeout: 15_000 })
  })

  test('1 — admin adds a new product', async ({ page }) => {
    // Intercept Supabase Storage upload — no real file stored
    await page.route(`${SUPABASE_URL}/storage/v1/object/products/**`, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ Key: 'products/fake.png' }) })
    })

    // Navigate directly to the new product page (avoids RSC client-nav flakiness in dev mode)
    await page.goto('/admin/products/new')
    await expect(page.getByRole('heading', { name: /add a new product/i })).toBeVisible({ timeout: 15_000 })

    await page.getByLabel(/product name/i).fill(NEW_PRODUCT_NAME)
    await page.getByLabel(/price/i).fill('9.99')
    await page.getByLabel(/unit/i).fill('1kg')
    await page.getByLabel(/stock count/i).fill('50')

    // Trigger the real handleImageUpload so React imageUrl state is set — this naturally
    // enables the submit button (disabled={!imageUrl}) without DOM patching
    await page.locator('input[type="file"]').setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'),
    })

    // Wait for upload to complete — button becomes enabled once imageUrl state is set
    const submitBtn = page.getByRole('button', { name: /create product/i })
    await expect(submitBtn).toBeEnabled({ timeout: 10_000 })

    await submitBtn.click()

    // End-anchor distinguishes /admin/products from /admin/products/new or /admin/products/*/edit
    await expect(page).toHaveURL(/\/admin\/products$/, { timeout: 15_000 })

    // Verify in DB
    const product = await getProductByName(NEW_PRODUCT_NAME)
    expect(product).not.toBeNull()
    expect(product.name).toBe(NEW_PRODUCT_NAME)
  })

  test('2 — admin edits the product price to 12.99', async ({ page }) => {
    // Get the product created in test 1
    const existing = await getProductByName(NEW_PRODUCT_NAME)
    expect(existing).not.toBeNull()

    // Navigate directly to the edit page using the product ID
    await page.goto(`/admin/products/${existing.id}/edit`)
    await expect(page.getByRole('heading', { name: /edit product/i })).toBeVisible({ timeout: 15_000 })

    // Update price field
    const priceInput = page.getByLabel(/price/i)
    await priceInput.clear()
    await priceInput.fill('12.99')

    // Submit
    await page.getByRole('button', { name: /save changes/i }).click()

    // Should redirect to product list ($ anchor prevents matching the edit URL we're already on)
    await expect(page).toHaveURL(/\/admin\/products$/, { timeout: 15_000 })

    // Verify in DB
    const updated = await getProductByName(NEW_PRODUCT_NAME)
    expect(updated).not.toBeNull()
    expect(Number(updated.price)).toBeCloseTo(12.99, 2)
  })

  test('3 — admin deletes the product', async ({ page }) => {
    // Verify product exists in DB
    const existing = await getProductByName(NEW_PRODUCT_NAME)
    expect(existing).not.toBeNull()

    // Accept the browser confirm dialog automatically
    page.on('dialog', (dialog) => dialog.accept())

    // Click the delete button for our product using its aria-label
    const deleteBtn = page.getByRole('button', { name: new RegExp(`Delete ${NEW_PRODUCT_NAME}`, 'i') })
    await expect(deleteBtn).toBeVisible({ timeout: 10_000 })
    await deleteBtn.click()

    // Wait for the product to disappear from the list
    await expect(deleteBtn).not.toBeVisible({ timeout: 10_000 })

    // Verify in DB — product should be gone
    const deleted = await getProductByName(NEW_PRODUCT_NAME)
    expect(deleted).toBeNull()
  })
})
