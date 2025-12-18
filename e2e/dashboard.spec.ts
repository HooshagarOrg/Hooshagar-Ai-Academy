import { test, expect } from '@playwright/test'

// Helper to login before each test
async function login(page: any) {
  await page.goto('/login')
  await page.getByPlaceholder(/ایمیل/i).fill('teststudent@hooshagar.com')
  await page.getByPlaceholder(/رمز عبور/i).fill('Test123!@#')
  await page.getByRole('button', { name: /ورود/i }).click()
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
}

test.describe('Student Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('should display dashboard stats', async ({ page }) => {
    // Check for stat cards
    await expect(page.getByText(/سطح فعلی/i)).toBeVisible()
    await expect(page.getByText(/امتیاز کل/i)).toBeVisible()
  })

  test('should navigate to XP page', async ({ page }) => {
    await page.getByRole('link', { name: /باغ استعداد/i }).click()
    await expect(page).toHaveURL(/\/student\/xp/)
    await expect(page.getByText(/داشبورد امتیازات/i)).toBeVisible()
  })

  test('should navigate to leaderboard', async ({ page }) => {
    await page.getByRole('link', { name: /جدول افتخارات/i }).click()
    await expect(page).toHaveURL(/\/leaderboard/)
    await expect(page.getByText(/جدول افتخارات/i)).toBeVisible()
  })

  test('should navigate to badges page', async ({ page }) => {
    await page.getByRole('link', { name: /نشان‌ها/i }).click()
    await expect(page).toHaveURL(/\/student\/badges/)
  })

  test('should open notification bell', async ({ page }) => {
    // Find notification bell button
    const notificationBell = page.getByRole('button').filter({
      has: page.locator('svg'),
    }).first()
    
    await notificationBell.click()
    
    // Should show notifications dropdown
    await expect(page.getByText(/اعلانات/i)).toBeVisible()
  })

  test('should logout successfully', async ({ page }) => {
    // Click logout button
    await page.getByTitle(/خروج/i).click()
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  })
})

test.describe('Dashboard Responsiveness', () => {
  test('should be mobile responsive', async ({ page }) => {
    await login(page)
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Dashboard should still be visible and usable
    await expect(page.getByRole('heading', { name: /داشبورد/i })).toBeVisible()
  })
})

