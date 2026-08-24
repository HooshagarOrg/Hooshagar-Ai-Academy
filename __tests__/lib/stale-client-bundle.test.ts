import {
  isStaleClientBundleError,
  maybeHardReloadOnStaleBundle,
  shouldAttemptHardReload,
} from '@/lib/monitoring/stale-client-bundle'

function memoryStorage(initial: Record<string, string> = {}): Pick<Storage, 'getItem' | 'setItem'> {
  const store = { ...initial }
  return {
    getItem(key: string) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null
    },
    setItem(key: string, value: string) {
      store[key] = value
    },
  }
}

describe('stale-client-bundle', () => {
  describe('isStaleClientBundleError', () => {
    it('detects ChunkLoadError by name', () => {
      const error = new Error('Loading chunk 6470 failed')
      error.name = 'ChunkLoadError'
      expect(isStaleClientBundleError(error)).toBe(true)
    })

    it('detects Next.js chunk load messages', () => {
      expect(
        isStaleClientBundleError(
          new Error(
            'Loading chunk 6470 failed.\n(error: https://www.hooshagar.ir/_next/static/chunks/app/global-error.js)',
          ),
        ),
      ).toBe(true)
    })

    it('detects the App Router null cache .get() crash', () => {
      expect(
        isStaleClientBundleError(
          new TypeError("Cannot read properties of null (reading 'get')"),
        ),
      ).toBe(true)
    })

    it('ignores unrelated errors', () => {
      expect(isStaleClientBundleError(new TypeError('Cannot read properties of undefined (reading "map")'))).toBe(false)
      expect(
        isStaleClientBundleError(
          new Error('Multiple Sentry Session Replay instances are not supported'),
        ),
      ).toBe(false)
    })
  })

  describe('shouldAttemptHardReload', () => {
    it('allows the first reload and blocks a second within cooldown', () => {
      const storage = memoryStorage()
      expect(shouldAttemptHardReload(storage, 1_000)).toBe(true)
      expect(shouldAttemptHardReload(storage, 5_000)).toBe(false)
      expect(shouldAttemptHardReload(storage, 20_000)).toBe(true)
    })
  })

  describe('maybeHardReloadOnStaleBundle', () => {
    it('reloads once for a chunk error', () => {
      const reload = jest.fn()
      const storage = memoryStorage()
      const error = new Error('Loading chunk 1 failed')
      error.name = 'ChunkLoadError'

      expect(maybeHardReloadOnStaleBundle(error, { reload }, storage, 1_000)).toBe(true)
      expect(reload).toHaveBeenCalledTimes(1)
      expect(maybeHardReloadOnStaleBundle(error, { reload }, storage, 2_000)).toBe(false)
      expect(reload).toHaveBeenCalledTimes(1)
    })

    it('does not reload for unrelated errors', () => {
      const reload = jest.fn()
      expect(
        maybeHardReloadOnStaleBundle(new Error('network'), { reload }, memoryStorage()),
      ).toBe(false)
      expect(reload).not.toHaveBeenCalled()
    })
  })
})
