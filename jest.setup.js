import '@testing-library/jest-dom';

// Mock environment variables برای تست
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.GOOGLE_API_KEY = 'test-google-key';
process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
process.env.NODE_ENV = 'test';

// Mock setImmediate for pino
global.setImmediate = global.setImmediate || ((fn, ...args) => global.setTimeout(fn, 0, ...args));

