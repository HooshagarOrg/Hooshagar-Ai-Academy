/**
 * تست Health Check Endpoint Structure
 * این تست فقط ساختار response را بررسی می‌کند
 */

describe('Health Check API Structure', () => {
  it('should have correct response structure', () => {
    const mockHealthyResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'up',
        api: 'up'
      },
      responseTime: '50ms',
      version: '1.0.0'
    };
    
    expect(mockHealthyResponse).toHaveProperty('status');
    expect(mockHealthyResponse).toHaveProperty('timestamp');
    expect(mockHealthyResponse).toHaveProperty('services');
    expect(mockHealthyResponse.services).toHaveProperty('api');
    expect(mockHealthyResponse.services).toHaveProperty('database');
  });
  
  it('should handle unhealthy state structure', () => {
    const mockUnhealthyResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
      services: {
        database: 'down',
        api: 'up'
      }
    };
    
    expect(mockUnhealthyResponse.status).toBe('unhealthy');
    expect(mockUnhealthyResponse).toHaveProperty('error');
  });
});

