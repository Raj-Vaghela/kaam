import { describe, it, expect, vi, beforeEach } from 'vitest'

// Hoist mock factories so they are available inside vi.mock() closures
const { mockGetUser, mockSingle, mockEq, mockSelect, mockInsert, mockFrom, mockLogAdminAction } =
  vi.hoisted(() => {
    const mockSingle = vi.fn()
    const mockEq = vi.fn()
    const mockSelect = vi.fn()
    const mockInsert = vi.fn()
    const mockFrom = vi.fn()
    const mockGetUser = vi.fn()
    const mockLogAdminAction = vi.fn()
    return { mockGetUser, mockSingle, mockEq, mockSelect, mockInsert, mockFrom, mockLogAdminAction }
  })

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}))

vi.mock('@/lib/audit', () => ({
  logAdminAction: mockLogAdminAction,
}))

import { addProduct, updateProduct } from '@/app/actions'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData()
  Object.entries(fields).forEach(([k, v]) => fd.append(k, v))
  return fd
}

const validProductFields: Record<string, string> = {
  name: 'Test Product',
  category: 'snacks',
  price: '9.99',
  image_url: 'https://example.com/img.jpg',
  unit: 'kg',
  stock: '10',
  bestseller: 'off',
}

// Chain shapes
//   profiles: .from('profiles').select('role').eq('id', userId).single()
//   products: .from('products').insert({...})

const profileChain = {
  select: vi.fn(),
}
const profileSelectChain = {
  eq: vi.fn(),
}
const profileEqChain = {
  single: mockSingle,
}

const productChain = {
  insert: mockInsert,
}

beforeEach(() => {
  vi.clearAllMocks()

  // Wire up profile query chain
  profileChain.select.mockReturnValue(profileSelectChain)
  profileSelectChain.eq.mockReturnValue(profileEqChain)

  // mockFrom dispatches based on table name
  mockFrom.mockImplementation((table: string) => {
    if (table === 'profiles') return profileChain
    if (table === 'products') return productChain
    return profileChain
  })

  // Default: no-op audit
  mockLogAdminAction.mockResolvedValue(undefined)
})

// ---------------------------------------------------------------------------
// addProduct
// ---------------------------------------------------------------------------

describe('addProduct — auth guards', () => {
  it('returns Unauthorized when no user is authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const result = await addProduct(makeFormData(validProductFields))

    expect(result).toEqual({ success: false, message: 'Unauthorized' })
  })

  it('returns Unauthorized when the caller role is customer', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockSingle.mockResolvedValue({ data: { role: 'customer' } })

    const result = await addProduct(makeFormData(validProductFields))

    expect(result).toEqual({ success: false, message: 'Unauthorized' })
  })

  it('returns success when the caller is an admin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-1' } } })
    mockSingle.mockResolvedValue({ data: { role: 'admin' } })
    mockInsert.mockResolvedValue({ error: null })

    const result = await addProduct(makeFormData(validProductFields))

    expect(result).toEqual({ success: true })
  })
})

// ---------------------------------------------------------------------------
// updateProduct
// ---------------------------------------------------------------------------

describe('updateProduct — auth guards', () => {
  it('returns Unauthorized when no user is authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const result = await updateProduct('product-123', makeFormData(validProductFields))

    expect(result).toEqual({ success: false, message: 'Unauthorized' })
  })

  it('returns Unauthorized when the caller is not an admin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-2' } } })
    mockSingle.mockResolvedValue({ data: { role: 'customer' } })

    const result = await updateProduct('product-123', makeFormData(validProductFields))

    expect(result).toEqual({ success: false, message: 'Unauthorized' })
  })
})
