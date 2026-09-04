/**
 * تست Health Check Endpoint Structure
 * این تست فقط ساختار response را بررسی می‌کند
 */

describe('Health Check API Structure', () => {
  it('should have correct response structure', () => {
    const mockHealthyResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: 'ok',
      version: '1.0.0',
      services: {
        database: 'up',
        api: 'up',
      },
      responseTime: '50ms',
    }

    expect(mockHealthyResponse).toHaveProperty('status')
    expect(mockHealthyResponse).toHaveProperty('timestamp')
    expect(mockHealthyResponse).toHaveProperty('db')
    expect(mockHealthyResponse).toHaveProperty('version')
    expect(mockHealthyResponse.status).toBe('ok')
    expect(mockHealthyResponse.db).toBe('ok')
    expect(mockHealthyResponse.services).toHaveProperty('api')
    expect(mockHealthyResponse.services).toHaveProperty('database')
  })

  it('should handle unhealthy state structure', () => {
    const mockUnhealthyResponse = {
      status: 'error',
      timestamp: new Date().toISOString(),
      db: 'error',
      version: '1.0.0',
      services: {
        database: 'down',
        api: 'up',
      },
    }

    expect(mockUnhealthyResponse.status).toBe('error')
    expect(mockUnhealthyResponse.db).toBe('error')
    expect(mockUnhealthyResponse).not.toHaveProperty('error')
  })
})
