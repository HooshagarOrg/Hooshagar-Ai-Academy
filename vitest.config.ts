import { defineConfig } from 'vitest/config'

const rootDir = process.cwd()

/**
 * Default unit suite for CI — no .env.test, no live Supabase.
 * Live DB tests belong in vitest.integration.config.ts.
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
    testTimeout: 30_000,
    hookTimeout: 30_000,
    maxWorkers: 2,
    reporter: 'default',
    include: [
      '__tests__/unit/**/*.test.ts',
      '__tests__/lib/**/*.test.ts',
      '__tests__/health.test.ts',
      '__tests__/logger.test.ts',
      '__tests__/rate-limit-user.test.ts',
      '__tests__/api/**/*.test.ts',
    ],
    exclude: [
      '**/node_modules/**',
      'e2e/**',
      '.next/**',
      '__tests__/integration/**',
      '__tests__/ai-eval/**',
    ],
    setupFiles: ['__tests__/helpers/vitest.unit.setup.ts'],
  },
})
