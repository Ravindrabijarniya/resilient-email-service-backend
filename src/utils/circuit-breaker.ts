export class CircuitBreaker {
    private failures = 0;
    private lastFailureTime: Date | null = null;
    private state: 'closed' | 'open' | 'half-open' = 'closed';

    constructor(
        private threshold: number = 5,
        private timeout: number = 60000 // 1 minute
    ) {}

    async call<T>(fn: () => Promise<T>): Promise<T> {
        if (this.state === 'open') {
            if (this.shouldAttemptReset()) {
                this.state = 'half-open';
            } else {
                throw new Error('Circuit breaker is open');
            }
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    // private shouldAttemptReset(): boolean {
    //     return this.lastFailureTime &&
    //         Date.now() - this.lastFailureTime.getTime() > this.timeout;
    // }

    private shouldAttemptReset(): boolean {
        if (!this.lastFailureTime) {
            return false;
        }
        return Date.now() - this.lastFailureTime.getTime() > this.timeout;
    }

    private onSuccess(): void {
        this.failures = 0;
        this.state = 'closed';
    }

    private onFailure(): void {
        this.failures++;
        this.lastFailureTime = new Date();

        if (this.failures >= this.threshold) {
            this.state = 'open';
        }
    }

    getState(): string {
        return this.state;
    }
}
