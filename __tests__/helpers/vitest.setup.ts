import path from 'node:path'
import { TextEncoder, TextDecoder } from 'util'
import { ReadableStream, WritableStream, TransformStream } from 'stream/web'
import dotenv from 'dotenv'
import { vi } from 'vitest'
import '@testing-library/jest-dom/vitest'

dotenv.config({
  path: path.resolve(process.cwd(), '.env.test'),
  override: true,
})

globalThis.TextEncoder = TextEncoder as typeof globalThis.TextEncoder
globalThis.TextDecoder = TextDecoder as typeof globalThis.TextDecoder
globalThis.ReadableStream = ReadableStream as typeof globalThis.ReadableStream
globalThis.WritableStream = WritableStream as typeof globalThis.WritableStream
globalThis.TransformStream = TransformStream as typeof globalThis.TransformStream

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
