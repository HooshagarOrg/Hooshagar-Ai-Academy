import {
  createTestServiceClient,
  createTestSupabaseClient,
} from '../helpers/supabase-test-client'

const TEST_PROJECT_URL = 'https://nllxjhmmczkongrdzbfu.supabase.co'

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name]
    return
  }
  process.env[name] = value
}

describe('supabase test client on Node without native WebSocket', () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const previousAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const previousService = process.env.SUPABASE_SERVICE_ROLE_KEY

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = TEST_PROJECT_URL
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
  })

  afterEach(() => {
    restoreEnv('NEXT_PUBLIC_SUPABASE_URL', previousUrl)
    restoreEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', previousAnon)
    restoreEnv('SUPABASE_SERVICE_ROLE_KEY', previousService)
  })

  it('constructs the service client without throwing', () => {
    expect(() => createTestServiceClient()).not.toThrow()
  })

  it('constructs the anon client without throwing', () => {
    expect(() => createTestSupabaseClient()).not.toThrow()
  })
})
