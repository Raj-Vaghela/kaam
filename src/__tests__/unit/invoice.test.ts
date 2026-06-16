import { describe, it, expect } from 'vitest'
import { calculateVAT } from '@/lib/invoice'

// calculateVAT() implements UK Price Marking Order 2004 VAT-INCLUSIVE math:
// the subtotal argument is the gross consumer-facing price, and VAT is extracted
// from it (vatAmount = subtotal - subtotal/divisor). Tests below assume the
// VAT_REGISTERED gate is on (set in vitest.config.ts).

describe('calculateVAT (VAT-inclusive extraction)', () => {
  it('extracts 20% VAT from a £100 gross subtotal', () => {
    const result = calculateVAT(100)
    expect(result.netAmount).toBe(83.33)
    expect(result.vatAmount).toBe(16.67)
    expect(result.total).toBe(100)
  })

  it('extracts a custom 5% VAT rate from a £100 gross subtotal', () => {
    const result = calculateVAT(100, 5)
    expect(result.netAmount).toBe(95.24)
    expect(result.vatAmount).toBe(4.76)
    expect(result.total).toBe(100)
  })

  it('returns all zeros for a zero subtotal', () => {
    const result = calculateVAT(0)
    expect(result.netAmount).toBe(0)
    expect(result.vatAmount).toBe(0)
    expect(result.total).toBe(0)
  })

  it('rounds to 2 decimal places', () => {
    const result = calculateVAT(3.33)
    expect(result.netAmount).toBe(2.78)
    expect(result.vatAmount).toBe(0.55)
    expect(result.total).toBe(3.33)
  })

  it('handles large amounts correctly', () => {
    const result = calculateVAT(9999.99)
    expect(result.netAmount).toBe(8333.33)
    expect(result.vatAmount).toBe(1666.66)
    expect(result.total).toBe(9999.99)
  })
})
