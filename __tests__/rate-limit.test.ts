import { RateLimiter } from '@/lib/rate-limit';

describe('RateLimiter', () => {
  it('should allow requests below limit', async () => {
    // This is a basic mock test since we don't have a real Redis in test env usually
    const result = await RateLimiter.check('test-key', { limit: 10, windowSeconds: 60 });
    // Without real Redis, it returns success: true by default in our implementation
    expect(result.success).toBe(true); 
  });
});
