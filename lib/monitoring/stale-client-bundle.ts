const STORAGE_KEY = 'hooshagar:stale-bundle-reload'
const DEFAULT_COOLDOWN_MS = 15_000

function errorName(error: unknown): string {
  return error instanceof Error ? error.name : ''
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return ''
}

/** Chunk کهنه بعد از deploy، یا باگ روتر Next هنگام cache node تهی */
export function isStaleClientBundleError(error: unknown): boolean {
  const name = errorName(error)
  const message = errorMessage(error)

  if (name === 'ChunkLoadError') return true
  if (/Loading chunk .+ failed/i.test(message)) return true
  if (/Loading CSS chunk /i.test(message)) return true
  if (message.includes("Cannot read properties of null (reading 'get')")) return true

  return false
}

export function shouldAttemptHardReload(
  storage: Pick<Storage, 'getItem' | 'setItem'>,
  now: number = Date.now(),
  cooldownMs: number = DEFAULT_COOLDOWN_MS,
): boolean {
  const last = Number(storage.getItem(STORAGE_KEY) ?? '0')
  if (Number.isFinite(last) && last > 0 && now - last < cooldownMs) {
    return false
  }
  storage.setItem(STORAGE_KEY, String(now))
  return true
}

export function maybeHardReloadOnStaleBundle(
  error: unknown,
  location: { reload: () => void },
  storage: Pick<Storage, 'getItem' | 'setItem'> | null,
  now: number = Date.now(),
): boolean {
  if (!isStaleClientBundleError(error)) return false

  if (!storage) {
    location.reload()
    return true
  }

  try {
    if (!shouldAttemptHardReload(storage, now)) return false
  } catch {
    location.reload()
    return true
  }

  location.reload()
  return true
}
