/**
 * تست Rate Limiting per User
 */

import { RATE_LIMITS } from '@/lib/rate-limit-user';

describe('User Rate Limits', () => {
  it('should have rate limits defined for all features', () => {
    expect(RATE_LIMITS).toHaveProperty('ocr');
    expect(RATE_LIMITS).toHaveProperty('story');
    expect(RATE_LIMITS).toHaveProperty('analyzer');
    expect(RATE_LIMITS).toHaveProperty('study');
    expect(RATE_LIMITS).toHaveProperty('ai_universal');
  });
  
  it('should have valid rate limit values', () => {
    Object.entries(RATE_LIMITS).forEach(([feature, config]) => {
      expect(config.maxRequests).toBeGreaterThan(0);
      expect(config.windowMs).toBeGreaterThan(0);
    });
  });
  
  it('OCR should have reasonable rate limit', () => {
    expect(RATE_LIMITS.ocr.maxRequests).toBe(20);
    expect(RATE_LIMITS.ocr.windowMs).toBe(60 * 60 * 1000); // 1 hour
  });
});

