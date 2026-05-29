/**
 * Logger — supports both `logger.info('msg', data)` and `logger.info(data, 'msg')` (Pino style).
 */

import pino from 'pino'

const isDev = process.env.NODE_ENV !== 'production'

type LogData = Record<string, unknown>

const productionPino = pino({
  level: 'info',
  browser: { asObject: true },
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
    censor: '***REDACTED***',
  },
})

function write(level: 'info' | 'error' | 'warn' | 'debug', payload: LogData, message: string) {
  if (isDev) {
    const fn =
      level === 'info'
        ? console.log
        : level === 'error'
          ? console.error
          : level === 'warn'
            ? console.warn
            : console.debug
    fn(`[${level}] ${message}`, payload)
    return
  }
  productionPino[level](payload, message)
}

function normalizeArgs(
  a: string | LogData,
  b?: string | LogData
): { message: string; data: LogData } {
  if (typeof a === 'string') {
    return { message: a, data: (typeof b === 'object' && b !== null ? b : {}) as LogData }
  }
  return {
    message: typeof b === 'string' ? b : 'log',
    data: a,
  }
}

function makeLevel(level: 'info' | 'error' | 'warn' | 'debug') {
  return (a: string | LogData, b?: string | LogData) => {
    const { message, data } = normalizeArgs(a, b)
    write(level, data, message)
  }
}

export const logger = {
  info: makeLevel('info'),
  error: makeLevel('error'),
  warn: makeLevel('warn'),
  debug: makeLevel('debug'),
}

export default logger

export const log = {
  info: (message: string, data?: LogData) => logger.info(message, data),
  error: (message: string, error?: Error | unknown, data?: LogData) => {
    const errorData =
      error instanceof Error
        ? { error: error.message, stack: error.stack, ...data }
        : { error: String(error), ...data }
    logger.error(message, errorData)
  },
  warn: (message: string, data?: LogData) => logger.warn(message, data),
  debug: (message: string, data?: LogData) => logger.debug(message, data),
}

export const logInfo = log.info
export const logError = log.error
export const logWarn = log.warn
export const logDebug = log.debug
