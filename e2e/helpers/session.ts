import { expect, type APIRequestContext, type Page } from '@playwright/test'
import { seedCookieConsent } from './cookies'
import { installExternalMocks, type ExternalMockState } from './mocks'
import { readLatestOtp, type E2eActor } from './seed'

type CookieHeaderSource = {
  headersArray():
    | ReadonlyArray<{ name: string; value: string }>
    | Promise<ReadonlyArray<{ name: string; value: string }>>
}

const LOOPBACK_ORIGIN = 'http://127.0.0.1:3000'
const LOCALHOST_ORIGIN = 'http://localhost:3000'
const loopbackPinned = new WeakSet<Page>()

export async function warmAuthRoutes(request: APIRequestContext): Promise<void> {
  await request
    .post('/api/auth/send-otp', {
      data: { phoneNumber: '09120000000', purpose: 'login' },
      timeout: 300_000,
    })
    .catch(() => undefined)
  await request
    .post('/api/auth/login', {
      data: { method: 'staff', username: '__warmup__', password: 'warmup12' },
      timeout: 300_000,
    })
    .catch(() => undefined)
}

const ROLE_DASHBOARD: Record<string, RegExp> = {
  student: /\/student/,
  teacher: /\/teacher/,
  admin: /\/admin/,
  platform_admin: /\/admin/,
}

const ROLE_PATH: Record<string, string> = {
  student: '/student',
  teacher: '/teacher',
  admin: '/admin',
  platform_admin: '/admin',
}

export async function preparePage(page: Page): Promise<ExternalMockState> {
  await pinLoopbackHost(page)
  await seedCookieConsent(page)
  return installExternalMocks(page)
}

/** Send localhost document/XHR hits to 127.0.0.1 so host-only auth cookies apply. */
async function pinLoopbackHost(page: Page): Promise<void> {
  if (loopbackPinned.has(page)) return
  loopbackPinned.add(page)
  await page.route(/^http:\/\/localhost:3000(?:\/|$)/, async (route) => {
    const url = route.request().url().replace(LOCALHOST_ORIGIN, LOOPBACK_ORIGIN)
    await route.continue({ url })
  })
}

async function authCookiesFromResponse(
  response: CookieHeaderSource,
): Promise<Array<{ name: string; value: string }>> {
  const raw = await Promise.resolve(response.headersArray())
  const headers = Array.isArray(raw) ? raw : []
  return headers
    .filter((h) => String(h.name).toLowerCase() === 'set-cookie')
    .map((h) => {
      const pair = String(h.value).split(';')[0] ?? ''
      const eq = pair.indexOf('=')
      if (eq < 1) return null
      return { name: pair.slice(0, eq).trim(), value: pair.slice(eq + 1).trim() }
    })
    .filter((c): c is { name: string; value: string } =>
      Boolean(c && c.name.startsWith('sb-hooshagar-auth-token')),
    )
}

/** Chrome often rewrites 127.0.0.1 → localhost; host-only cookies would not follow. */
async function syncLoopbackAuthCookies(
  page: Page,
  fromResponse?: CookieHeaderSource,
): Promise<void> {
  const fromHeader = fromResponse ? await authCookiesFromResponse(fromResponse) : []
  const fromJar = (await page.context().cookies()).filter((c) =>
    c.name.startsWith('sb-hooshagar-auth-token'),
  )
  const byName = new Map<string, string>()
  for (const c of [...fromJar, ...fromHeader]) {
    if (c.name && c.value) byName.set(c.name, c.value)
  }
  if (!byName.size) return
  await page.context().addCookies(
    [...byName.entries()].flatMap(([name, value]) =>
      [`${LOOPBACK_ORIGIN}/`, `${LOCALHOST_ORIGIN}/`].map((url) => ({
        name,
        value,
        url,
      })),
    ),
  )
}

async function gotoWithCompileBudget(page: Page, dest: string): Promise<void> {
  try {
    await page.goto(dest, { waitUntil: 'commit', timeout: 300_000 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    if (!/ERR_ABORTED|frame was detached|Timeout/i.test(msg)) throw error
  }
}

async function gotoRoleDashboard(page: Page, actor: E2eActor): Promise<void> {
  const path = ROLE_PATH[actor.role] ?? '/dashboard'
  const dest = `${LOOPBACK_ORIGIN}${path}`
  await gotoWithCompileBudget(page, dest)
  if (/\/login/.test(page.url())) {
    await syncLoopbackAuthCookies(page)
    await gotoWithCompileBudget(page, dest)
  }
  if (/\/login/.test(page.url())) {
    const names = (await page.context().cookies()).map((c) => c.name).join(',')
    throw new Error(
      `نشست بعد از ورود اعمال نشد (${actor.role}). url=${page.url()} cookies=${names || 'none'}`,
    )
  }
  await page.waitForURL(ROLE_DASHBOARD[actor.role] ?? /\/dashboard/, { timeout: 180_000 })
}

export async function loginViaApi(
  page: Page,
  actor: E2eActor,
  options: { visitDashboard?: boolean } = {},
): Promise<void> {
  await pinLoopbackHost(page)
  await seedCookieConsent(page)
  const payload =
    actor.role === 'student'
      ? {
          method: 'student_pin',
          student_number: actor.studentNumber,
          pin: actor.pin,
        }
      : {
          method: 'staff',
          username: actor.username,
          password: actor.password,
        }

  const response = await page.request.post(`${LOOPBACK_ORIGIN}/api/auth/login`, {
    data: payload,
    timeout: 300_000,
  })
  const body = (await response.json()) as { success?: boolean; error?: string }
  if (!response.ok() || !body.success) {
    throw new Error(`ورود API ناموفق بود (${actor.role}): ${body.error || response.status()}`)
  }

  await syncLoopbackAuthCookies(page, response)
  if (options.visitDashboard === false) return
  await gotoRoleDashboard(page, actor)
}

export async function loginWithOtpUi(
  page: Page,
  actor: E2eActor,
): Promise<void> {
  await pinLoopbackHost(page)
  await seedCookieConsent(page)

  await page.goto(`${LOOPBACK_ORIGIN}/login?tab=sms`, { waitUntil: 'domcontentloaded' })
  await page.getByTestId('login-page').waitFor({ state: 'visible', timeout: 90_000 })
  await page.getByTestId('login-tab-sms').click()
  const phone = page.getByTestId('login-phone')
  await phone.waitFor({ state: 'visible', timeout: 90_000 })
  await phone.fill(actor.nationalCode)
  const sendWait = page.waitForResponse(
    (res) => res.url().includes('/api/auth/send-otp') && res.request().method() === 'POST',
    { timeout: 180_000 },
  )
  await Promise.all([
    sendWait,
    page.getByRole('button', { name: 'دریافت کد تأیید' }).click(),
  ])
  const sent = await sendWait
  if (!sent.ok()) {
    const payload = (await sent.json().catch(() => ({}))) as { error?: string }
    throw new Error(`ارسال OTP از UI ناموفق بود: ${payload.error || sent.status()}`)
  }
  await page.getByTestId('login-otp').waitFor({ state: 'visible', timeout: 30_000 })
  const otp = await readLatestOtp(actor.phone)
  await page.getByTestId('login-otp').fill(otp)
  const loginWait = page.waitForResponse(
    (res) => res.url().includes('/api/auth/login') && res.request().method() === 'POST',
    { timeout: 180_000 },
  )
  await Promise.all([
    loginWait,
    page.getByRole('button', { name: 'تأیید و ورود' }).click(),
  ])
  const loggedIn = await loginWait
  if (!loggedIn.ok()) {
    const payload = (await loggedIn.json().catch(() => ({}))) as { error?: string }
    throw new Error(`ورود OTP ناموفق بود: ${payload.error || loggedIn.status()}`)
  }

  await syncLoopbackAuthCookies(page, loggedIn)
  const expected = ROLE_DASHBOARD[actor.role] ?? /\/dashboard/
  try {
    await page.waitForURL(expected, { timeout: 180_000, waitUntil: 'domcontentloaded' })
  } catch {
    await gotoRoleDashboard(page, actor)
  }
  if (/\/login/.test(page.url())) {
    await gotoRoleDashboard(page, actor)
  }
}

export async function logoutViaUi(page: Page): Promise<void> {
  const trigger = page.locator('[data-testid="desktop-nav"] [data-testid="logout-trigger"]')
  await trigger.waitFor({ state: 'visible', timeout: 90_000 })
  const confirm = page.getByRole('button', { name: 'بله، خارج می‌شوم' }).filter({ visible: true })

  // Teacher/admin dashboards keep remounting while widgets compile; retry opening
  // the dialog until the confirm action is actually on screen.
  await expect.poll(async () => {
    if (await confirm.count()) return true
    await trigger.click({ timeout: 15_000 })
    try {
      await confirm.waitFor({ state: 'visible', timeout: 4_000 })
      return true
    } catch {
      return false
    }
  }, { timeout: 45_000, intervals: [500, 1_000, 2_000] }).toBe(true)

  await Promise.all([
    page.waitForURL(/\/login/, { timeout: 120_000 }),
    confirm.first().click({ noWaitAfter: true, timeout: 60_000 }),
  ])
}
