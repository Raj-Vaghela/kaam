import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'
import { getServiceClient } from './helpers/db'
import { TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } from './global-setup'

const TARGET_STATUS = 'shipped'
const TARGET_STATUS_LABEL = 'Shipped'

test.describe('Admin — order management', () => {
  test('admin can update an order status to shipped', async ({ page }) => {
    // 1. Login as admin
    await loginAs(page, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD)

    // 2. Get the seed order ID from DB to navigate directly (avoids RSC client-nav flakiness)
    const db = getServiceClient()
    const { data: seedOrder } = await db
      .from('orders')
      .select('id')
      .eq('guest_email', 'seed-order@test.gajjuexpress')
      .single()

    expect(seedOrder).not.toBeNull()
    const orderId = seedOrder!.id

    // Reset order status to 'pending' so the test is idempotent
    await db.from('orders').update({ status: 'pending' }).eq('id', orderId)

    // 3. Navigate directly to the order detail page
    await page.goto(`/admin/orders/${orderId}`)
    await expect(page.getByRole('heading', { name: /update status/i })).toBeVisible({ timeout: 15_000 })

    // 4. Change the status dropdown to "shipped"
    const statusSelect = page.locator('select[name="status"]')
    await expect(statusSelect).toBeVisible()
    await statusSelect.selectOption(TARGET_STATUS)

    // 5. Click "Update Status"
    await page.getByRole('button', { name: /update status/i }).click()

    // 6. Assert the new status label appears on screen (scoped to the badge span, not the select option)
    await expect(page.locator('span').filter({ hasText: new RegExp(`^${TARGET_STATUS_LABEL}$`) }).first()).toBeVisible({ timeout: 15_000 })

    // 7. Assert in DB
    const { data: order } = await db
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .single()

    expect(order).not.toBeNull()
    expect(order!.status).toBe(TARGET_STATUS)
  })
})
