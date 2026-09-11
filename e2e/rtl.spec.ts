import { expect, test, type Page } from '@playwright/test'
import { isPlaceholderSupabase } from './helpers/supabase'
import {
  cleanupTestData,
  provisionSchoolBundle,
  type E2eSchoolBundle,
} from './helpers/seed'
import { loginViaApi, preparePage } from './helpers/session'

const ORIGIN = 'http://127.0.0.1:3000'
const PERSIAN = /[\u0600-\u06FF]/

async function gotoPath(page: Page, path: string): Promise<void> {
  try {
    await page.goto(`${ORIGIN}${path}`, { waitUntil: 'commit', timeout: 300_000 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    if (!/ERR_ABORTED|frame was detached/i.test(msg)) throw error
  }
}

async function expectRtlDocument(page: Page): Promise<void> {
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl', { timeout: 180_000 })
  await expect(page.locator('html')).toHaveAttribute('lang', 'fa')
  const computed = await page.evaluate(
    () => getComputedStyle(document.documentElement).direction,
  )
  expect(computed).toBe('rtl')
}

async function expectPersianCopy(page: Page, marker: string | RegExp): Promise<void> {
  const locator = page.getByText(marker).first()
  await expect(locator).toBeVisible({ timeout: 180_000 })
  const text = await locator.innerText()
  expect(text, `متن فارسی برای ${marker} دیده نشد`).toMatch(PERSIAN)
  expect(text).not.toContain('\uFFFD')
  const body = await page.locator('body').innerText()
  expect(body).toMatch(PERSIAN)
  expect(body).not.toContain('\uFFFD')
}

/** Login HTML is SSR; native GET fires unless React has hydrated. */
async function waitForLoginHydration(page: Page): Promise<void> {
  await expect.poll(
    async () => {
      await page.getByTestId('login-tab-sms').click()
      return page.getByTestId('login-phone').isVisible()
    },
    { timeout: 180_000 },
  ).toBeTruthy()
  await expect.poll(
    async () => {
      await page.getByTestId('login-tab-staff').click()
      return page.getByTestId('login-username').isVisible()
    },
    { timeout: 60_000 },
  ).toBeTruthy()
}

test.describe.configure({ mode: 'serial', timeout: 720_000 })

test.describe('RTL', () => {
  test.skip(isPlaceholderSupabase(), 'نیاز به Auth واقعی Supabase')

  let bundle: E2eSchoolBundle

  test.beforeAll(async () => {
    bundle = await provisionSchoolBundle()
  })

  test.afterAll(async () => {
    await cleanupTestData()
  })

  test.beforeEach(async ({ page }) => {
    await preparePage(page)
  })

  test('public pages render dir=rtl with Persian copy', async ({ page }) => {
    const pages: Array<{ path: string; marker: string | RegExp }> = [
      { path: '/', marker: /هوشاگر/ },
      { path: '/login', marker: 'کارکنان' },
      { path: '/forgot-password', marker: 'شماره موبایل' },
    ]

    for (const item of pages) {
      await gotoPath(page, item.path)
      await expectRtlDocument(page)
      await expectPersianCopy(page, item.marker)
      if (item.path === '/login') {
        await expect(page.getByTestId('login-page')).toHaveAttribute('dir', 'rtl')
      }
    }
  })

  test('authenticated dashboards stay RTL', async ({ page }) => {
    await loginViaApi(page, bundle.student, { visitDashboard: false })
    await gotoPath(page, '/student')
    await expectRtlDocument(page)
    await expect(page.locator('[data-role="student"]').first()).toBeVisible({
      timeout: 180_000,
    })
    await expectPersianCopy(page, /آزمون|داشبورد|سلام/)

    await loginViaApi(page, bundle.teacher, { visitDashboard: false })
    await gotoPath(page, '/teacher')
    await expectRtlDocument(page)
    await expect(page.locator('[data-role="teacher"]').first()).toBeVisible({
      timeout: 180_000,
    })
    await expectPersianCopy(page, /سلام|داشبورد|آزمون/)

    await loginViaApi(page, bundle.admin, { visitDashboard: false })
    await gotoPath(page, '/admin')
    await expectRtlDocument(page)
    await expect(page.locator('[data-role="admin"]').first()).toBeVisible({
      timeout: 180_000,
    })
    await expectPersianCopy(page, 'داشبورد مدیریت')
  })

  test('Persian form input submits', async ({ page }) => {
    await page.goto(`${ORIGIN}/login`, { waitUntil: 'domcontentloaded', timeout: 300_000 })
    await expect(page.getByTestId('login-page')).toBeVisible({ timeout: 180_000 })
    await waitForLoginHydration(page)

    await page.getByTestId('login-username').fill(bundle.teacher.username)
    await page.getByTestId('login-password').fill(bundle.teacher.password)

    const loginWait = page.waitForResponse(
      (res) =>
        res.url().includes('/api/auth/login') && res.request().method() === 'POST',
      { timeout: 180_000 },
    )
    await Promise.all([
      loginWait,
      page.getByTestId('login-submit').click(),
    ])
    const loginRes = await loginWait
    expect(page.url(), 'رمز نباید در query string نشت کند').not.toMatch(/password=/)
    expect(loginRes.ok(), await loginRes.text()).toBeTruthy()
    await expect(page).toHaveURL(/\/teacher/, { timeout: 180_000 })
    await expectRtlDocument(page)

    await gotoPath(page, '/teacher/exams/create')
    await expect(page.getByText('ایجاد امتحان جدید').first()).toBeVisible({
      timeout: 180_000,
    })
    const title = page.getByPlaceholder('مثال: امتحان میان‌ترم ریاضی')
    await expect(title).toBeVisible({ timeout: 60_000 })
    await title.fill('آزمون پایانی خرداد')
    await expect(title).toHaveValue('آزمون پایانی خرداد')
    expect('آزمون پایانی خرداد').toMatch(PERSIAN)

    await page.getByRole('combobox').first().click()
    await page.getByRole('option', { name: 'ریاضی' }).click()

    const date = page.locator('input[type="date"]')
    const today = new Date().toISOString().slice(0, 10)
    await date.fill(today)
    await expect(page.getByRole('button', { name: 'بعدی' })).toBeEnabled({
      timeout: 30_000,
    })
    await page.getByRole('button', { name: 'بعدی' }).click()
    await expect(page.getByText('توزیع سطح دشواری')).toBeVisible({ timeout: 180_000 })
    await expectRtlDocument(page)
  })
})
