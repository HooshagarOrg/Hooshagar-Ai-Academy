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

// در Development از console استفاده کن (Pino worker thread با Next.js مشکل دارد)
const isDev = process.env.NODE_ENV !== 'production';

// Logger برای Production با Secret Redaction
const logger = isDev ? null : pino({
  level: 'info',
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
  }
});

export default logger;

/**
 * Helper functions برای استفاده راحت‌تر
 */
export const log = {
  info: (message: string, data?: Record<string, any>) => {
    if (isDev) {
      console.log(`ℹ️ ${message}`, data || '');
    } else {
      logger?.info(data || {}, message);
    }
  },
  
  error: (message: string, error?: Error | unknown, data?: Record<string, any>) => {
    const errorData = error instanceof Error 
      ? { error: error.message, stack: error.stack, ...data }
      : { error: String(error), ...data };
    
    if (isDev) {
      console.error(`❌ ${message}`, errorData);
    } else {
      logger?.error(errorData, message);
    }
  },
  
  warn: (message: string, data?: Record<string, any>) => {
    if (isDev) {
      console.warn(`⚠️ ${message}`, data || '');
    } else {
      logger?.warn(data || {}, message);
    }
  },
  
  debug: (message: string, data?: Record<string, any>) => {
    if (isDev) {
      console.debug(`🔍 ${message}`, data || '');
    } else {
      logger?.debug(data || {}, message);
    }
  },
};

// Export های مستقیم برای راحتی استفاده
export const logInfo = (message: string, data?: Record<string, any>) => {
  if (isDev) {
    console.log(`ℹ️ ${message}`, data || '');
  } else {
    logger?.info(data || {}, message);
  }
};

export const logError = (message: string, error?: Error | unknown, data?: Record<string, any>) => {
  const errorData = error instanceof Error 
    ? { error: error.message, stack: error.stack, ...data }
    : { error: String(error), ...data };
  
  if (isDev) {
    console.error(`❌ ${message}`, errorData);
  } else {
    logger?.error(errorData, message);
  }
};

export const logWarn = (message: string, data?: Record<string, any>) => {
  if (isDev) {
    console.warn(`⚠️ ${message}`, data || '');
  } else {
    logger?.warn(data || {}, message);
  }
};

export const logDebug = (message: string, data?: Record<string, any>) => {
  if (isDev) {
    console.debug(`🔍 ${message}`, data || '');
  } else {
    logger?.debug(data || {}, message);
  }
};




























