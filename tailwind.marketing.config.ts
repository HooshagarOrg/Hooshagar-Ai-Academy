import type { Config } from 'tailwindcss'
import base from './tailwind.config'

/**
 * Tailwind scan for public routes only.
 * Root layout imports CSS that uses this config so / and /login
 * do not ship dashboard utility classes (~160KB).
 */
const config: Config = {
  ...base,
  content: [
    './app/layout.tsx',
    './app/error.tsx',
    './app/global-error.tsx',
    './app/(landing)/**/*.{ts,tsx}',
    './app/(auth)/**/*.{ts,tsx}',
    './app/auth/**/*.{ts,tsx}',
    './app/help/**/*.{ts,tsx}',
    './app/terms/**/*.{ts,tsx}',
    './app/privacy/**/*.{ts,tsx}',
    './app/pricing/**/*.{ts,tsx}',
    './app/offline/**/*.{ts,tsx}',
    './app/checkout/**/*.{ts,tsx}',
    './app/teacher/**/*.{ts,tsx}',
    './components/landing/**/*.{ts,tsx}',
    './components/auth/**/*.{ts,tsx}',
    './components/brand/**/*.{ts,tsx}',
    './components/layout/marketing-shell.tsx',
    './components/layout/static-cinematic-backdrop.tsx',
    './components/layout/cinematic-backdrop.tsx',
    './components/deferred-chrome.tsx',
    './components/cookie-consent.tsx',
    './components/service-worker-register.tsx',
    './components/sentry-client-init.tsx',
    './components/chunk-load-recovery.tsx',
    './components/ui/button.tsx',
    './components/ui/input.tsx',
    './components/ui/label.tsx',
    './components/ui/accordion.tsx',
    './components/ui/card.tsx',
    './components/ui/persian-date-display.tsx',
  ],
}

export default config
