import { isRelaxedAuthRuntime } from '@/lib/security/test-runtime'

describe('isRelaxedAuthRuntime', () => {
  const previousE2e = process.env.HOOSHAGAR_E2E
  const previousAppEnv = process.env.APP_ENV
  const previousNodeEnv = process.env.NODE_ENV

  afterEach(() => {
    restoreEnv('HOOSHAGAR_E2E', previousE2e)
    restoreEnv('APP_ENV', previousAppEnv)
    restoreEnv('NODE_ENV', previousNodeEnv)
  })

  it('relaxes Nightly Playwright when HOOSHAGAR_E2E=1', () => {
    process.env.HOOSHAGAR_E2E = '1'
    process.env.NODE_ENV = 'production'
    delete process.env.APP_ENV
    expect(isRelaxedAuthRuntime()).toBe(true)
  })

  it('does not relax production without the e2e flag', () => {
    delete process.env.HOOSHAGAR_E2E
    delete process.env.APP_ENV
    process.env.NODE_ENV = 'production'
    expect(isRelaxedAuthRuntime()).toBe(false)
  })
})

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name]
    return
  }
  process.env[name] = value
}
