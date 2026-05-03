# GajjuExpress Pre-Launch Test Strategy — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install Vitest + Playwright, write unit tests for all pure business logic, and write E2E tests for all 8 critical user journeys, so every path that generates revenue or touches user data is verified before launch.

**Architecture:** Two-layer pyramid — Vitest unit tests run in milliseconds with all external services mocked, Playwright E2E tests run against the real staging Supabase (`umlzfxbrnyftmoeayvqk`) and Stripe test mode. A global Playwright setup script seeds deterministic test data before the suite runs.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Vitest, @testing-library/react, Playwright, Supabase JS v2, Stripe test mode, happy-dom

---

## File Map

```
vitest.config.ts                           create — Vitest config pointing at happy-dom
.env.test                                  create — staging Supabase + Stripe test keys
src/__tests__/unit/invoice.test.ts         create — calculateVAT + generateInvoiceNumber
src/__tests__/unit/cart.test.ts            create — cartTotal, cartCount, addToCart, updateQty
src/__tests__/unit/promo-code.test.ts      create — validatePromoCode branches
src/__tests__/unit/auth-guards.test.ts     create — addProduct/updateProduct unauthorized paths
playwright.config.ts                       create — Playwright config with staging env + webServer
e2e/global-setup.ts                        create — seed admin user + test products into staging
e2e/global-teardown.ts                     create — clean up test data after full suite
e2e/helpers/db.ts                          create — Supabase service-role helper for assertions
e2e/helpers/auth.ts                        create — reusable email/password login via Playwright UI
e2e/newsletter.spec.ts                     create — E2E: newsletter signup + duplicate handling
e2e/wishlist.spec.ts                       create — E2E: wishlist add/remove for logged-in user
e2e/guest-checkout.spec.ts                 create — E2E: guest checkout → Stripe → order created
e2e/user-auth-checkout.spec.ts             create — E2E: register → login → checkout
e2e/google-oauth.spec.ts                   create — E2E: OAuth redirect URL verification
e2e/admin-products.spec.ts                 create — E2E: admin add/edit/delete product
e2e/admin-orders.spec.ts                   create — E2E: admin update order status
.github/workflows/tests.yml                create — CI: run vitest + playwright on every PR
```

---

## Phase 1 — Setup

### Task 1: Install Vitest and configure it

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Install dependencies**

```bash
cd /path/to/kaam
npm install -D vitest @vitest/coverage-v8 happy-dom @testing-library/react @testing-library/user-event @vitejs/plugin-react
```

Expected: packages added to `devDependencies` in `package.json`, no errors.

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    env: {
      // Prevents "NEXT_PUBLIC_* must be set" errors in tested modules
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_placeholder',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 3: Create `src/__tests__/setup.ts`**

```ts
import { vi } from 'vitest'

// Mock next/cache globally — revalidatePath is a no-op in tests
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

// Mock next/headers globally — used by Supabase SSR client
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockReturnValue({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    getAll: vi.fn().mockReturnValue([]),
  }),
}))

// Mock next/navigation globally — used by CartContext
vi.mock('next/navigation', () => ({
  useRouter: vi.fn().mockReturnValue({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: vi.fn().mockReturnValue('/'),
  useSearchParams: vi.fn().mockReturnValue(new URLSearchParams()),
}))
```

- [ ] **Step 4: Add test scripts to `package.json`**

In `package.json`, inside `"scripts"`, add:

```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

- [ ] **Step 5: Run Vitest to confirm it boots**

```bash
npx vitest run
```

Expected output: `No test files found` (or similar). Exit code 0 or 1 with no crash.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts src/__tests__/setup.ts package.json package-lock.json
git commit -m "chore: install and configure vitest with happy-dom"
```

---

### Task 2: Create `.env.test`

**Files:**
- Create: `.env.test`

- [ ] **Step 1: Create `.env.test` pointing at staging**

Create the file at the project root. Use the values from your staging project (`umlzfxbrnyftmoeayvqk`) and your existing Stripe test keys from `.env.local`:

```bash
# .env.test — staging Supabase + Stripe test mode
# NEVER commit this file — it is gitignored
NEXT_PUBLIC_SUPABASE_URL=https://umlzfxbrnyftmoeayvqk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<copy from .env.local>
SUPABASE_SERVICE_ROLE_KEY=<copy from .env.local>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<copy pk_test_ key from .env.local>
STRIPE_SECRET_KEY=<copy sk_test_ key from .env.local>
STRIPE_WEBHOOK_SECRET=<copy from .env.local>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- [ ] **Step 2: Verify `.env.test` is gitignored**

```bash
git check-ignore -v .env.test
```

Expected: `.gitignore:N:.env.test` (or similar showing it is ignored). If not shown, add `.env.test` to `.gitignore`.

---

## Phase 2 — Unit Tests

### Task 3: Unit tests — `calculateVAT`

**Files:**
- Create: `src/__tests__/unit/invoice.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
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
    // £3.33 at 20% = £0.666 VAT — should round to £0.67
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
```

- [ ] **Step 2: Run to verify failures**

```bash
npx vitest run src/__tests__/unit/invoice.test.ts
```

Expected: tests fail with import errors or assertion failures (since we haven't confirmed the function — this verifies the test harness is wired up).

- [ ] **Step 3: Run again — should pass (function already exists)**

`calculateVAT` is already implemented in `src/lib/invoice.ts`. If Step 2 failed with assertion errors rather than import errors, the implementation needs a fix — check the rounding logic. If Step 2 failed only with import issues, fix the import path and re-run.

```bash
npx vitest run src/__tests__/unit/invoice.test.ts
```

Expected: `5 passed`.

- [ ] **Step 4: Commit**

```bash
git add src/__tests__/unit/invoice.test.ts
git commit -m "test: unit tests for calculateVAT"
```

---

### Task 4: Unit tests — Cart logic

**Files:**
- Create: `src/__tests__/unit/cart.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { CartProvider, useCart } from '@/context/CartContext'
import { Product } from '@/types'
import React from 'react'

// localStorage is available in happy-dom but starts empty each test
beforeEach(() => {
  localStorage.clear()
})

const mockProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'prod-1',
  name: 'Basmati Rice 1kg',
  category: 'Rice',
  imgUrl: 'https://example.com/rice.jpg',
  price: 5.99,
  unit: '1kg',
  weight_kg: 1,
  rating: 4.5,
  bestseller: false,
  clubPrice: null,
  stock: 100,
  ...overrides,
})

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(CartProvider, null, children)

describe('CartContext — cartTotal and cartCount', () => {
  it('starts with empty cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    expect(result.current.cart).toHaveLength(0)
    expect(result.current.cartTotal).toBe(0)
    expect(result.current.cartCount).toBe(0)
  })

  it('calculates cartTotal correctly after adding items', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => {
      result.current.addToCart(mockProduct({ price: 5.99 }), 2)
    })
    expect(result.current.cartTotal).toBeCloseTo(11.98, 2)
    expect(result.current.cartCount).toBe(2)
  })

  it('accumulates multiple different products', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => {
      result.current.addToCart(mockProduct({ id: 'prod-1', price: 5.99 }), 1)
      result.current.addToCart(mockProduct({ id: 'prod-2', price: 3.49 }), 2)
    })
    expect(result.current.cartTotal).toBeCloseTo(12.97, 2)
    expect(result.current.cartCount).toBe(3)
  })

  it('increments quantity when same product added twice', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => {
      result.current.addToCart(mockProduct(), 1)
      result.current.addToCart(mockProduct(), 1)
    })
    expect(result.current.cart).toHaveLength(1)
    expect(result.current.cart[0].qty).toBe(2)
    expect(result.current.cartCount).toBe(2)
  })

  it('uses clubPrice when available', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => {
      result.current.addToCart(mockProduct({ price: 5.99, clubPrice: 4.99 }), 1)
    })
    expect(result.current.cart[0].price).toBe(4.99)
    expect(result.current.cartTotal).toBeCloseTo(4.99, 2)
  })
})

describe('CartContext — removeFromCart and updateQty', () => {
  it('removes an item from the cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => {
      result.current.addToCart(mockProduct({ id: 'prod-1' }), 2)
      result.current.addToCart(mockProduct({ id: 'prod-2' }), 1)
    })
    act(() => {
      result.current.removeFromCart('prod-1')
    })
    expect(result.current.cart).toHaveLength(1)
    expect(result.current.cart[0].id).toBe('prod-2')
  })

  it('updates quantity of an item', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => {
      result.current.addToCart(mockProduct(), 1)
    })
    act(() => {
      result.current.updateQty('prod-1', 5)
    })
    expect(result.current.cart[0].qty).toBe(5)
    expect(result.current.cartCount).toBe(5)
  })

  it('removes item when updateQty is called with 0', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => {
      result.current.addToCart(mockProduct(), 3)
    })
    act(() => {
      result.current.updateQty('prod-1', 0)
    })
    expect(result.current.cart).toHaveLength(0)
  })

  it('clears all items', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => {
      result.current.addToCart(mockProduct({ id: 'prod-1' }), 2)
      result.current.addToCart(mockProduct({ id: 'prod-2' }), 1)
    })
    act(() => {
      result.current.clearCart()
    })
    expect(result.current.cart).toHaveLength(0)
    expect(result.current.cartTotal).toBe(0)
  })
})
```

- [ ] **Step 2: Run to verify failures**

```bash
npx vitest run src/__tests__/unit/cart.test.ts
```

Expected: tests fail (CartContext not imported yet or localStorage not mocked).

- [ ] **Step 3: Run until passing**

Fix any import path issues. All cart logic already exists in `src/context/CartContext.tsx`. Run:

```bash
npx vitest run src/__tests__/unit/cart.test.ts
```

Expected: `11 passed`.

- [ ] **Step 4: Commit**

```bash
git add src/__tests__/unit/cart.test.ts
git commit -m "test: unit tests for CartContext logic"
```

---

### Task 5: Unit tests — `validatePromoCode`

**Files:**
- Create: `src/__tests__/unit/promo-code.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validatePromoCode } from '@/app/actions'

// We mock createClient to return a controllable Supabase stub
const mockSingle = vi.fn()
const mockEq = vi.fn().mockReturnThis()
const mockSelect = vi.fn().mockReturnThis()
const mockFrom = vi.fn().mockReturnValue({
  select: mockSelect,
  eq: mockEq,
  single: mockSingle,
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    from: mockFrom,
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockFrom.mockReturnValue({ select: mockSelect, eq: mockEq, single: mockSingle })
  mockSelect.mockReturnThis()
  mockEq.mockReturnThis()
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
  it('returns valid true and discount for a valid percent promo', async () => {
    mockSingle.mockResolvedValue({ data: validPromo })
    const result = await validatePromoCode('SAVE10', 50)
    expect(result.valid).toBe(true)
    expect(result.discountAmount).toBe(5) // 10% of £50
    expect(result.description).toBe('10% off')
  })

  it('is case-insensitive — normalises to uppercase', async () => {
    mockSingle.mockResolvedValue({ data: validPromo })
    const result = await validatePromoCode('save10', 50)
    expect(result.valid).toBe(true)
  })

  it('returns valid false when promo not found', async () => {
    mockSingle.mockResolvedValue({ data: null })
    const result = await validatePromoCode('NOTREAL', 50)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Invalid or expired promo code')
  })

  it('returns valid false when promo is expired', async () => {
    mockSingle.mockResolvedValue({
      data: { ...validPromo, expires_at: '2020-01-01T00:00:00Z' },
    })
    const result = await validatePromoCode('SAVE10', 50)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('This code has expired')
  })

  it('returns valid false when max uses reached', async () => {
    mockSingle.mockResolvedValue({
      data: { ...validPromo, max_uses: 10, uses_count: 10 },
    })
    const result = await validatePromoCode('SAVE10', 50)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('This code has reached its usage limit')
  })

  it('returns valid false when order is below minimum', async () => {
    mockSingle.mockResolvedValue({
      data: { ...validPromo, min_order_value: 100 },
    })
    const result = await validatePromoCode('SAVE10', 50)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Minimum order of £100.00')
  })

  it('applies fixed discount correctly', async () => {
    mockSingle.mockResolvedValue({
      data: { ...validPromo, discount_type: 'fixed', discount_value: 5 },
    })
    const result = await validatePromoCode('SAVE10', 50)
    expect(result.valid).toBe(true)
    expect(result.discountAmount).toBe(5)
  })

  it('caps percent discount at the subtotal (does not go negative)', async () => {
    mockSingle.mockResolvedValue({
      data: { ...validPromo, discount_type: 'percent', discount_value: 200 },
    })
    const result = await validatePromoCode('SAVE10', 50)
    expect(result.valid).toBe(true)
    expect(result.discountAmount).toBe(50) // capped at subtotal
  })
})
```

- [ ] **Step 2: Run to verify failures**

```bash
npx vitest run src/__tests__/unit/promo-code.test.ts
```

Expected: some pass, some fail depending on mock wiring.

- [ ] **Step 3: Fix mock chain and run until all pass**

The Supabase query chain is `.from().select().eq().eq().single()`. Make sure the mock chain returns `this` at each step except `single` which returns the resolved data. Adjust the mock in the test if needed. Then:

```bash
npx vitest run src/__tests__/unit/promo-code.test.ts
```

Expected: `8 passed`.

- [ ] **Step 4: Commit**

```bash
git add src/__tests__/unit/promo-code.test.ts
git commit -m "test: unit tests for validatePromoCode"
```

---

### Task 6: Unit tests — Server action auth guards

**Files:**
- Create: `src/__tests__/unit/auth-guards.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { addProduct, updateProduct, deleteProduct } from '@/app/actions'

const mockGetUser = vi.fn()
const mockSingle = vi.fn()
const mockInsert = vi.fn().mockResolvedValue({ error: null })
const mockUpdate = vi.fn().mockResolvedValue({ error: null })
const mockDelete = vi.fn().mockResolvedValue({ error: null })
const mockEq = vi.fn().mockReturnThis()
const mockSelect = vi.fn().mockReturnThis()
const mockFrom = vi.fn().mockReturnValue({
  select: mockSelect,
  eq: mockEq,
  single: mockSingle,
  insert: mockInsert,
  update: mockUpdate,
  delete: vi.fn().mockReturnThis(),
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}))

vi.mock('@/lib/audit', () => ({
  logAdminAction: vi.fn().mockResolvedValue(undefined),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockFrom.mockReturnValue({
    select: mockSelect,
    eq: mockEq,
    single: mockSingle,
    insert: mockInsert,
    update: mockUpdate,
    delete: vi.fn().mockReturnValue({ eq: mockEq }),
  })
  mockSelect.mockReturnThis()
  mockEq.mockReturnThis()
})

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData()
  Object.entries(fields).forEach(([k, v]) => fd.append(k, v))
  return fd
}

describe('addProduct — auth guards', () => {
  it('returns Unauthorized when not logged in', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = await addProduct(makeFormData({ name: 'Rice', price: '5.99', category: 'Grains', image_url: '', unit: 'kg', stock: '10' }))
    expect(result).toEqual({ success: false, message: 'Unauthorized' })
  })

  it('returns Unauthorized when logged in but not admin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    mockSingle.mockResolvedValue({ data: { role: 'customer' } })
    const result = await addProduct(makeFormData({ name: 'Rice', price: '5.99', category: 'Grains', image_url: '', unit: 'kg', stock: '10' }))
    expect(result).toEqual({ success: false, message: 'Unauthorized' })
  })

  it('succeeds when logged in as admin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-123' } } })
    mockSingle.mockResolvedValue({ data: { role: 'admin' } })
    mockInsert.mockResolvedValue({ error: null })
    const result = await addProduct(makeFormData({ name: 'Rice', price: '5.99', category: 'Grains', image_url: 'https://img.co/x.jpg', unit: 'kg', stock: '10' }))
    expect(result).toEqual({ success: true })
  })
})

describe('updateProduct — auth guards', () => {
  it('returns Unauthorized when not logged in', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = await updateProduct('prod-1', makeFormData({ name: 'Rice', price: '5.99', category: 'Grains', image_url: '', unit: 'kg', stock: '10' }))
    expect(result).toEqual({ success: false, message: 'Unauthorized' })
  })

  it('returns Unauthorized when logged in but not admin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    mockSingle.mockResolvedValue({ data: { role: 'customer' } })
    const result = await updateProduct('prod-1', makeFormData({ name: 'Rice', price: '5.99', category: 'Grains', image_url: '', unit: 'kg', stock: '10' }))
    expect(result).toEqual({ success: false, message: 'Unauthorized' })
  })
})
```

- [ ] **Step 2: Run to verify failures**

```bash
npx vitest run src/__tests__/unit/auth-guards.test.ts
```

Expected: failures (import issues or mock not fully set up).

- [ ] **Step 3: Check which exports exist in `actions.ts`**

```bash
grep "^export async function" src/app/actions.ts
```

If `deleteProduct` is not exported, remove that import from the test. Adjust imports to only what exists.

- [ ] **Step 4: Run until passing**

```bash
npx vitest run src/__tests__/unit/auth-guards.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Run full unit suite**

```bash
npx vitest run
```

Expected: all unit tests pass. No failures.

- [ ] **Step 6: Commit**

```bash
git add src/__tests__/unit/auth-guards.test.ts
git commit -m "test: unit tests for server action auth guards"
```

---

## Phase 3 — E2E Setup

### Task 7: Install Playwright and configure it

**Files:**
- Create: `playwright.config.ts`

- [ ] **Step 1: Install Playwright**

```bash
npm install -D @playwright/test
npx playwright install chromium firefox webkit
```

Expected: browsers downloaded to `~/.cache/ms-playwright/`. Takes 1-3 minutes.

- [ ] **Step 2: Create `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test'
import path from 'path'
import dotenv from 'dotenv'

// Load .env.test for Playwright runs
dotenv.config({ path: path.resolve(__dirname, '.env.test') })

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // sequential to avoid staging DB race conditions
  retries: 1,
  reporter: [['html', { open: 'never' }], ['list']],

  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Firefox + Safari only on the checkout spec (cross-browser confidence)
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: '**/guest-checkout.spec.ts',
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: '**/guest-checkout.spec.ts',
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
```

- [ ] **Step 3: Install `dotenv` if not already present**

```bash
npm install -D dotenv
```

- [ ] **Step 4: Add E2E scripts to `package.json`**

Inside `"scripts"`:
```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui",
"test:e2e:headed": "playwright test --headed"
```

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts package.json package-lock.json
git commit -m "chore: install and configure playwright"
```

---

### Task 8: Create E2E DB helper and seed script

**Files:**
- Create: `e2e/helpers/db.ts`
- Create: `e2e/global-setup.ts`
- Create: `e2e/global-teardown.ts`

- [ ] **Step 1: Create `e2e/helpers/db.ts`**

```ts
import { createClient } from '@supabase/supabase-js'

// Service-role client for test assertions — never used in app code
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
    .eq('email', email)
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
  await db.from('orders').delete().eq('email', email)
}

export async function deleteNewsletterSubscriber(email: string) {
  const db = getServiceClient()
  await db.from('newsletter_subscribers').delete().eq('email', email)
}

export async function getWishlistItems(userId: string) {
  const db = getServiceClient()
  const { data } = await db
    .from('wishlist')
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
```

- [ ] **Step 2: Create `e2e/global-setup.ts`**

This seeds the admin user and test products into staging before any tests run.

```ts
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

    // Set admin role in profiles table
    await db.from('profiles').upsert({
      id: newUser.user!.id,
      email: TEST_ADMIN_EMAIL,
      role: 'admin',
    })
    console.log('✓ Admin user created')
  } else {
    console.log('✓ Admin user already exists')
  }

  // 2. Seed test products (upsert by name to avoid duplicates)
  for (const product of TEST_PRODUCTS) {
    const { error } = await db.from('products').upsert(product, { onConflict: 'name' })
    if (error) console.warn(`Warning: could not seed product "${product.name}": ${error.message}`)
  }
  console.log(`✓ ${TEST_PRODUCTS.length} test products seeded`)
}

export default globalSetup
```

- [ ] **Step 3: Create `e2e/global-teardown.ts`**

```ts
import dotenv from 'dotenv'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.resolve(__dirname, '../.env.test') })

async function globalTeardown() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

  // Remove test orders created during E2E runs
  await db.from('orders').delete().like('email', '%@test.gajjuexpress%')

  // Remove test newsletter subscribers
  await db.from('newsletter_subscribers').delete().like('email', '%@test.gajjuexpress%')

  console.log('✓ E2E test data cleaned up')
}

export default globalTeardown
```

- [ ] **Step 4: Create `e2e/helpers/auth.ts`**

```ts
import { Page } from '@playwright/test'

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/auth')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole('button', { name: /sign in|log in/i }).click()
  // Wait for redirect away from /auth
  await page.waitForURL(url => !url.pathname.startsWith('/auth'), { timeout: 15_000 })
}

export function testEmail(prefix: string): string {
  return `${prefix}+${Date.now()}@test.gajjuexpress`
}
```

- [ ] **Step 5: Verify global setup runs without crashing**

```bash
npx dotenv -e .env.test -- node -e "require('./e2e/global-setup.ts')" 2>/dev/null || npx playwright test --list 2>&1 | head -20
```

The cleaner check: just run `npx playwright test --list` which triggers global-setup compilation.

- [ ] **Step 6: Commit**

```bash
git add e2e/helpers/db.ts e2e/helpers/auth.ts e2e/global-setup.ts e2e/global-teardown.ts
git commit -m "test: playwright global setup, teardown, and test helpers"
```

---

## Phase 4 — E2E Critical Paths

### Task 9: E2E — Newsletter signup

**Files:**
- Create: `e2e/newsletter.spec.ts`

- [ ] **Step 1: Identify the newsletter form selector**

```bash
grep -r "newsletter\|subscribe" src/components/ src/app/ --include="*.tsx" -l
```

Open the relevant file and note the form's input label/placeholder and button text.

- [ ] **Step 2: Write the test**

```ts
import { test, expect } from '@playwright/test'
import { getNewsletterSubscriber, deleteNewsletterSubscriber } from './helpers/db'
import { testEmail } from './helpers/auth'

test.describe('Newsletter signup', () => {
  const email = testEmail('newsletter')

  test.afterEach(async () => {
    await deleteNewsletterSubscriber(email)
  })

  test('subscribes a new email and records it in the DB', async ({ page }) => {
    await page.goto('/')

    // Locate the newsletter form — adjust selector if needed after inspecting the page
    const emailInput = page.getByPlaceholder(/your email|enter email/i).or(
      page.locator('input[type="email"]').last()
    )
    await emailInput.fill(email)
    await page.getByRole('button', { name: /subscribe|sign up/i }).click()

    // UI success
    await expect(page.getByText(/thank you|subscribed|success/i)).toBeVisible({ timeout: 8_000 })

    // DB assertion
    const subscriber = await getNewsletterSubscriber(email)
    expect(subscriber).not.toBeNull()
    expect(subscriber.email).toBe(email)
  })

  test('handles duplicate subscription gracefully', async ({ page }) => {
    await page.goto('/')

    const emailInput = page.getByPlaceholder(/your email|enter email/i).or(
      page.locator('input[type="email"]').last()
    )

    // First submission
    await emailInput.fill(email)
    await page.getByRole('button', { name: /subscribe|sign up/i }).click()
    await expect(page.getByText(/thank you|subscribed|success/i)).toBeVisible({ timeout: 8_000 })

    // Second submission — page must not crash
    await page.reload()
    await emailInput.fill(email)
    await page.getByRole('button', { name: /subscribe|sign up/i }).click()
    await expect(page).not.toHaveURL(/error/)
    // Either a success message or an "already subscribed" message — no 500 error
    await expect(page.locator('body')).not.toContainText(/500|internal server error/i)
  })
})
```

- [ ] **Step 3: Start the dev server in a separate terminal, then run this test**

```bash
npx playwright test e2e/newsletter.spec.ts --headed
```

Watch the browser. If selectors don't match, update them to match the actual DOM. Run until green.

- [ ] **Step 4: Run headless**

```bash
npx playwright test e2e/newsletter.spec.ts
```

Expected: `2 passed`.

- [ ] **Step 5: Commit**

```bash
git add e2e/newsletter.spec.ts
git commit -m "test: E2E newsletter signup and duplicate handling"
```

---

### Task 10: E2E — Wishlist add/remove

**Files:**
- Create: `e2e/wishlist.spec.ts`

- [ ] **Step 1: Write the test**

```ts
import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'
import { TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } from './global-setup'
import { getWishlistItems, getUserByEmail } from './helpers/db'

test.describe('Wishlist', () => {
  test('logged-in user can add and remove a product from wishlist', async ({ page }) => {
    await loginAs(page, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD)

    // Navigate to products page and click first product
    await page.goto('/products')
    await page.getByRole('link', { name: /test basmati rice/i }).first().click()

    // Add to wishlist
    const wishlistBtn = page.getByRole('button', { name: /wishlist|save|heart/i })
    await wishlistBtn.click()
    // Verify the button reflects the active state
    await expect(wishlistBtn).toHaveAttribute('aria-pressed', 'true').catch(() =>
      expect(wishlistBtn).toHaveClass(/active|filled|text-red/)
    )

    // Navigate to wishlist page
    await page.goto('/account')
    await page.getByRole('link', { name: /wishlist/i }).click()
    await expect(page.getByText(/test basmati rice/i)).toBeVisible()

    // Remove from wishlist
    await page.getByRole('button', { name: /remove|delete/i }).first().click()
    await expect(page.getByText(/test basmati rice/i)).not.toBeVisible({ timeout: 5_000 })
  })
})
```

- [ ] **Step 2: Identify real selectors**

```bash
grep -r "wishlist\|heart" src/components/product/ --include="*.tsx" | head -20
```

Update the selectors in the test to match what the UI actually renders.

- [ ] **Step 3: Run and fix until passing**

```bash
npx playwright test e2e/wishlist.spec.ts --headed
```

- [ ] **Step 4: Commit**

```bash
git add e2e/wishlist.spec.ts
git commit -m "test: E2E wishlist add and remove"
```

---

### Task 11: E2E — Guest checkout

**Files:**
- Create: `e2e/guest-checkout.spec.ts`

- [ ] **Step 1: Write the test**

```ts
import { test, expect } from '@playwright/test'
import { deleteOrdersByEmail, getOrderByEmail } from './helpers/db'

const GUEST_EMAIL = `guest+${Date.now()}@test.gajjuexpress`

test.describe('Guest checkout', () => {
  test.afterAll(async () => {
    await deleteOrdersByEmail(GUEST_EMAIL)
  })

  test('guest can complete checkout with Stripe test card and order is created', async ({ page }) => {
    // 1. Add a product to cart
    await page.goto('/products')
    await page.getByRole('button', { name: /add to (cart|basket)/i }).first().click()
    // Close cart drawer if it opens
    await page.keyboard.press('Escape')

    // 2. Go to checkout
    await page.goto('/checkout')
    await expect(page.getByText(/checkout|your (order|basket)/i)).toBeVisible()

    // 3. Fill in email
    const emailInput = page.getByLabel(/email/i).or(page.locator('input[type="email"]').first())
    await emailInput.fill(GUEST_EMAIL)

    // 4. Trigger payment intent creation (click "Proceed" or similar)
    const proceedBtn = page.getByRole('button', { name: /proceed|continue|pay/i }).first()
    await proceedBtn.click()

    // 5. Wait for Stripe Elements iframe to appear
    const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first()
    await stripeFrame.locator('[placeholder="Card number"]').fill('4242424242424242')
    await stripeFrame.locator('[placeholder="MM / YY"]').fill('12 / 34')
    await stripeFrame.locator('[placeholder="CVC"]').fill('123')

    // 6. Fill delivery details
    await page.getByLabel(/name/i).fill('Test User')
    await page.getByLabel(/address|street/i).first().fill('123 Test Street')
    await page.getByLabel(/city/i).fill('London')
    await page.getByLabel(/postcode|zip/i).fill('E1 6RF')
    await page.getByLabel(/phone/i).fill('07700900000')

    // 7. Submit payment
    await page.getByRole('button', { name: /pay|place order|complete/i }).click()

    // 8. Assert success redirect
    await expect(page).toHaveURL(/\/checkout\/success/, { timeout: 30_000 })
    await expect(page.getByText(/thank you|order confirmed|order placed/i)).toBeVisible()

    // 9. Assert order in DB
    const order = await getOrderByEmail(GUEST_EMAIL)
    expect(order).not.toBeNull()
    expect(['pending', 'confirmed']).toContain(order.status)
  })
})
```

- [ ] **Step 2: Identify the exact Stripe Elements iframe and form field selectors**

Run the app, go to `/checkout` manually, open DevTools and inspect the Stripe iframe and form labels. Update selectors in the test to match exactly.

- [ ] **Step 3: Run with headed browser**

```bash
npx playwright test e2e/guest-checkout.spec.ts --headed --project=chromium
```

Watch each step. Fix selectors as needed.

- [ ] **Step 4: Run headless across all 3 browsers**

```bash
npx playwright test e2e/guest-checkout.spec.ts
```

Expected: `3 passed` (chromium, firefox, webkit).

- [ ] **Step 5: Commit**

```bash
git add e2e/guest-checkout.spec.ts
git commit -m "test: E2E guest checkout with Stripe test card"
```

---

### Task 12: E2E — User registration and checkout

**Files:**
- Create: `e2e/user-auth-checkout.spec.ts`

- [ ] **Step 1: Write the test**

```ts
import { test, expect } from '@playwright/test'
import { deleteOrdersByEmail, getUserByEmail } from './helpers/db'
import { testEmail } from './helpers/auth'
import { getServiceClient } from './helpers/db'

const USER_EMAIL = testEmail('reguser')
const USER_PASSWORD = 'TestUser@1234!'

test.describe('User registration and checkout', () => {
  test.afterAll(async () => {
    await deleteOrdersByEmail(USER_EMAIL)
    // Remove test user from auth
    const db = getServiceClient()
    const user = await getUserByEmail(USER_EMAIL)
    if (user) await db.auth.admin.deleteUser(user.id)
  })

  test('new user can register, log in, and complete a checkout', async ({ page }) => {
    // 1. Register
    await page.goto('/auth')
    await page.getByRole('tab', { name: /sign up|register|create account/i }).click()
    await page.getByLabel(/email/i).fill(USER_EMAIL)
    await page.getByLabel(/password/i).fill(USER_PASSWORD)
    await page.getByRole('button', { name: /sign up|register|create/i }).click()

    // 2. Should land on account or home (not /auth)
    await page.waitForURL(url => !url.pathname.startsWith('/auth'), { timeout: 15_000 })

    // 3. Add product to cart and checkout
    await page.goto('/products')
    await page.getByRole('button', { name: /add to (cart|basket)/i }).first().click()
    await page.keyboard.press('Escape')
    await page.goto('/checkout')

    // Email should be pre-filled for logged-in user
    await expect(page.locator('input[type="email"]').first()).toHaveValue(USER_EMAIL)

    // 4. Fill Stripe card
    const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first()
    await stripeFrame.locator('[placeholder="Card number"]').fill('4242424242424242')
    await stripeFrame.locator('[placeholder="MM / YY"]').fill('12 / 34')
    await stripeFrame.locator('[placeholder="CVC"]').fill('123')

    // 5. Fill delivery details
    await page.getByLabel(/name/i).fill('Registered User')
    await page.getByLabel(/address|street/i).first().fill('456 Registered Lane')
    await page.getByLabel(/city/i).fill('Manchester')
    await page.getByLabel(/postcode|zip/i).fill('M1 1AE')
    await page.getByLabel(/phone/i).fill('07700900001')

    // 6. Pay
    await page.getByRole('button', { name: /pay|place order|complete/i }).click()
    await expect(page).toHaveURL(/\/checkout\/success/, { timeout: 30_000 })

    // 7. Order appears in /orders
    await page.goto('/orders')
    await expect(page.getByText(/order/i)).toBeVisible()
  })
})
```

- [ ] **Step 2: Run headed and fix selectors**

```bash
npx playwright test e2e/user-auth-checkout.spec.ts --headed
```

- [ ] **Step 3: Run headless**

```bash
npx playwright test e2e/user-auth-checkout.spec.ts
```

Expected: `1 passed`.

- [ ] **Step 4: Commit**

```bash
git add e2e/user-auth-checkout.spec.ts
git commit -m "test: E2E user registration and authenticated checkout"
```

---

### Task 13: E2E — Google OAuth redirect verification

**Files:**
- Create: `e2e/google-oauth.spec.ts`

> Note: Full Google OAuth automation requires real Google credentials. This test verifies the redirect is correctly initiated. The callback route is tested by confirming the auth callback URL structure.

- [ ] **Step 1: Write the test**

```ts
import { test, expect } from '@playwright/test'

test.describe('Google OAuth', () => {
  test('clicking Google login redirects to accounts.google.com', async ({ page, context }) => {
    await page.goto('/auth')

    // Intercept the navigation to Google — don't follow it (avoids needing real Google credentials)
    const [popup] = await Promise.all([
      context.waitForEvent('page').catch(() => null),
      page.getByRole('button', { name: /google|continue with google/i }).click(),
    ])

    // Either opens in a popup or navigates the main page to Google
    if (popup) {
      await expect(popup).toHaveURL(/accounts\.google\.com/, { timeout: 10_000 })
    } else {
      await expect(page).toHaveURL(/accounts\.google\.com|google\.com\/o\/oauth/, { timeout: 10_000 })
    }
  })

  test('OAuth callback route exists and handles missing code gracefully', async ({ page }) => {
    // Visit the callback route without a code — should redirect to auth or home, not crash
    await page.goto('/auth/callback')
    await expect(page).not.toHaveURL(/500/)
    await expect(page.locator('body')).not.toContainText(/internal server error/i)
  })
})
```

- [ ] **Step 2: Run**

```bash
npx playwright test e2e/google-oauth.spec.ts --headed
```

- [ ] **Step 3: Commit**

```bash
git add e2e/google-oauth.spec.ts
git commit -m "test: E2E Google OAuth redirect verification"
```

---

### Task 14: E2E — Admin product management

**Files:**
- Create: `e2e/admin-products.spec.ts`

- [ ] **Step 1: Write the test**

```ts
import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'
import { TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } from './global-setup'
import { getProductByName, deleteProductByName } from './helpers/db'

const NEW_PRODUCT_NAME = `E2E Test Product ${Date.now()}`

test.describe('Admin — product management', () => {
  test.afterAll(async () => {
    await deleteProductByName(NEW_PRODUCT_NAME)
    await deleteProductByName(`${NEW_PRODUCT_NAME} Updated`)
  })

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD)
    await page.goto('/admin/products')
  })

  test('admin can add a new product', async ({ page }) => {
    await page.getByRole('button', { name: /add product|new product/i }).click()

    await page.getByLabel(/name/i).fill(NEW_PRODUCT_NAME)
    await page.getByLabel(/price/i).fill('9.99')
    await page.getByLabel(/category/i).fill('Test Category')
    await page.getByLabel(/unit/i).fill('1kg')
    await page.getByLabel(/stock/i).fill('25')
    await page.getByLabel(/image url/i).fill('https://placehold.co/400')

    await page.getByRole('button', { name: /save|add|submit/i }).click()

    await expect(page.getByText(NEW_PRODUCT_NAME)).toBeVisible({ timeout: 10_000 })

    const product = await getProductByName(NEW_PRODUCT_NAME)
    expect(product).not.toBeNull()
    expect(product.price).toBeCloseTo(9.99, 2)
  })

  test('admin can edit an existing product price', async ({ page }) => {
    // Find the test product row and click edit
    const row = page.getByRole('row').filter({ hasText: NEW_PRODUCT_NAME })
    await row.getByRole('button', { name: /edit/i }).click()

    await page.getByLabel(/price/i).clear()
    await page.getByLabel(/price/i).fill('12.99')
    await page.getByRole('button', { name: /save|update/i }).click()

    await expect(page.getByText(/12.99|£12\.99/)).toBeVisible({ timeout: 8_000 })

    const product = await getProductByName(NEW_PRODUCT_NAME)
    expect(product.price).toBeCloseTo(12.99, 2)
  })

  test('admin can delete a product', async ({ page }) => {
    const row = page.getByRole('row').filter({ hasText: NEW_PRODUCT_NAME })
    await row.getByRole('button', { name: /delete|remove/i }).click()

    // Confirm deletion dialog if present
    await page.getByRole('button', { name: /confirm|yes|delete/i }).click().catch(() => {})

    await expect(page.getByText(NEW_PRODUCT_NAME)).not.toBeVisible({ timeout: 10_000 })

    const product = await getProductByName(NEW_PRODUCT_NAME)
    expect(product).toBeNull()
  })
})
```

- [ ] **Step 2: Run headed and fix selectors against the real admin UI**

```bash
npx playwright test e2e/admin-products.spec.ts --headed
```

- [ ] **Step 3: Run headless**

```bash
npx playwright test e2e/admin-products.spec.ts
```

Expected: `3 passed`.

- [ ] **Step 4: Commit**

```bash
git add e2e/admin-products.spec.ts
git commit -m "test: E2E admin product add, edit, delete"
```

---

### Task 15: E2E — Admin order status management

**Files:**
- Create: `e2e/admin-orders.spec.ts`

- [ ] **Step 1: Confirm a test order exists in staging**

This test needs at least one order in the staging DB. Run the guest checkout E2E first (`npx playwright test e2e/guest-checkout.spec.ts`) to create one, or create a seed order in `global-setup.ts`.

If you need to seed an order in global-setup, add this to `e2e/global-setup.ts` after the products section:

```ts
// Seed a test order for admin order tests
const { data: products } = await db.from('products').select('id, name, price').limit(1).single()
if (products) {
  await db.from('orders').upsert({
    email: 'seed-order@test.gajjuexpress',
    status: 'pending',
    total: products.price,
    items: [{ id: products.id, name: products.name, price: products.price, qty: 1 }],
    delivery_name: 'Seed Test User',
    delivery_address: '1 Seed Street',
    delivery_city: 'London',
    delivery_postcode: 'E1 1AA',
    delivery_phone: '07700900000',
  }, { onConflict: 'email' })
  console.log('✓ Seed order created')
}
```

- [ ] **Step 2: Write the test**

```ts
import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/auth'
import { TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } from './global-setup'
import { getServiceClient } from './helpers/db'

test.describe('Admin — order status management', () => {
  test('admin can change an order status to dispatched', async ({ page }) => {
    await loginAs(page, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD)
    await page.goto('/admin/orders')

    // Click the first order in the list
    await page.getByRole('link', { name: /view|details|#/i }).first().click()

    // Change status to "dispatched"
    const statusSelect = page.getByRole('combobox', { name: /status/i }).or(
      page.locator('select[name="status"]')
    )
    await statusSelect.selectOption('dispatched')

    await page.getByRole('button', { name: /update|save|confirm/i }).click()

    await expect(page.getByText(/dispatched/i)).toBeVisible({ timeout: 8_000 })

    // Verify in DB
    const db = getServiceClient()
    const orderId = page.url().split('/').pop()
    const { data: order } = await db.from('orders').select('status').eq('id', orderId!).single()
    expect(order?.status).toBe('dispatched')
  })
})
```

- [ ] **Step 3: Run headed and fix selectors**

```bash
npx playwright test e2e/admin-orders.spec.ts --headed
```

- [ ] **Step 4: Commit**

```bash
git add e2e/admin-orders.spec.ts e2e/global-setup.ts
git commit -m "test: E2E admin order status management"
```

---

## Phase 5 — CI

### Task 16: GitHub Actions CI workflow

**Files:**
- Create: `.github/workflows/tests.yml`

- [ ] **Step 1: Create the workflow file**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Write `.github/workflows/tests.yml`**

```yaml
name: Tests

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  unit-tests:
    name: Unit Tests (Vitest)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx vitest run
        env:
          NEXT_PUBLIC_SUPABASE_URL: https://test.supabase.co
          NEXT_PUBLIC_SUPABASE_ANON_KEY: test-anon-key
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: pk_test_placeholder

  e2e-tests:
    name: E2E Tests (Playwright)
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test --project=chromium
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.STAGING_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.STAGING_SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.STAGING_SUPABASE_SERVICE_ROLE_KEY }}
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${{ secrets.STRIPE_TEST_PUBLISHABLE_KEY }}
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_TEST_SECRET_KEY }}
          STRIPE_WEBHOOK_SECRET: ${{ secrets.STRIPE_WEBHOOK_SECRET }}
          NEXT_PUBLIC_SITE_URL: http://localhost:3000
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7

  typecheck:
    name: TypeScript
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx tsc --noEmit
```

- [ ] **Step 3: Add GitHub Secrets**

In your GitHub repo → **Settings → Secrets and variables → Actions**, add:

| Secret name | Value |
|---|---|
| `STAGING_SUPABASE_URL` | `https://umlzfxbrnyftmoeayvqk.supabase.co` |
| `STAGING_SUPABASE_ANON_KEY` | your staging anon key |
| `STAGING_SUPABASE_SERVICE_ROLE_KEY` | your staging service role key |
| `STRIPE_TEST_PUBLISHABLE_KEY` | your `pk_test_` key |
| `STRIPE_TEST_SECRET_KEY` | your `sk_test_` key |
| `STRIPE_WEBHOOK_SECRET` | your `whsec_` key |

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/tests.yml
git commit -m "ci: add GitHub Actions workflow for unit and E2E tests"
```

- [ ] **Step 5: Push to a PR branch and verify CI runs green**

```bash
git push origin feat/test-strategy
```

Open a PR and watch the Actions tab. All three jobs should pass.

---

## Pre-Launch Gate Checklist

Run these before marking the project as launch-ready:

- [ ] `npx vitest run` — exits 0, all unit tests pass
- [ ] `npx playwright test` — all 8 E2E critical paths pass on staging
- [ ] `npx tsc --noEmit` — zero TypeScript errors
- [ ] `npx eslint src` — zero errors
- [ ] `supabase db diff --linked` — confirms production schema matches staging (run after `supabase link --project-ref okznqgzbwcxmlditaqvt`)
- [ ] VAT number replaced in `src/lib/invoice.ts` — remove the `PLACEHOLDER-UPDATE-BEFORE-GOLIVE` comment
- [ ] Stripe webhook configured in production Stripe dashboard pointing to production domain
