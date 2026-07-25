import {
  average,
  cn,
  formatBytes,
  round,
  slugify,
  truncate,
} from '@/lib/utils'

describe('utils', () => {
  describe('cn', () => {
    it('merges class names and resolves Tailwind conflicts', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4')
      expect(cn('text-sm', false && 'hidden', 'font-bold')).toBe('text-sm font-bold')
    })
  })

  describe('average', () => {
    it('returns 0 for empty array', () => {
      expect(average([])).toBe(0)
    })

    it('computes arithmetic mean', () => {
      expect(average([10, 20, 30])).toBe(20)
    })
  })

  describe('round', () => {
    it('rounds to default 2 decimals', () => {
      expect(round(1.2345)).toBe(1.23)
    })

    it('respects custom decimals', () => {
      expect(round(1.236, 2)).toBe(1.24)
      expect(round(10.5, 0)).toBe(11)
    })
  })

  describe('slugify', () => {
    it('normalizes whitespace and strips invalid chars', () => {
      expect(slugify('  Hello World!  ')).toBe('hello-world')
    })
  })

  describe('truncate', () => {
    it('returns original when short enough', () => {
      expect(truncate('سلام', 10)).toBe('سلام')
    })

    it('appends ellipsis when truncated', () => {
      expect(truncate('abcdefghijklmnopqrstuvwxyz', 5)).toBe('abcde...')
    })
  })

  describe('formatBytes', () => {
    it('formats zero and kilobytes in Persian units', () => {
      expect(formatBytes(0)).toBe('0 بایت')
      expect(formatBytes(1024, 0)).toBe('1 کیلوبایت')
    })
  })
})
