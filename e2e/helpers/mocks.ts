import type { Page, Request, Route } from '@playwright/test'

export interface CapturedExternalCall {
  service: 'kavenegar' | 'zarinpal' | 'gemini' | 'openrouter'
  method: string
  url: string
}

export interface ExternalMockState {
  calls: CapturedExternalCall[]
  kavenegarReceptors: string[]
  paymentTxId: string | null
  paymentUrl: string | null
}

const KAVENEGAR_OK = {
  return: { status: 200, message: 'OK' },
  entries: [
    {
      messageid: 1,
      message: 'test',
      status: 5,
      statustext: 'sent',
      sender: '10008663',
      receptor: '09120000000',
      date: Date.now(),
      cost: 0,
    },
  ],
}

const ZARINPAL_OK = {
  data: { code: 100, authority: `A${'0'.repeat(35)}`, message: 'Success' },
  errors: [],
}

const GEMINI_OK = {
  candidates: [
    {
      content: { role: 'model', parts: [{ text: 'پاسخ ثابت هوشاگر برای محیط تست' }] },
      finishReason: 'STOP',
    },
  ],
}

function receptorFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    return parsed.searchParams.get('receptor')
  } catch {
    return null
  }
}

/**
 * Intercepts browser traffic to Kavenegar, Zarinpal, and Gemini.
 * Server-side fetches from Next.js are not visible here — those are
 * short-circuited when APP_ENV=test / mock keys are set.
 */
export async function installExternalMocks(page: Page): Promise<ExternalMockState> {
  const state: ExternalMockState = {
    calls: [],
    kavenegarReceptors: [],
    paymentTxId: null,
    paymentUrl: null,
  }

  const record = (service: CapturedExternalCall['service'], request: Request): void => {
    state.calls.push({ service, method: request.method(), url: request.url() })
  }

  await page.route(/api\.kavenegar\.com/i, async (route: Route) => {
    record('kavenegar', route.request())
    const receptor = receptorFromUrl(route.request().url())
    if (receptor) state.kavenegarReceptors.push(receptor)
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(KAVENEGAR_OK),
    })
  })

  await page.route(/api\.zarinpal\.com/i, async (route: Route) => {
    record('zarinpal', route.request())
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(ZARINPAL_OK),
    })
  })

  await page.route(/zarinpal\.com\/pg\/StartPay/i, async (route: Route) => {
    record('zarinpal', route.request())
    const authority = route.request().url().split('/').pop() || `A${'0'.repeat(35)}`
    const origin = new URL(page.url()).origin
    const txId = state.paymentTxId || ''
    const location = `${origin}/api/payment?tx_id=${encodeURIComponent(txId)}&Authority=${encodeURIComponent(authority)}&Status=OK`
    await route.fulfill({
      status: 200,
      contentType: 'text/html; charset=utf-8',
      body: `<!doctype html><meta http-equiv="refresh" content="0;url=${location}"><script>location.replace(${JSON.stringify(location)})</script>`,
    })
  })

  await page.route(/generativelanguage\.googleapis\.com/i, async (route: Route) => {
    record('gemini', route.request())
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(GEMINI_OK),
    })
  })

  await page.route(/openrouter\.ai\/api/i, async (route: Route) => {
    record('openrouter', route.request())
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        choices: [{ message: { content: 'پاسخ ثابت هوشاگر برای محیط تست' } }],
      }),
    })
  })

  await page.route('**/api/payment', async (route: Route) => {
    const request = route.request()
    if (request.method() !== 'POST') {
      await route.continue()
      return
    }
    const response = await route.fetch()
    const json = (await response.json()) as {
      transaction_id?: string
      payment_url?: string
    }
    state.paymentTxId = json.transaction_id ?? state.paymentTxId
    state.paymentUrl = json.payment_url ?? state.paymentUrl
    await route.fulfill({
      status: response.status(),
      headers: response.headers(),
      body: JSON.stringify(json),
    })
  })

  return state
}
