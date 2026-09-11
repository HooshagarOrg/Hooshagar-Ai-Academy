import { NextRequest } from 'next/server'

export function jsonRequest(
  url: string,
  init: {
    method?: string
    body?: unknown
    headers?: Record<string, string>
    search?: Record<string, string>
  } = {},
): NextRequest {
  const target = new URL(url, 'http://localhost:3000')
  if (init.search) {
    for (const [key, value] of Object.entries(init.search)) {
      target.searchParams.set(key, value)
    }
  }
  const headers = new Headers(init.headers)
  if (init.body !== undefined && !headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }
  return new NextRequest(target, {
    method: init.method ?? (init.body !== undefined ? 'POST' : 'GET'),
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  })
}
