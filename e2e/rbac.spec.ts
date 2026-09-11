import { expect, test, type Page } from '@playwright/test'
import { isPlaceholderSupabase } from './helpers/supabase'
import {
  cleanupTestData,
  provisionSchoolBundle,
  type E2eSchoolBundle,
} from './helpers/seed'
import { loginViaApi, preparePage } from './helpers/session'

const ORIGIN = 'http://127.0.0.1:3000'

function pathnameOf(page: Page): string {
  return new URL(page.url()).pathname
}

async function gotoPath(page: Page, path: string): Promise<void> {
  try {
    await page.goto(`${ORIGIN}${path}`, { waitUntil: 'commit', timeout: 300_000 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    if (!/ERR_ABORTED|frame was detached|Timeout/i.test(msg)) throw error
  }
}

async function expectPathname(page: Page, expected: string): Promise<void> {
  await expect
    .poll(() => {
      const pathname = pathnameOf(page)
      return pathname === expected || pathname.startsWith(`${expected}/`)
    }, { timeout: 300_000 })
    .toBe(true)
}

test.describe.configure({ mode: 'serial', timeout: 720_000 })

test.describe('RBAC', () => {
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

  test('student visiting /admin is redirected to /student', async ({ page }) => {
    await loginViaApi(page, bundle.student, { visitDashboard: false })
    await gotoPath(page, '/admin')
    await expectPathname(page, '/student')
    expect(pathnameOf(page)).not.toMatch(/^\/admin(\/|$)/)
  })

  test('teacher visiting /platform-admin is redirected to /teacher', async ({ page }) => {
    await loginViaApi(page, bundle.teacher, { visitDashboard: false })
    await gotoPath(page, '/platform-admin')
    await expectPathname(page, '/teacher')
    expect(pathnameOf(page)).not.toMatch(/^\/platform-admin(\/|$)/)
  })

  test('platform_admin can open school dashboards', async ({ page }) => {
    await loginViaApi(page, bundle.platformAdmin, { visitDashboard: false })

    await gotoPath(page, '/admin')
    await expectPathname(page, '/admin')
    await expect(page.getByText('داشبورد مدیریت').first()).toBeVisible({ timeout: 180_000 })

    await gotoPath(page, '/admin/schools')
    await expectPathname(page, '/admin/schools')
    await expect(page.getByText('مدیریت مدارس').first()).toBeVisible({ timeout: 180_000 })

    await gotoPath(page, '/teacher')
    await expectPathname(page, '/teacher')

    await gotoPath(page, '/principal')
    await expectPathname(page, '/principal')
  })
})
