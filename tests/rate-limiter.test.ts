import { RateLimiter } from '../src/utils/rate-limiter';

describe('RateLimiter', () => {
    let rateLimiter: RateLimiter;

    beforeEach(() => {
        rateLimiter = new RateLimiter(3, 1000); // 3 requests per second
    });

    it('should allow requests within limit', () => {
        expect(rateLimiter.isAllowed('user1')).toBe(true);
        expect(rateLimiter.isAllowed('user1')).toBe(true);
        expect(rateLimiter.isAllowed('user1')).toBe(true);
    });

    it('should reject requests over limit', () => {
        rateLimiter.isAllowed('user1');
        rateLimiter.isAllowed('user1');
        rateLimiter.isAllowed('user1');

        expect(rateLimiter.isAllowed('user1')).toBe(false);
    });

    it('should track different users separately', () => {
        rateLimiter.isAllowed('user1');
        rateLimiter.isAllowed('user1');
        rateLimiter.isAllowed('user1');

        expect(rateLimiter.isAllowed('user1')).toBe(false);
        expect(rateLimiter.isAllowed('user2')).toBe(true);
    });

    it('should return correct remaining requests', () => {
        expect(rateLimiter.getRemainingRequests('user1')).toBe(3);

        rateLimiter.isAllowed('user1');
        expect(rateLimiter.getRemainingRequests('user1')).toBe(2);

        rateLimiter.isAllowed('user1');
        rateLimiter.isAllowed('user1');
        expect(rateLimiter.getRemainingRequests('user1')).toBe(0);
    });

    it('should reset after time window', async () => {
        const shortWindowLimiter = new RateLimiter(2, 100); // 2 requests per 100ms

        shortWindowLimiter.isAllowed('user1');
        shortWindowLimiter.isAllowed('user1');
        expect(shortWindowLimiter.isAllowed('user1')).toBe(false);

        await new Promise(resolve => setTimeout(resolve, 150));

        expect(shortWindowLimiter.isAllowed('user1')).toBe(true);
    });
});