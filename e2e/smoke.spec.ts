import { expect, test } from '@playwright/test'

test.describe('pilot smoke', () => {
  test('home page responds with 200', async ({ request }) => {
    const response = await request.get('/', { timeout: 180_000 })
    expect(response.ok()).toBeTruthy()
    const html = await response.text()
    expect(html).toMatch(/lang=["']fa/i)
  })

  test('health API responds with status payload', async ({ request }) => {
    const response = await request.get('/api/health', { timeout: 180_000 })
    expect([200, 503]).toContain(response.status())
    const body = (await response.json()) as { status?: string }
    expect(['healthy', 'unhealthy']).toContain(body.status)
  })

  test('ready probe always returns ready', async ({ request }) => {
    const response = await request.get('/api/ready', { timeout: 180_000 })
    expect(response.status()).toBe(200)
    const body = (await response.json()) as { ready?: boolean }
    expect(body.ready).toBe(true)
  })
})
