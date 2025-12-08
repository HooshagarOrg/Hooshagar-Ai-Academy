// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(() => ({
        data: { user: null },
        error: null
      }))
    }
  }))
}));

describe('Audit Logger', () => {
  it('should not throw when user is not authenticated', async () => {
    const { logAudit } = await import('@/lib/audit-logger');
    
    const mockRequest = {
      headers: {
        get: jest.fn((name: string) => {
          if (name === 'x-forwarded-for') return '127.0.0.1';
          if (name === 'user-agent') return 'test-agent';
          return null;
        })
      }
    } as any;
    
    await expect(logAudit(mockRequest, {
      action: 'create',
      resourceType: 'student',
      resourceId: 'test-id',
      newData: { name: 'Test' }
    })).resolves.not.toThrow();
  });
});
