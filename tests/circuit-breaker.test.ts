import { CircuitBreaker } from '../src/utils/circuit-breaker';

describe('CircuitBreaker', () => {
    let circuitBreaker: CircuitBreaker;

    beforeEach(() => {
        circuitBreaker = new CircuitBreaker(3, 1000); // 3 failures, 1 second timeout
    });

    it('should allow calls when closed', async () => {
        const mockFn = jest.fn().mockResolvedValue('success');
        const result = await circuitBreaker.call(mockFn);

        expect(result).toBe('success');
        expect(mockFn).toHaveBeenCalledTimes(1);
        expect(circuitBreaker.getState()).toBe('closed');
    });

    it('should open after threshold failures', async () => {
        const mockFn = jest.fn().mockRejectedValue(new Error('failure'));

        // Trigger failures to open circuit
        for (let i = 0; i < 3; i++) {
            try {
                await circuitBreaker.call(mockFn);
            } catch (error) {
                // Expected to fail
            }
        }

        expect(circuitBreaker.getState()).toBe('open');

        // Should reject without calling function
        await expect(circuitBreaker.call(mockFn)).rejects.toThrow('Circuit breaker is open');
    });

    it('should transition to half-open after timeout', async () => {
        const mockFn = jest.fn().mockRejectedValue(new Error('failure'));

        // Open the circuit
        for (let i = 0; i < 3; i++) {
            try {
                await circuitBreaker.call(mockFn);
            } catch (error) {
                // Expected to fail
            }
        }

        expect(circuitBreaker.getState()).toBe('open');

        // Wait for timeout (using a shorter timeout for testing)
        const shortTimeoutBreaker = new CircuitBreaker(3, 50);
        const shortMockFn = jest.fn().mockRejectedValue(new Error('failure'));

        // Open the short timeout circuit
        for (let i = 0; i < 3; i++) {
            try {
                await shortTimeoutBreaker.call(shortMockFn);
            } catch (error) {
                // Expected to fail
            }
        }

        await new Promise(resolve => setTimeout(resolve, 100));

        // Should transition to half-open on next call
        const successFn = jest.fn().mockResolvedValue('success');
        const result = await shortTimeoutBreaker.call(successFn);

        expect(result).toBe('success');
        expect(shortTimeoutBreaker.getState()).toBe('closed');
    });
});