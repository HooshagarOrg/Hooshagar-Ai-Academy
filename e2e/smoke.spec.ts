import { expect, test } from '@playwright/test'
import { seedCookieConsent } from './helpers/cookies'

test.describe('smoke', () => {
  test.describe.configure({ timeout: 110_000 })

  test('app loads with HTTP 200', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 45_000 })
    expect(response?.status()).toBe(200)
  })

  test('login page renders', async ({ page }) => {
    await seedCookieConsent(page)
    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await expect(page.getByTestId('login-page')).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.getByTestId('login-tab-staff')).toBeVisible()
    await expect(page.getByTestId('login-tab-student')).toBeVisible()
  })

  test('health API returns 200', async ({ page }) => {
    const response = await page.goto('/api/health', {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    })
    expect(response?.status()).toBe(200)
    const body = (await response?.json()) as {
      status?: string
      timestamp?: string
      db?: string
      version?: string
      services?: { database?: string }
    }
    expect(['ok', 'healthy']).toContain(body.status)
    expect(typeof body.timestamp).toBe('string')
    if (body.db) {
      expect(body.db).toBe('ok')
    } else {
      expect(body.services?.database).toBe('up')
    }
    if (body.version) {
      expect(typeof body.version).toBe('string')
    }
  })
})
