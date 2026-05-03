import { describe, it, expect } from 'vitest'
import { calculateVAT } from '@/lib/invoice'

describe('calculateVAT', () => {
  it('applies 20% VAT to a standard subtotal', () => {
    const result = calculateVAT(100)
    expect(result.vatAmount).toBe(20)
    expect(result.total).toBe(120)
  })

  it('applies a custom VAT rate', () => {
    const result = calculateVAT(100, 5)
    expect(result.vatAmount).toBe(5)
    expect(result.total).toBe(105)
  })

  it('returns zero VAT on a zero subtotal', () => {
    const result = calculateVAT(0)
    expect(result.vatAmount).toBe(0)
    expect(result.total).toBe(0)
  })

  it('rounds to 2 decimal places', () => {
    const result = calculateVAT(3.33)
    expect(result.vatAmount).toBe(0.67)
    expect(result.total).toBe(4)
  })

  it('handles large amounts correctly', () => {
    const result = calculateVAT(9999.99)
    expect(result.vatAmount).toBe(2000)
    expect(result.total).toBe(11999.99)
  })
})
