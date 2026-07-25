import { expect, test } from '@playwright/test'
import {
  hasStaffCredentials,
  hasStudentCredentials,
  staffCredentials,
  studentCredentials,
} from './helpers/env'
import { acceptCookiesIfPresent, seedCookieConsent } from './helpers/cookies'

const staffSuite = hasStaffCredentials() ? test.describe : test.describe.skip
const studentSuite = hasStudentCredentials() ? test.describe : test.describe.skip

staffSuite('authenticated staff dashboard (optional)', () => {
  test('staff login reaches role dashboard', async ({ page }) => {
    await seedCookieConsent(page)
    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await acceptCookiesIfPresent(page)
    await page.getByTestId('login-tab-staff').click()
    await page.getByTestId('login-username').fill(staffCredentials.username)
    await page.getByTestId('login-password').fill(staffCredentials.password)
    await page.getByTestId('login-submit').click()

    await expect(page).not.toHaveURL(/\/login/, { timeout: 90_000 })
    await expect(page).toHaveURL(
      /\/(admin|teacher|principal|counselor|parent|dashboard|health-vp|educational-vp|financial-vp|discipline-vp|evaluation-vp)/
    )
  })
})

studentSuite('authenticated student dashboard (optional)', () => {
  test('student login reaches student dashboard', async ({ page }) => {
    await seedCookieConsent(page)
    await page.goto('/login?tab=student', { waitUntil: 'domcontentloaded' })
    await acceptCookiesIfPresent(page)
    await expect(page.getByTestId('login-tab-student')).toHaveAttribute('data-state', 'active')
    await page.locator('#student_number').fill(studentCredentials.studentNumber)
    await page.locator('#pin').fill(studentCredentials.pin)
    await page
      .locator('form')
      .filter({ has: page.locator('#student_number') })
      .getByRole('button', { name: 'ورود' })
      .click()

    await expect(page).toHaveURL(/\/student/, { timeout: 90_000 })
  })
})
