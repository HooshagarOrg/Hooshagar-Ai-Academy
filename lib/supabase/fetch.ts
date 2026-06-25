import { Agent, fetch as undiciFetch } from 'undici'

const timeoutMs = Number(process.env.SUPABASE_FETCH_TIMEOUT_MS ?? 25_000)

const agent = new Agent({
  connectTimeout: timeoutMs,
  bodyTimeout: timeoutMs,
  headersTimeout: timeoutMs,
  // غیرفعال کردن keep-alive برای جلوگیری از ECONNRESET
  // هر request یک connection جدید باز می‌کند
  keepAliveTimeout: 1,
  keepAliveMaxTimeout: 1,
})

/** fetch با connect-timeout بلند — فقط سمت سرور (نه middleware) */
export async function supabaseFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : input.url

  return undiciFetch(url, {
    ...(init ?? {}),
    dispatcher: agent,
  } as Parameters<typeof undiciFetch>[1]) as unknown as Promise<Response>
}

export const supabaseGlobalOptions = {
  global: { fetch: supabaseFetch },
} as const
