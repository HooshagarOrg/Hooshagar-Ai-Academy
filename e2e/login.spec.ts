import { expect, test } from '@playwright/test'
import { acceptCookiesIfPresent, seedCookieConsent } from './helpers/cookies'

test.describe('login page (pilot)', () => {
  test.beforeEach(async ({ page }) => {
    await seedCookieConsent(page)
    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('login-page')).toBeVisible({ timeout: 90_000 })
    await acceptCookiesIfPresent(page)
  })

  test('renders RTL login shell with role tabs', async ({ page }) => {
    await expect(page.getByTestId('login-page')).toHaveAttribute('dir', 'rtl')
    await expect(page.getByTestId('login-tab-staff')).toBeVisible()
    await expect(page.getByTestId('login-tab-parent')).toBeVisible()
    await expect(page.getByTestId('login-tab-student')).toBeVisible()
    await expect(page.getByTestId('login-tab-sms')).toBeVisible()
  })

  test('staff tab exposes username/password form', async ({ page }) => {
    await page.getByTestId('login-tab-staff').click()
    await expect(page.getByTestId('login-username')).toBeVisible()
    await expect(page.getByTestId('login-password')).toBeVisible()
    await expect(page.getByTestId('login-submit')).toBeVisible()
  })

  test('student tab exposes student number and PIN', async ({ page }) => {
    // تب دانش‌آموز را از طریق query باز می‌کنیم (پایدارتر از کلیک Radix در E2E)
    await page.goto('/login?tab=student', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('login-page')).toBeVisible({ timeout: 90_000 })
    await expect(page.locator('#student_number')).toBeVisible({ timeout: 60_000 })
    await expect(page.locator('#pin')).toBeVisible()
  })

  test('invalid staff credentials stay on login page', async ({ page }) => {
    await page.getByTestId('login-tab-staff').click()
    await page.getByTestId('login-username').fill('e2e_invalid_user')
    await page.getByTestId('login-password').fill('wrong-password-999')
    await page.getByTestId('login-submit').click()

    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByTestId('login-page')).toBeVisible()
  })
})
