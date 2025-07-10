export class RateLimiter {
    private requests: Map<string, number[]> = new Map();

    constructor(
        private maxRequests: number = 100,
        private windowMs: number = 60000 // 1 minute
    ) {}

    isAllowed(key: string): boolean {
        const now = Date.now();
        const requests = this.requests.get(key) || [];

        // Remove old requests outside the window
        const validRequests = requests.filter(time => now - time < this.windowMs);

        if (validRequests.length >= this.maxRequests) {
            return false;
        }

        // Add current request
        validRequests.push(now);
        this.requests.set(key, validRequests);

        return true;
    }

    getRemainingRequests(key: string): number {
        const requests = this.requests.get(key) || [];
        const now = Date.now();
        const validRequests = requests.filter(time => now - time < this.windowMs);
        return Math.max(0, this.maxRequests - validRequests.length);
    }
}