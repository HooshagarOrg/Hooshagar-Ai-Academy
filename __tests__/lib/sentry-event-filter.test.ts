import {
  isHeadlessBrowserName,
  shouldDropClientSentryEvent,
  userAgentLooksHeadless,
} from '@/lib/monitoring/sentry-event-filter'

describe('sentry-event-filter', () => {
  describe('isHeadlessBrowserName', () => {
    it('drops HeadlessChrome', () => {
      expect(isHeadlessBrowserName('HeadlessChrome')).toBe(true)
      expect(isHeadlessBrowserName('HeadlessChrome 141.0.7390')).toBe(true)
    })

    it('keeps real browsers', () => {
      expect(isHeadlessBrowserName('Chrome')).toBe(false)
      expect(isHeadlessBrowserName('Safari')).toBe(false)
      expect(isHeadlessBrowserName(undefined)).toBe(false)
    })
  })

  describe('userAgentLooksHeadless', () => {
    it('detects HeadlessChrome in UA', () => {
      expect(
        userAgentLooksHeadless(
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 HeadlessChrome/141.0.7390.0 Safari/537.36',
        ),
      ).toBe(true)
    })

    it('ignores normal Chrome', () => {
      expect(
        userAgentLooksHeadless(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
        ),
      ).toBe(false)
    })
  })

  describe('shouldDropClientSentryEvent', () => {
    it('drops events tagged HeadlessChrome', () => {
      expect(
        shouldDropClientSentryEvent({
          contexts: { browser: { name: 'HeadlessChrome' } },
        }),
      ).toBe(true)
      expect(
        shouldDropClientSentryEvent({
          tags: { browser: 'HeadlessChrome 141.0.7390', 'browser.name': 'HeadlessChrome' },
        }),
      ).toBe(true)
    })

    it('drops events with HeadlessChrome user-agent', () => {
      expect(
        shouldDropClientSentryEvent({
          request: {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/141.0.7390.0 Safari/537.36',
            },
          },
        }),
      ).toBe(true)
    })

    it('keeps real user events', () => {
      expect(
        shouldDropClientSentryEvent({
          contexts: { browser: { name: 'Chrome' } },
          request: {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/141.0.0.0 Safari/537.36',
            },
          },
        }),
      ).toBe(false)
    })
  })
})
