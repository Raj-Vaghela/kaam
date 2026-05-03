import dotenv from 'dotenv'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.resolve(__dirname, '../.env.test') })

export const TEST_ADMIN_EMAIL = 'test-admin@gajjuexpress.test'
export const TEST_ADMIN_PASSWORD = 'TestAdmin@9876!'

export const TEST_PRODUCTS = [
  { name: 'Test Basmati Rice 1kg', category: 'Rice', price: 5.99, unit: '1kg', stock: 100, image_url: 'https://placehold.co/400', bestseller: true },
  { name: 'Test Atta Flour 5kg', category: 'Flour', price: 8.49, unit: '5kg', stock: 50, image_url: 'https://placehold.co/400', bestseller: false },
  { name: 'Test Mustard Oil 1L', category: 'Oils', price: 4.99, unit: '1L', stock: 75, image_url: 'https://placehold.co/400', bestseller: false },
  { name: 'Test Mango Pickle 500g', category: 'Pickles', price: 3.49, unit: '500g', stock: 200, image_url: 'https://placehold.co/400', bestseller: false },
  { name: 'Test Turmeric Powder 200g', category: 'Spices', price: 1.99, unit: '200g', stock: 150, image_url: 'https://placehold.co/400', bestseller: false },
]

async function globalSetup() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

  // 1. Create admin user if not exists
  const { data: existingUsers } = await db.auth.admin.listUsers()
  const adminExists = existingUsers.users.some(u => u.email === TEST_ADMIN_EMAIL)

  if (!adminExists) {
    const { data: newUser, error } = await db.auth.admin.createUser({
      email: TEST_ADMIN_EMAIL,
      password: TEST_ADMIN_PASSWORD,
      email_confirm: true,
    })
    if (error) throw new Error(`Failed to create admin user: ${error.message}`)
    await db.from('profiles').upsert({
      id: newUser.user!.id,
      role: 'admin',
    })
    console.log('Admin user created')
  } else {
    // Ensure existing user has admin role in profiles
    const adminUser = existingUsers.users.find(u => u.email === TEST_ADMIN_EMAIL)!
    await db.from('profiles').upsert({ id: adminUser.id, role: 'admin' })
    console.log('Admin user already exists')
  }

  // 2. Seed test products
  for (const product of TEST_PRODUCTS) {
    const { error } = await db.from('products').upsert(product, { onConflict: 'name' })
    if (error) console.warn(`Warning: could not seed product "${product.name}": ${error.message}`)
  }
  console.log(`${TEST_PRODUCTS.length} test products seeded`)

  // 3. Seed a test order for admin order tests (delete-first for idempotency)
  const { data: firstProduct } = await db.from('products').select('id, name, price').limit(1).single()
  if (firstProduct) {
    await db.from('orders').delete().eq('guest_email', 'seed-order@test.gajjuexpress')
    await db.from('orders').insert({
      guest_email: 'seed-order@test.gajjuexpress',
      status: 'pending',
      total: firstProduct.price,
      shipping_address: {
        name: 'Seed Test User',
        line1: '1 Seed Street',
        city: 'London',
        postcode: 'E1 1AA',
        phone: '07700900000',
      },
    })
    console.log('✓ Seed order created')
  }
}

export default globalSetup
