import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'
import { getServiceClient } from './helpers/db'
import { TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } from './global-setup'

// "shipped" is the closest status to "dispatched" in the actual status model.
// The order detail page uses ALL_STATUSES which includes: pending, payment_failed,
// payment_received, paid, processing, shipped, delivered, cancelled.
const TARGET_STATUS = 'shipped'
const TARGET_STATUS_LABEL = 'Shipped'

test.describe('Admin — order management', () => {
  test('admin can update an order status to shipped', async ({ page }) => {
    // 1. Login as admin
    await loginAs(page, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD)

    // 2. Navigate to orders list
    await page.goto('/admin/orders')
    await expect(page.getByRole('heading', { name: /orders/i })).toBeVisible({ timeout: 15_000 })

    // 3. Click the first "View" link to open an order detail page
    const firstViewLink = page.getByRole('link', { name: /view/i }).first()
    await expect(firstViewLink).toBeVisible({ timeout: 10_000 })
    await firstViewLink.click()

    // 4. Wait for the order detail page to load
    await expect(page).toHaveURL(/\/admin\/orders\/.+/, { timeout: 15_000 })
    await expect(page.getByText(/update status/i)).toBeVisible({ timeout: 10_000 })

    // Extract the order ID from the URL for DB assertion
    const orderId = page.url().split('/').pop()
    expect(orderId).toBeTruthy()

    // 5. Change the status dropdown to "shipped"
    const statusSelect = page.locator('select[name="status"]')
    await expect(statusSelect).toBeVisible()
    await statusSelect.selectOption(TARGET_STATUS)

    // 6. Click "Update Status"
    await page.getByRole('button', { name: /update status/i }).click()

    // 7. Assert the new status label appears on screen
    await expect(page.getByText(TARGET_STATUS_LABEL)).toBeVisible({ timeout: 15_000 })

    // 8. Assert in DB that status = TARGET_STATUS for this order
    const db = getServiceClient()
    const { data: order, error } = await db
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .single()

    expect(error).toBeNull()
    expect(order).not.toBeNull()
    expect(order!.status).toBe(TARGET_STATUS)
  })
})
