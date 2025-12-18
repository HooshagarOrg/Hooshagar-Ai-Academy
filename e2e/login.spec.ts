import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('should display login form', async ({ page }) => {
    await expect(page).toHaveTitle(/هوشاگر/)
    await expect(page.getByRole('heading', { name: /ورود/i })).toBeVisible()
    await expect(page.getByPlaceholder(/ایمیل/i)).toBeVisible()
    await expect(page.getByPlaceholder(/رمز عبور/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /ورود/i })).toBeVisible()
  })

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.getByRole('button', { name: /ورود/i }).click()
    
    // Wait for validation errors
    await expect(page.getByText(/ایمیل الزامی است/i)).toBeVisible({
      timeout: 3000,
    })
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.getByPlaceholder(/ایمیل/i).fill('invalid@test.com')
    await page.getByPlaceholder(/رمز عبور/i).fill('wrongpassword')
    await page.getByRole('button', { name: /ورود/i }).click()

    // Wait for error message
    await expect(
      page.getByText(/ایمیل یا رمز عبور اشتباه است/i)
    ).toBeVisible({ timeout: 5000 })
  })

  test('should navigate to register page', async ({ page }) => {
    await page.getByRole('link', { name: /ثبت‌نام/i }).click()
    await expect(page).toHaveURL(/\/register/)
  })

  test('should remember me checkbox work', async ({ page }) => {
    const checkbox = page.getByRole('checkbox', { name: /مرا به خاطر بسپار/i })
    if (await checkbox.isVisible()) {
      await checkbox.check()
      expect(await checkbox.isChecked()).toBeTruthy()
    }
  })
})

test.describe('Login Success', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login')

    // Use test credentials (باید در test database موجود باشد)
    await page.getByPlaceholder(/ایمیل/i).fill('test@hooshagar.com')
    await page.getByPlaceholder(/رمز عبور/i).fill('Test123!@#')
    await page.getByRole('button', { name: /ورود/i }).click()

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
    
    // Should show dashboard content
    await expect(
      page.getByRole('heading', { name: /داشبورد/i })
    ).toBeVisible()
  })
})

