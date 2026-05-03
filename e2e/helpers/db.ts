import { createClient } from '@supabase/supabase-js'

export function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!url || !key) throw new Error('Missing SUPABASE env vars in .env.test')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function getOrderByEmail(email: string) {
  const db = getServiceClient()
  const { data } = await db
    .from('orders')
    .select('*')
    .eq('guest_email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return data
}

export async function getNewsletterSubscriber(email: string) {
  const db = getServiceClient()
  const { data } = await db
    .from('newsletter_subscribers')
    .select('*')
    .eq('email', email)
    .single()
  return data
}

export async function deleteOrdersByEmail(email: string) {
  const db = getServiceClient()
  await db.from('orders').delete().eq('guest_email', email)
}

export async function deleteNewsletterSubscriber(email: string) {
  const db = getServiceClient()
  await db.from('newsletter_subscribers').delete().eq('email', email)
}

export async function getWishlistItems(userId: string) {
  const db = getServiceClient()
  const { data } = await db
    .from('user_wishlists')
    .select('*, products(*)')
    .eq('user_id', userId)
  return data ?? []
}

export async function getUserByEmail(email: string) {
  const db = getServiceClient()
  const { data } = await db.auth.admin.listUsers()
  return data.users.find(u => u.email === email) ?? null
}

export async function getProductByName(name: string) {
  const db = getServiceClient()
  const { data } = await db
    .from('products')
    .select('*')
    .eq('name', name)
    .single()
  return data
}

export async function deleteProductByName(name: string) {
  const db = getServiceClient()
  await db.from('products').delete().eq('name', name)
}
