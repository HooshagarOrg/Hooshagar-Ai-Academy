import { expect, test, type Page, type Route } from '@playwright/test'
import { isPlaceholderSupabase } from './helpers/supabase'
import {
  cleanupTestData,
  provisionSchoolBundle,
  type E2eSchoolBundle,
} from './helpers/seed'
import { loginWithOtpUi, logoutViaUi, preparePage } from './helpers/session'

const ORIGIN = 'http://127.0.0.1:3000'

const KAVENEGAR_STUB = {
  return: { status: 200, message: 'OK' },
  entries: [
    {
      messageid: 1,
      message: 'test',
      status: 5,
      statustext: 'sent',
      sender: '10008663',
      receptor: '09120000000',
      date: Date.now(),
      cost: 0,
    },
  ],
}

/** Browser-side Kavenegar must never hit the live API. */
async function mockKavenegar(page: Page): Promise<void> {
  await page.route(/api\.kavenegar\.com/i, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(KAVENEGAR_STUB),
    })
  })
}

test.describe.configure({ mode: 'serial', timeout: 720_000 })

test.describe('OTP auth', () => {
  test.skip(isPlaceholderSupabase(), 'نیاز به Auth واقعی Supabase')

  let bundle: E2eSchoolBundle

  test.beforeAll(async () => {
    bundle = await provisionSchoolBundle()
  })

  test.afterAll(async () => {
    await cleanupTestData()
  })

  test.beforeEach(async ({ page }) => {
    await mockKavenegar(page)
    await preparePage(page)
  })

  test('OTP login as student lands on student dashboard', async ({ page }) => {
    await loginWithOtpUi(page, bundle.student)
    await expect(page).toHaveURL(/\/student/)
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  })

  test('OTP login as teacher lands on teacher dashboard', async ({ page }) => {
    await loginWithOtpUi(page, bundle.teacher)
    await expect(page).toHaveURL(/\/teacher/)
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  })

  test('OTP login as admin lands on admin dashboard', async ({ page }) => {
    await loginWithOtpUi(page, bundle.admin)
    await expect(page).toHaveURL(/\/admin/)
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  })

  test('logout clears session and returns to login', async ({ page }) => {
    await loginWithOtpUi(page, bundle.teacher)
    await logoutViaUi(page)
    await expect(page.getByTestId('login-page')).toBeVisible()

    await page.goto(`${ORIGIN}/dashboard`, { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/login/)
  })

  test('unauthenticated /dashboard redirects to login', async ({ page }) => {
    await page.goto(`${ORIGIN}/dashboard`, { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/login/)
  })
})
