import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockSingle, mockEq, mockSelect, mockFrom } = vi.hoisted(() => {
  const mockSingle = vi.fn()
  const mockEq = vi.fn()
  const mockSelect = vi.fn()
  const mockFrom = vi.fn()
  return { mockSingle, mockEq, mockSelect, mockFrom }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    from: mockFrom,
  }),
}))

import { validatePromoCode } from '@/app/actions'

beforeEach(() => {
  vi.clearAllMocks()
  mockFrom.mockReturnValue({ select: mockSelect })
  mockSelect.mockReturnValue({ eq: mockEq })
  // Chain eq().eq() — first eq returns object with another eq, second returns object with single
  mockEq.mockReturnValue({ eq: mockEq, single: mockSingle })
})

const validPromo = {
  code: 'SAVE10',
  active: true,
  expires_at: null,
  max_uses: null,
  uses_count: 0,
  min_order_value: 0,
  discount_type: 'percent',
  discount_value: 10,
  description: '10% off',
}

describe('validatePromoCode', () => {
  it('returns valid:true and correct discountAmount for a percent promo', async () => {
    mockSingle.mockResolvedValue({ data: validPromo })
    const result = await validatePromoCode('SAVE10', 50)
    expect(result.valid).toBe(true)
    expect(result.discountAmount).toBe(5)
    expect(result.description).toBe('10% off')
  })

  it('is case-insensitive', async () => {
    mockSingle.mockResolvedValue({ data: validPromo })
    const result = await validatePromoCode('save10', 50)
    expect(result.valid).toBe(true)
  })

  it('returns valid:false when promo not found', async () => {
    mockSingle.mockResolvedValue({ data: null })
    const result = await validatePromoCode('NOTREAL', 50)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Invalid or expired promo code')
  })

  it('returns valid:false when promo is expired', async () => {
    mockSingle.mockResolvedValue({ data: { ...validPromo, expires_at: '2020-01-01T00:00:00Z' } })
    const result = await validatePromoCode('SAVE10', 50)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('This code has expired')
  })

  it('returns valid:false when max uses reached', async () => {
    mockSingle.mockResolvedValue({ data: { ...validPromo, max_uses: 10, uses_count: 10 } })
    const result = await validatePromoCode('SAVE10', 50)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('This code has reached its usage limit')
  })

  it('returns valid:false when order is below minimum', async () => {
    mockSingle.mockResolvedValue({ data: { ...validPromo, min_order_value: 100 } })
    const result = await validatePromoCode('SAVE10', 50)
    expect(result.valid).toBe(false)
    expect((result.error as string)).toContain('Minimum order of £100.00')
  })

  it('applies fixed discount correctly', async () => {
    mockSingle.mockResolvedValue({ data: { ...validPromo, discount_type: 'fixed', discount_value: 5 } })
    const result = await validatePromoCode('SAVE10', 50)
    expect(result.valid).toBe(true)
    expect(result.discountAmount).toBe(5)
  })

  it('caps percent discount at the subtotal', async () => {
    mockSingle.mockResolvedValue({ data: { ...validPromo, discount_value: 200 } })
    const result = await validatePromoCode('SAVE10', 50)
    expect(result.valid).toBe(true)
    expect(result.discountAmount).toBe(50)
  })
})
