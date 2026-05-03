import dotenv from 'dotenv'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.resolve(__dirname, '../.env.test') })

async function globalTeardown() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

  await db.from('orders').delete().like('guest_email', '%@test.gajjuexpress%')
  await db.from('newsletter_subscribers').delete().like('email', '%@test.gajjuexpress%')

  console.log('E2E test data cleaned up')
}

export default globalTeardown
