import path from 'node:path'
import { defineConfig } from 'vitest/config'
import dotenv from 'dotenv'

const rootDir = process.cwd()

dotenv.config({ path: path.join(rootDir, '.env.test'), override: true })

/**
 * Integration suite — loads .env.test (hooshagar-test project only).
 * Run with: pnpm test:integration
 */
export default defineConfig({
  envDir: false,
  resolve: {
    alias: {
      '@': rootDir,
    },
  },
  test: {
    globals: true,
    environment: 'node',
    passWithNoTests: true,
    testTimeout: 180_000,
    hookTimeout: 180_000,
    maxWorkers: 2,
    reporter: 'default',
    include: ['__tests__/integration/**/*.test.ts'],
    exclude: ['**/node_modules/**', 'e2e/**', '.next/**'],
    setupFiles: ['__tests__/helpers/vitest.setup.ts'],
  },
})
