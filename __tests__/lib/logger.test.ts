import { logInfo, logError, logWarn, logDebug } from '@/lib/logger'

// Mock console methods
const originalConsole = global.console
const mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}

describe('Logger', () => {
  beforeEach(() => {
    global.console = mockConsole as any
    jest.clearAllMocks()
  })

  afterAll(() => {
    global.console = originalConsole
  })

  describe('logInfo', () => {
    it('should log info messages', () => {
      logInfo('Test info message', { userId: '123' })
      expect(mockConsole.log).toHaveBeenCalled()
    })

    it('should handle messages without context', () => {
      logInfo('Simple message')
      expect(mockConsole.log).toHaveBeenCalled()
    })
  })

  describe('logError', () => {
    it('should log error messages', () => {
      logError('Test error', new Error('Test error'))
      expect(mockConsole.error).toHaveBeenCalled()
    })

    it('should handle errors with context', () => {
      logError('Operation failed', { operation: 'test', userId: '123' })
      expect(mockConsole.error).toHaveBeenCalled()
    })
  })

  describe('logWarn', () => {
    it('should log warning messages', () => {
      logWarn('Test warning', { reason: 'test' })
      expect(mockConsole.warn).toHaveBeenCalled()
    })
  })

  describe('logDebug', () => {
    it('should log debug messages in development', () => {
      process.env.NODE_ENV = 'development'
      logDebug('Debug info', { data: 'test' })
      expect(mockConsole.debug || mockConsole.log).toHaveBeenCalled()
    })
  })

  describe('Error handling', () => {
    it('should handle circular references in context', () => {
      const circularObj: any = { a: 1 }
      circularObj.self = circularObj

      expect(() => {
        logInfo('Circular test', circularObj)
      }).not.toThrow()
    })

    it('should handle undefined and null values', () => {
      expect(() => {
        logInfo('Null test', { value: null })
        logInfo('Undefined test', { value: undefined })
      }).not.toThrow()
    })
  })
})

