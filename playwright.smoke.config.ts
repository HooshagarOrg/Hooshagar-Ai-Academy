import path from 'node:path'
import dotenv from 'dotenv'
import { defineConfig, devices } from '@playwright/test'

dotenv.config({
  path: path.resolve(__dirname, '.env.test'),
  override: true,
})

/**
 * Fast smoke suite (target under 2 minutes).
 * Does not start Next.js — run `pnpm dev` first, or point PLAYWRIGHT_BASE_URL at a live origin.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/smoke.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  timeout: 45_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000',
    locale: 'fa-IR',
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
    serviceWorkers: 'block',
    trace: 'off',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
