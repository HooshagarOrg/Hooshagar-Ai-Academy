import { TextEncoder, TextDecoder } from 'util'
import { ReadableStream, WritableStream, TransformStream } from 'stream/web'
import { vi } from 'vitest'
import '@testing-library/jest-dom/vitest'

// Unit tests must not load .env.test or talk to a live Supabase project.
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_SUPABASE_URL ??= 'https://ci-placeholder.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY ??= 'test-service-role-key'
process.env.GOOGLE_API_KEY ??= 'test-google-key'
process.env.OPENROUTER_API_KEY ??= 'test-openrouter-key'

globalThis.TextEncoder = TextEncoder as typeof globalThis.TextEncoder
globalThis.TextDecoder = TextDecoder as typeof globalThis.TextDecoder
globalThis.ReadableStream = ReadableStream as typeof globalThis.ReadableStream
globalThis.WritableStream = WritableStream as typeof globalThis.WritableStream
globalThis.TransformStream = TransformStream as typeof globalThis.TransformStream
globalThis.setImmediate =
  globalThis.setImmediate ||
  ((fn: (...args: unknown[]) => void, ...args: unknown[]) => globalThis.setTimeout(fn, 0, ...args))

// Existing Jest-era tests use jest.fn / jest.mock; Vitest provides compatible globals.
Object.assign(globalThis, { jest: vi })

vi.mock('server-only', () => ({}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    getAll: () => [],
    get: () => undefined,
    set: vi.fn(),
    delete: vi.fn(),
  })),
  headers: vi.fn(async () => new Headers()),
}))

vi.mock('@sentry/nextjs', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  flush: vi.fn(async () => true),
  getClient: vi.fn(),
  withScope: vi.fn((callback: (scope: { setTag: () => void; setExtra: () => void }) => void) =>
    callback({ setTag: vi.fn(), setExtra: vi.fn() }),
  ),
}))
