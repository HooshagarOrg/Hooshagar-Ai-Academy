import { expect, test } from '@playwright/test'

test.describe('protected API without session', () => {
  test('students API returns 401 JSON', async ({ request }) => {
    const response = await request.get('/api/students', { timeout: 180_000 })
    expect(response.status()).toBe(401)
    const body = (await response.json()) as { error_code?: string }
    expect(body.error_code).toBe('UNAUTHORIZED')
  })

  test('grades API returns 401', async ({ request }) => {
    const response = await request.get('/api/grades', { timeout: 180_000 })
    expect(response.status()).toBe(401)
  })

  test('notifications API returns 401', async ({ request }) => {
    const response = await request.get('/api/notifications', { timeout: 180_000 })
    expect(response.status()).toBe(401)
  })

  test('lottery admin action is not public', async ({ request }) => {
    const response = await request.post('/api/lottery', {
      timeout: 180_000,
      data: { action: 'draw' },
    })
    expect(response.status()).toBe(401)
  })

  test('financial SMS is not a public route', async ({ request }) => {
    const response = await request.post('/api/notifications/financial', {
      timeout: 180_000,
      data: { type: 'debt_reminder', student_ids: [] },
    })
    expect(response.status()).toBe(401)
  })
})
