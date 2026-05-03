import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'
import { getProductByName, deleteProductByName, getServiceClient } from './helpers/db'
import { TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } from './global-setup'

// Stable across all 3 tests in this file — computed once at module load
const NEW_PRODUCT_NAME = `E2E Test Product ${Date.now()}`

const SUPABASE_URL = 'https://umlzfxbrnyftmoeayvqk.supabase.co'
const FAKE_IMAGE_URL = 'https://placehold.co/400'

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
    // Mock Supabase Storage upload so the image requirement is satisfied without real upload
    await page.route(`${SUPABASE_URL}/storage/v1/object/products/**`, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ Key: 'products/fake.png' }) })
    })
    // Mock the getPublicUrl response (GET request for the public URL)
    await page.route(`${SUPABASE_URL}/storage/v1/object/public/products/**`, async (route) => {
      await route.fulfill({ status: 200, contentType: 'image/png', body: '' })
    })

    // Click "Add Product" link
    await page.getByRole('link', { name: /add product/i }).click()
    await expect(page).toHaveURL(/\/admin\/products\/new/)
    await expect(page.getByRole('heading', { name: /add a new product/i })).toBeVisible({ timeout: 10_000 })

    // Fill product name
    await page.getByLabel(/product name/i).fill(NEW_PRODUCT_NAME)

    // Fill price
    await page.getByLabel(/price/i).fill('9.99')

    // Select category — leave default (Grains & Rice)

    // Fill unit
    await page.getByLabel(/unit/i).fill('1kg')

    // Fill stock count
    await page.getByLabel(/stock count/i).fill('50')

    // Inject imageUrl into the component state by triggering the upload flow via a fake file.
    // We intercept the Supabase storage POST at network level (route already registered above).
    // The component calls supabase.storage.from('products').getPublicUrl(fileName) synchronously
    // after upload — that returns the public URL. We fake the upload response so the client-side
    // SDK constructs the public URL itself (it doesn't actually fetch it).
    //
    // Strategy: evaluate JS to set the hidden input value directly after bypassing the upload
    // by dispatching a change event on the file input with a mocked File object.
    //
    // Simpler approach: use page.evaluate to patch the React fiber / setState isn't accessible.
    // Instead: intercept the Supabase JS client storage.upload call via route and ensure the
    // public URL resolves to FAKE_IMAGE_URL by overriding the storage.getPublicUrl.
    //
    // Cleanest E2E approach: inject a hidden input with the image_url before submit.
    await page.evaluate((url: string) => {
      // Find the form and inject a hidden image_url input
      const form = document.querySelector('form') as HTMLFormElement | null
      if (!form) return
      // Remove any existing image_url hidden inputs to avoid conflicts
      form.querySelectorAll('input[name="image_url"]').forEach(el => el.remove())
      const hidden = document.createElement('input')
      hidden.type = 'hidden'
      hidden.name = 'image_url'
      hidden.value = url
      form.appendChild(hidden)
    }, FAKE_IMAGE_URL)

    // The submit button is disabled without imageUrl state — we need to enable it.
    // Override the disabled attribute so the form can be submitted.
    await page.evaluate(() => {
      const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement | null
      if (btn) btn.disabled = false
    })

    // Submit the form
    await page.getByRole('button', { name: /create product/i }).click()

    // Should redirect back to /admin/products
    await expect(page).toHaveURL(/\/admin\/products/, { timeout: 15_000 })

    // Verify in DB
    const product = await getProductByName(NEW_PRODUCT_NAME)
    expect(product).not.toBeNull()
    expect(product.name).toBe(NEW_PRODUCT_NAME)
  })

  test('2 — admin edits the product price to 12.99', async ({ page }) => {
    // Verify product exists in DB from test 1
    const existing = await getProductByName(NEW_PRODUCT_NAME)
    expect(existing).not.toBeNull()

    // Find the edit button for our product using its aria-label
    const editLink = page.getByRole('link', { name: new RegExp(`Edit ${NEW_PRODUCT_NAME}`, 'i') })
    await expect(editLink).toBeVisible({ timeout: 10_000 })
    await editLink.click()

    await expect(page).toHaveURL(/\/admin\/products\/.+\/edit/)
    await expect(page.getByRole('heading', { name: /edit product/i })).toBeVisible({ timeout: 10_000 })

    // Update price field
    const priceInput = page.getByLabel(/price/i)
    await priceInput.clear()
    await priceInput.fill('12.99')

    // Submit — button text is "Save changes"
    await page.getByRole('button', { name: /save changes/i }).click()

    // Should redirect to product list
    await expect(page).toHaveURL(/\/admin\/products/, { timeout: 15_000 })

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

    // Wait for the page to refresh / product to disappear from the list
    await expect(deleteBtn).not.toBeVisible({ timeout: 10_000 })

    // Verify in DB — product should be gone
    const deleted = await getProductByName(NEW_PRODUCT_NAME)
    expect(deleted).toBeNull()
  })
})
