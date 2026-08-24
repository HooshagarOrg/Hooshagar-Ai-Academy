export const CANONICAL_SW_PATH = '/sw.js'

export function isCanonicalServiceWorkerScript(
  scriptURL: string,
  origin: string,
): boolean {
  if (!scriptURL) return false
  try {
    const url = new URL(scriptURL, origin)
    return url.origin === origin && url.pathname === CANONICAL_SW_PATH
  } catch {
    return false
  }
}

type WorkerScript = { scriptURL: string } | null

export function serviceWorkerScriptUrl(registration: {
  active: WorkerScript
  waiting: WorkerScript
  installing: WorkerScript
}): string {
  return (
    registration.active?.scriptURL ??
    registration.waiting?.scriptURL ??
    registration.installing?.scriptURL ??
    ''
  )
}
