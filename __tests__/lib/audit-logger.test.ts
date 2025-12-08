import { logAuditSimple } from '@/lib/audit-logger';

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(() => ({ data: { user: null }, error: null }))
    },
    from: jest.fn(() => ({
      insert: jest.fn(() => ({ error: null }))
    }))
  }))
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('Audit Logger', () => {
  it('should not throw when logging simple audit', async () => {
    await expect(logAuditSimple('user-123', {
      action: 'delete',
      resourceType: 'exam',
      resourceId: 'exam-456'
    })).resolves.not.toThrow();
  });
  
  it('should handle different action types', async () => {
    await expect(logAuditSimple('user-123', {
      action: 'create',
      resourceType: 'student',
      resourceId: 'student-789',
      newData: { name: 'Test Student' }
    })).resolves.not.toThrow();
  });
});

