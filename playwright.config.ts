import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000'

/**
 * Playwright E2E — فقط پوشه e2e (نه __tests__ متعلق به Jest)
 *
 * Auth اختیاری:
 *   E2E_STAFF_USERNAME + E2E_STAFF_PASSWORD
 *   E2E_STUDENT_NUMBER + E2E_STUDENT_PIN
 *
 * اگر سرور از قبل بالا است:
 *   PLAYWRIGHT_SKIP_WEBSERVER=1 pnpm test:e2e
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  timeout: 240_000,
  expect: { timeout: 45_000 },
  use: {
    baseURL,
    locale: 'fa-IR',
    navigationTimeout: 180_000,
    actionTimeout: 45_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: 'pnpm exec next dev -H 127.0.0.1 -p 3000',
        url: `${baseURL}/api/ready`,
        reuseExistingServer: !process.env.CI,
        timeout: 420_000,
        stdout: 'pipe',
        stderr: 'pipe',
      },
})
