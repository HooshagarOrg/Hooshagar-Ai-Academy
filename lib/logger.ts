/**
 * Structured Logger با Pino
 * جایگزین console.log برای Production
 * 
 * استفاده:
 * import logger from '@/lib/logger'
 * logger.info({ userId: '123' }, 'User logged in')
 * logger.error({ error: err.message }, 'Failed to process')
 */

import pino from 'pino';

// Logger برای Production با Secret Redaction
const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  browser: {
    asObject: true
  },
  // حذف خودکار اطلاعات حساس
  redact: {
    paths: [
      'password',
      'apiKey',
      'api_key',
      'token',
      'secret',
      'authorization',
      'cookie',
      'recaptcha_token',
      '*.password',
      '*.apiKey',
      '*.api_key',
      '*.token',
      '*.secret',
      '*.authorization',
      'GOOGLE_API_KEY',
      'OPENROUTER_API_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'KAVENEGAR_API_KEY',
      'RECAPTCHA_SECRET_KEY',
    ],
    censor: '***REDACTED***'
  },
  // Format زیبا برای Development
  transport: process.env.NODE_ENV !== 'production' 
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        }
      }
    : undefined,
});

export default logger;

/**
 * Helper functions برای استفاده راحت‌تر
 */
export const log = {
  info: (message: string, data?: Record<string, any>) => {
    logger.info(data || {}, message);
  },
  
  error: (message: string, error?: Error | unknown, data?: Record<string, any>) => {
    const errorData = error instanceof Error 
      ? { error: error.message, stack: error.stack, ...data }
      : { error: String(error), ...data };
    logger.error(errorData, message);
  },
  
  warn: (message: string, data?: Record<string, any>) => {
    logger.warn(data || {}, message);
  },
  
  debug: (message: string, data?: Record<string, any>) => {
    logger.debug(data || {}, message);
  },
};







