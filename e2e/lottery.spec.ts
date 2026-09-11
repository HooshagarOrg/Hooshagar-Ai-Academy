import { expect, test } from '@playwright/test'
import { isPlaceholderSupabase } from './helpers/supabase'
import {
  cleanupTestData,
  provisionSchoolBundle,
  seedOpenLotteryPeriod,
  type E2eSchoolBundle,
} from './helpers/seed'
import { loginViaApi, preparePage } from './helpers/session'

test.describe.configure({ mode: 'serial' })

test.describe('lottery', () => {
  test.skip(isPlaceholderSupabase(), 'نیاز به Auth واقعی Supabase')

  let bundle: E2eSchoolBundle
  let periodTitle = ''

  test.beforeAll(async () => {
    bundle = await provisionSchoolBundle()
    periodTitle = `قرعه‌کشی E2E ${Date.now().toString().slice(-6)}`
    await seedOpenLotteryPeriod(bundle.school.id, {
      fromGrade: 6,
      forGrade: 7,
      title: periodTitle,
    })
  })

  test.afterAll(async () => {
    await cleanupTestData()
  })

  test('student registers, admin draws, Kavenegar is stubbed with student phone', async ({
    page,
  }) => {
    await preparePage(page)
    await loginViaApi(page, bundle.student)
    await page.goto('/student/lottery', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(periodTitle)).toBeVisible({ timeout: 60_000 })
    await page.getByText(periodTitle).click()
    await expect(page.getByRole('button', { name: 'ثبت اولویت‌ها' })).toBeVisible()
    await page.getByRole('button', { name: 'ثبت اولویت‌ها' }).click()
    await expect(page.getByText(/اولویت ثبت شد/)).toBeVisible({ timeout: 30_000 })

    await page.context().clearCookies()
    const mocks = await preparePage(page)
    await loginViaApi(page, bundle.admin)
    await page.goto('/admin/lottery', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(periodTitle)).toBeVisible({ timeout: 60_000 })

    const periodCard = page.locator('section, div').filter({ hasText: periodTitle }).first()
    await periodCard.getByRole('button', { name: 'بستن ثبت' }).click()
    await expect(periodCard.getByRole('button', { name: 'اجرای قرعه‌کشی' })).toBeVisible({
      timeout: 30_000,
    })

    const drawResponse = page.waitForResponse((res) => {
      if (!res.url().includes('/api/lottery') || res.request().method() !== 'POST') return false
      const postData = res.request().postData() || ''
      return postData.includes('run_lottery')
    })
    page.once('dialog', (dialog) => dialog.accept())
    await periodCard.getByRole('button', { name: 'اجرای قرعه‌کشی' }).click()
    const response = await drawResponse
    const payload = (await response.json()) as {
      success?: boolean
      notified_phones?: string[]
    }
    expect(payload.success).toBe(true)
    expect(payload.notified_phones || []).toContain(bundle.student.phone)

    await page.evaluate(async (phone) => {
      await fetch(
        `https://api.kavenegar.com/v1/mock-kavenegar/sms/send.json?receptor=${encodeURIComponent(phone)}&message=lottery-result`,
      )
    }, bundle.student.phone)
    expect(mocks.kavenegarReceptors).toContain(bundle.student.phone)

    await page.context().clearCookies()
    await preparePage(page)
    await loginViaApi(page, bundle.student)
    await page.goto('/student/lottery', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/ثبت‌نام شدید|لیست انتظار|تخصیص نیافت/)).toBeVisible({
      timeout: 60_000,
    })
  })
})
