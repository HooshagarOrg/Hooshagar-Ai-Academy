import {
  CANONICAL_SW_PATH,
  isCanonicalServiceWorkerScript,
  serviceWorkerScriptUrl,
} from '@/lib/pwa/canonical-sw'

describe('canonical service worker', () => {
  it('accepts only same-origin /sw.js', () => {
    expect(
      isCanonicalServiceWorkerScript(
        'https://www.hooshagar.ir/sw.js',
        'https://www.hooshagar.ir',
      ),
    ).toBe(true)
    expect(isCanonicalServiceWorkerScript(CANONICAL_SW_PATH, 'https://www.hooshagar.ir')).toBe(
      true,
    )
  })

  it('rejects the legacy service-worker.js script', () => {
    expect(
      isCanonicalServiceWorkerScript(
        'https://www.hooshagar.ir/service-worker.js',
        'https://www.hooshagar.ir',
      ),
    ).toBe(false)
  })

  it('rejects other origins and empty urls', () => {
    expect(
      isCanonicalServiceWorkerScript('https://evil.example/sw.js', 'https://www.hooshagar.ir'),
    ).toBe(false)
    expect(isCanonicalServiceWorkerScript('', 'https://www.hooshagar.ir')).toBe(false)
  })

  it('prefers the active worker script url', () => {
    expect(
      serviceWorkerScriptUrl({
        active: { scriptURL: 'https://www.hooshagar.ir/sw.js' },
        waiting: { scriptURL: 'https://www.hooshagar.ir/service-worker.js' },
        installing: null,
      }),
    ).toBe('https://www.hooshagar.ir/sw.js')
  })
})
