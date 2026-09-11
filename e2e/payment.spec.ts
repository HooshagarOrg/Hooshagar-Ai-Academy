import { expect, test } from '@playwright/test'
import { isPlaceholderSupabase } from './helpers/supabase'
import {
  cleanupTestData,
  createTestServiceClient,
  ensurePaidPlan,
  provisionSchoolBundle,
  trackPaymentArtifacts,
  type E2eSchoolBundle,
} from './helpers/seed'
import { loginViaApi, preparePage } from './helpers/session'

test.describe.configure({ mode: 'serial' })

test.describe('payment', () => {
  test.skip(isPlaceholderSupabase(), 'نیاز به Auth واقعی Supabase')

  let bundle: E2eSchoolBundle
  let planName = 'basic'

  test.beforeAll(async () => {
    bundle = await provisionSchoolBundle()
    const plan = await ensurePaidPlan()
    planName = plan.name
  })

  test.afterAll(async () => {
    await cleanupTestData()
  })

  test('admin checkout through mocked Zarinpal activates subscription', async ({ page }) => {
    const mocks = await preparePage(page)
    await loginViaApi(page, bundle.admin, { visitDashboard: false })
    const plansWait = page.waitForResponse(
      (res) => res.url().includes('/api/subscription') && res.url().includes('type=plans'),
      { timeout: 180_000 },
    )
    await page.goto(`/checkout?plan=${planName}`, { waitUntil: 'domcontentloaded' })
    await plansWait
    await expect(page.getByText('تکمیل خرید')).toBeVisible({ timeout: 180_000 })

    await page.getByPlaceholder('نام مدرسه یا آموزشگاه').fill(bundle.school.name)
    await page.locator('input[type="checkbox"]').check()

    const paymentPost = page.waitForResponse(
      (res) => res.url().includes('/api/payment') && res.request().method() === 'POST',
    )
    await page.getByRole('button', { name: /پرداخت/ }).click()
    const started = await paymentPost
    const startedBody = (await started.json()) as {
      success?: boolean
      transaction_id?: string
      payment_url?: string
    }
    expect(startedBody.success).toBe(true)
    expect(startedBody.payment_url).toMatch(/zarinpal\.com\/pg\/StartPay/)
    if (startedBody.transaction_id) {
      mocks.paymentTxId = startedBody.transaction_id
      await trackPaymentArtifacts(startedBody.transaction_id)
    }

    await page.waitForURL(/payment=success|\/admin|\/dashboard/, { timeout: 120_000 })

    const admin = createTestServiceClient()
    const { data: sub } = await admin
      .from('subscriptions')
      .select('id, status, school_id')
      .eq('school_id', bundle.school.id)
      .maybeSingle()
    expect(sub?.status).toBe('active')
    if (sub?.id) await trackPaymentArtifacts(undefined, sub.id as string)

    await page.goto('/admin/subscriptions', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('فعال').first()).toBeVisible({ timeout: 60_000 })
  })
})
