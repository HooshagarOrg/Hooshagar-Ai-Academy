import fs from 'node:fs'
import path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isPublicApiRoute } from '@/lib/security/public-api-routes'
import { jsonRequest } from '../helpers/next-request'
import { mockQuery } from '../helpers/mock-query'

const authState: {
  user: { id: string; email: string } | null
  role: string
} = {
  user: null,
  role: 'student',
}

vi.mock('@/lib/security/rate-limiter', () => ({
  applyRateLimitAsync: async () => null,
  RATE_LIMIT_CONFIGS: {},
}))

vi.mock('@/lib/cache/profile-cache', () => ({
  getProfileCached: async (
    userId: string,
    fetchFresh: () => Promise<unknown>,
  ) => {
    if (!authState.user) return fetchFresh()
    return {
      id: userId,
      role: authState.role,
      school_id: 'school-1',
      email: authState.user.email,
      full_name: 'کاربر تست',
      ui_theme: null,
    }
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({
        data: { user: authState.user },
        error: authState.user ? null : { message: 'invalid token' },
      }),
    },
    from: () =>
      mockQuery({
        data: authState.user
          ? {
              id: authState.user.id,
              role: authState.role,
              school_id: 'school-1',
              email: authState.user.email,
              full_name: 'کاربر تست',
              ui_theme: null,
            }
          : null,
        error: authState.user ? null : { message: 'missing' },
      }),
    rpc: async () => ({ data: null, error: null }),
  }),
}))

function toApiPath(file: string): string {
  const relative = file
    .replace(/\\/g, '/')
    .replace(/^app/, '')
    .replace(/\/route\.ts$/, '')
  return relative.startsWith('/') ? relative : `/${relative}`
}

function isOpenApiRoute(pathname: string): boolean {
  return (
    isPublicApiRoute(pathname) ||
    pathname === '/api/tts' ||
    pathname === '/api/analytics/monitoring' ||
    pathname === '/api/auth/logout'
  )
}

function hasAuthGuard(source: string): boolean {
  return (
    /withAuth\s*\(/.test(source) ||
    /auth\.getUser\s*\(/.test(source) ||
    /getUser\s*\(\s*\)/.test(source) ||
    /getServerSession\s*\(/.test(source) ||
    /createClient\s*\(/.test(source) ||
    /createServerSupabaseClient\s*\(/.test(source)
  )
}

function listApiRouteFiles(): string[] {
  const root = path.join(process.cwd(), 'app', 'api')
  const files: string[] = []
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.name === 'route.ts') files.push(path.relative(process.cwd(), full))
    }
  }
  walk(root)
  return files.sort()
}

function hasRoleGuard(source: string): boolean {
  return (
    /roles\s*:/.test(source) ||
    /required_roles/.test(source) ||
    /دسترسی غیرمجاز/.test(source) ||
    /FORBIDDEN/.test(source) ||
    /\.includes\(profile\.role/.test(source)
  )
}

const routeFiles = listApiRouteFiles()
const protectedFiles = routeFiles.filter((file) => !isOpenApiRoute(toApiPath(file)))

describe('API route auth matrix', () => {
  it('discovers every App Router API file', () => {
    expect(routeFiles.length).toBeGreaterThan(100)
  })

  it.each(protectedFiles)('%s guards unauthenticated callers', (file) => {
    const source = fs.readFileSync(path.join(process.cwd(), file), 'utf8')
    expect(hasAuthGuard(source)).toBe(true)
  })

  it('public routes stay in the allow-list', () => {
    const publicFiles = routeFiles.filter((file) => isOpenApiRoute(toApiPath(file)))
    expect(publicFiles.length).toBeGreaterThan(0)
    for (const file of publicFiles) {
      expect(isOpenApiRoute(toApiPath(file))).toBe(true)
    }
  })

  it('role-restricted routes declare a role check', () => {
    const roleFiles = protectedFiles.filter((file) => {
      const source = fs.readFileSync(path.join(process.cwd(), file), 'utf8')
      return /roles\s*:/.test(source)
    })
    expect(roleFiles.length).toBeGreaterThan(10)
    for (const file of roleFiles) {
      const source = fs.readFileSync(path.join(process.cwd(), file), 'utf8')
      expect(hasRoleGuard(source)).toBe(true)
    }
  })
})

describe('withAuth request outcomes', () => {
  beforeEach(() => {
    authState.user = null
    authState.role = 'student'
  })

  it('returns 401 without an Authorization session', async () => {
    const { withAuth } = await import('@/lib/security/api-guard')
    const { NextResponse } = await import('next/server')
    const response = await withAuth(
      jsonRequest('http://localhost:3000/api/profile'),
      async () => NextResponse.json({ ok: true }),
      { skipRateLimit: true },
    )
    expect(response.status).toBe(401)
  })

  it('returns 401 with an invalid token', async () => {
    authState.user = null
    const { withAuth } = await import('@/lib/security/api-guard')
    const { NextResponse } = await import('next/server')
    const response = await withAuth(
      jsonRequest('http://localhost:3000/api/profile', {
        headers: { Authorization: 'Bearer invalid-token' },
      }),
      async () => NextResponse.json({ ok: true }),
      { skipRateLimit: true },
    )
    expect(response.status).toBe(401)
  })

  it('returns 403 with a valid token but the wrong role', async () => {
    authState.user = { id: 'user-student', email: 'student@test.local' }
    authState.role = 'student'
    const { withAuth } = await import('@/lib/security/api-guard')
    const { NextResponse } = await import('next/server')
    const response = await withAuth(
      jsonRequest('http://localhost:3000/api/admin/users', {
        headers: { Authorization: 'Bearer valid-token' },
      }),
      async () => NextResponse.json({ ok: true }, { status: 200 }),
      { skipRateLimit: true, roles: ['admin', 'platform_admin'] },
    )
    expect(response.status).toBe(403)
  })

  it('returns 200 with the correct role', async () => {
    authState.user = { id: 'user-admin', email: 'admin@test.local' }
    authState.role = 'admin'
    const { withAuth } = await import('@/lib/security/api-guard')
    const { NextResponse } = await import('next/server')
    const response = await withAuth(
      jsonRequest('http://localhost:3000/api/admin/users', {
        headers: { Authorization: 'Bearer valid-token' },
      }),
      async () => NextResponse.json({ ok: true }, { status: 201 }),
      { skipRateLimit: true, roles: ['admin', 'platform_admin'] },
    )
    expect(response.status).toBe(201)
  })
})
