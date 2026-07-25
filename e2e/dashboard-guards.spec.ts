import { expect, test } from '@playwright/test'

async function expectLoginRedirect(
  request: import('@playwright/test').APIRequestContext,
  path: string
): Promise<void> {
  const response = await request.get(path, {
    maxRedirects: 0,
    timeout: 180_000,
  })
  // Middleware معمولاً 307/308 برمی‌گرداند؛ بعضی محیط‌ها 302
  expect([301, 302, 303, 307, 308]).toContain(response.status())
  const location = response.headers().location || ''
  expect(location).toMatch(/\/login/)
}

test.describe('dashboard auth guards (pilot)', () => {
  test('unauthenticated /student redirects to login', async ({ request }) => {
    await expectLoginRedirect(request, '/student')
  })

  test('unauthenticated /teacher redirects to login', async ({ request }) => {
    await expectLoginRedirect(request, '/teacher')
  })

  test('unauthenticated /parent redirects to login', async ({ request }) => {
    await expectLoginRedirect(request, '/parent')
  })

  test('unauthenticated /admin redirects to login', async ({ request }) => {
    await expectLoginRedirect(request, '/admin')
  })

  test('/dashboard without session redirects to login', async ({ request }) => {
    await expectLoginRedirect(request, '/dashboard')
  })
})
