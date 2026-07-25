import type { Page } from '@playwright/test'

const COOKIE_CONSENT_KEY = 'hooshagar_cookie_consent'

/** قبل از navigation تا بنر کوکی اصلاً نشان داده نشود */
export async function seedCookieConsent(page: Page): Promise<void> {
  await page.addInitScript((key: string) => {
    window.localStorage.setItem(key, 'accepted')
  }, COOKIE_CONSENT_KEY)
}

/** بستن بنر رضایت کوکی اگر هنوز نمایش داده شده باشد */
export async function acceptCookiesIfPresent(page: Page): Promise<void> {
  const accept = page.getByRole('button', { name: 'می‌پذیرم' })
  if (await accept.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await accept.click()
    await expectDialogGone(page)
  }
}

async function expectDialogGone(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog', { name: 'رضایت کوکی' })
  await dialog.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => undefined)
}
