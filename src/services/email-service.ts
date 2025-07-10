// import {EmailAttempt, EmailMessage, EmailProvider, EmailResult, EmailStatus} from "@/types/email";
// import {RateLimiter} from "@/utils/rate-limiter";
// import {Logger} from "@/utils/logger";
// import {CircuitBreaker} from "@/utils/circuit-breaker";
//
// export class EmailService {
//     private providers: EmailProvider[] = [];
//     private attempts: Map<string, EmailAttempt> = new Map();
//     private circuitBreakers: Map<string, CircuitBreaker> = new Map();
//     private rateLimiter: RateLimiter;
//     private logger: Logger;
//     private queue: EmailMessage[] = [];
//     private processing = false;
//
//     constructor(
//         providers: EmailProvider[],
//         private maxRetries: number = 3,
//         private baseDelay: number = 1000,
//         rateLimitConfig?: { maxRequests: number; windowMs: number }
//     ) {
//         this.providers = providers;
//         this.rateLimiter = new RateLimiter(
//             rateLimitConfig?.maxRequests || 100,
//             rateLimitConfig?.windowMs || 60000
//         );
//         this.logger = new Logger();
//
//         // Initialize circuit breakers for each provider
//         providers.forEach(provider => {
//             this.circuitBreakers.set(provider.name, new CircuitBreaker());
//         });
//     }
//
//     async sendEmail(message: EmailMessage): Promise<EmailAttempt> {
//         // Check for idempotency
//         const existingAttempt = this.attempts.get(message.id);
//         if (existingAttempt) {
//             this.logger.info(`Duplicate email send attempt blocked`, { messageId: message.id });
//             return existingAttempt;
//         }
//
//         // Check rate limit
//         if (!this.rateLimiter.isAllowed(message.from)) {
//             const error = 'Rate limit exceeded';
//             this.logger.warn(error, { from: message.from });
//             throw new Error(error);
//         }
//
//         // Create attempt record
//         const attempt: EmailAttempt = {
//             id: `attempt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
//             messageId: message.id,
//             status: EmailStatus.QUEUED,
//             attempts: 0,
//             createdAt: new Date(),
//             updatedAt: new Date()
//         };
//
//         this.attempts.set(message.id, attempt);
//         this.logger.info('Email queued for sending', { messageId: message.id });
//
//         // Add to queue and process
//         this.queue.push(message);
//         this.processQueue();
//
//         return attempt;
//     }
//
//     private async processQueue(): Promise<void> {
//         if (this.processing || this.queue.length === 0) {
//             return;
//         }
//
//         this.processing = true;
//
//         try {
//             while (this.queue.length > 0) {
//                 const message = this.queue.shift()!;
//                 await this.processMessage(message);
//             }
//         } finally {
//             this.processing = false;
//         }
//     }
//
//     private async processMessage(message: EmailMessage): Promise<void> {
//         const attempt = this.attempts.get(message.id);
//         if (!attempt) {
//             this.logger.error('Attempt not found for message', { messageId: message.id });
//             return;
//         }
//
//         attempt.status = EmailStatus.SENDING;
//         attempt.updatedAt = new Date();
//
//         try {
//             const result = await this.sendWithRetry(message);
//
//             attempt.status = EmailStatus.SENT;
//             attempt.provider = result.provider;
//             attempt.updatedAt = new Date();
//
//             this.logger.info('Email sent successfully', {
//                 messageId: message.id,
//                 provider: result.provider,
//                 attempts: attempt.attempts
//             });
//         } catch (error) {
//             attempt.status = EmailStatus.FAILED;
//             attempt.lastError = error instanceof Error ? error.message : 'Unknown error';
//             attempt.updatedAt = new Date();
//
//             this.logger.error('Email failed to send', {
//                 messageId: message.id,
//                 error: attempt.lastError,
//                 attempts: attempt.attempts
//             });
//         }
//     }
//
//     private async sendWithRetry(message: EmailMessage): Promise<EmailResult> {
//         const attempt = this.attempts.get(message.id)!;
//         let lastError: Error | null = null;
//
//         for (let retryCount = 0; retryCount <= this.maxRetries; retryCount++) {
//             attempt.attempts = retryCount + 1;
//             attempt.updatedAt = new Date();
//
//             if (retryCount > 0) {
//                 attempt.status = EmailStatus.RETRYING;
//                 const delay = this.calculateDelay(retryCount);
//                 this.logger.info(`Retrying email send (attempt ${retryCount + 1})`, {
//                     messageId: message.id,
//                     delay
//                 });
//                 await new Promise(resolve => setTimeout(resolve, delay));
//             }
//
//             // Try each provider
//             for (const provider of this.providers) {
//                 try {
//                     const circuitBreaker = this.circuitBreakers.get(provider.name)!;
//
//                     const result = await circuitBreaker.call(async () => {
//                         return await provider.send(message);
//                     });
//
//                     this.logger.info('Email sent via provider', {
//                         messageId: message.id,
//                         provider: provider.name,
//                         attempt: retryCount + 1
//                     });
//
//                     return result;
//                 } catch (error) {
//                     lastError = error instanceof Error ? error : new Error('Unknown error');
//
//                     this.logger.warn('Provider failed', {
//                         messageId: message.id,
//                         provider: provider.name,
//                         error: lastError.message,
//                         circuitBreakerState: this.circuitBreakers.get(provider.name)?.getState()
//                     });
//                 }
//             }
//         }
//
//         throw lastError || new Error('All providers failed');
//     }
//
//     private calculateDelay(retryCount: number): number {
//         // Exponential backoff with jitter
//         const exponentialDelay = this.baseDelay * Math.pow(2, retryCount - 1);
//         const jitter = Math.random() * 0.1 * exponentialDelay;
//         return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
//     }
//
//     // Public API methods
//     getEmailStatus(messageId: string): EmailAttempt | null {
//         return this.attempts.get(messageId) || null;
//     }
//
//     getProviderStatus(): Array<{ name: string; circuitBreakerState: string }> {
//         return this.providers.map(provider => ({
//             name: provider.name,
//             circuitBreakerState: this.circuitBreakers.get(provider.name)?.getState() || 'unknown'
//         }));
//     }
//
//     getRateLimitStatus(key: string): { remaining: number; limit: number } {
//         return {
//             remaining: this.rateLimiter.getRemainingRequests(key),
//             limit: 100 // This should come from config
//         };
//     }
//
//     getLogs(): ReturnType<Logger['getLogs']> {
//         return this.logger.getLogs();
//     }
//
//     clearLogs(): void {
//         this.logger.clearLogs();
//     }
//
//     getQueueSize(): number {
//         return this.queue.length;
//     }
//
//     getAllAttempts(): EmailAttempt[] {
//         return Array.from(this.attempts.values());
//     }
//     public async waitUntilIdle(): Promise<void> {
//         while (this.processing || this.queue.length > 0) {
//             await new Promise(resolve => setTimeout(resolve, 50));
//         }
//     }
//
//
// }

import { EmailAttempt, EmailMessage, EmailProvider, EmailResult, EmailStatus } from "@/types/email";
import { RateLimiter } from "@/utils/rate-limiter";
import { Logger } from "@/utils/logger";
import { CircuitBreaker } from "@/utils/circuit-breaker";

export class EmailService {
    private providers: EmailProvider[] = [];
    private attempts: Map<string, EmailAttempt> = new Map();
    private circuitBreakers: Map<string, CircuitBreaker> = new Map();
    private rateLimiter: RateLimiter;
    private logger: Logger;
    private queue: EmailMessage[] = [];
    private processing = false;

    constructor(
        providers: EmailProvider[],
        private maxRetries: number = 3,
        private baseDelay: number = 1000,
        rateLimitConfig?: { maxRequests: number; windowMs: number }
    ) {
        this.providers = providers;
        this.rateLimiter = new RateLimiter(
            rateLimitConfig?.maxRequests || 100,
            rateLimitConfig?.windowMs || 60000
        );
        this.logger = new Logger();

        providers.forEach(provider => {
            this.circuitBreakers.set(provider.name, new CircuitBreaker());
        });
    }

    async sendEmail(message: EmailMessage): Promise<EmailAttempt> {
        const existingAttempt = this.attempts.get(message.id);
        if (existingAttempt) {
            this.logger.info(`Duplicate email send attempt blocked`, { messageId: message.id });
            return existingAttempt;
        }

        if (!this.rateLimiter.isAllowed(message.from)) {
            const error = 'Rate limit exceeded';
            this.logger.warn(error, { from: message.from });
            throw new Error(error);
        }

        const attempt: EmailAttempt = {
            id: `attempt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            messageId: message.id,
            status: EmailStatus.QUEUED,
            attempts: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.attempts.set(message.id, attempt);
        this.logger.info('Email queued for sending', { messageId: message.id });

        this.queue.push(message);
        this.processQueue();

        return attempt;
    }

    private async processQueue(): Promise<void> {
        if (this.processing || this.queue.length === 0) return;

        this.processing = true;

        try {
            while (this.queue.length > 0) {
                const message = this.queue.shift()!;
                await this.processMessage(message);
            }
        } finally {
            this.processing = false;
        }
    }

    private async processMessage(message: EmailMessage): Promise<void> {
        const attempt = this.attempts.get(message.id);
        if (!attempt) {
            this.logger.error('Attempt not found for message', { messageId: message.id });
            return;
        }

        attempt.status = EmailStatus.SENDING;
        attempt.updatedAt = new Date();

        try {
            const result = await this.sendWithRetry(message);

            attempt.status = EmailStatus.SENT;
            attempt.provider = result.provider;
            attempt.updatedAt = new Date();

            this.logger.info('Email sent successfully', {
                messageId: message.id,
                provider: result.provider,
                attempts: attempt.attempts
            });
        } catch (error) {
            attempt.status = EmailStatus.FAILED;
            attempt.lastError = error instanceof Error ? error.message : 'Unknown error';
            attempt.updatedAt = new Date();

            this.logger.error('Email failed to send', {
                messageId: message.id,
                error: attempt.lastError,
                attempts: attempt.attempts
            });
        }
    }

    private async sendWithRetry(message: EmailMessage): Promise<EmailResult> {
        const attempt = this.attempts.get(message.id)!;
        let lastError: Error | null = null;

        for (let retryCount = 0; retryCount <= this.maxRetries; retryCount++) {
            attempt.attempts = retryCount + 1;
            attempt.updatedAt = new Date();

            if (retryCount > 0) {
                attempt.status = EmailStatus.RETRYING;
                const delay = this.calculateDelay(retryCount);
                this.logger.info(`Retrying email send (attempt ${retryCount + 1})`, {
                    messageId: message.id,
                    delay
                });
                await new Promise(resolve => setTimeout(resolve, delay));
            }

            for (const provider of this.providers) {
                try {
                    const circuitBreaker = this.circuitBreakers.get(provider.name)!;

                    const result = await circuitBreaker.call(() => provider.send(message));

                    this.logger.info('Email sent via provider', {
                        messageId: message.id,
                        provider: provider.name,
                        attempt: retryCount + 1
                    });

                    return result;
                } catch (error) {
                    lastError = error instanceof Error ? error : new Error('Unknown error');

                    this.logger.warn('Provider failed', {
                        messageId: message.id,
                        provider: provider.name,
                        error: lastError.message,
                        circuitBreakerState: this.circuitBreakers.get(provider.name)?.getState()
                    });
                }
            }
        }

        throw lastError || new Error('All providers failed');
    }

    private calculateDelay(retryCount: number): number {
        const exponentialDelay = this.baseDelay * Math.pow(2, retryCount - 1);
        const jitter = Math.random() * 0.1 * exponentialDelay;
        return Math.min(exponentialDelay + jitter, 30000);
    }

    getEmailStatus(messageId: string): EmailAttempt | null {
        return this.attempts.get(messageId) || null;
    }

    getProviderStatus(): Array<{ name: string; circuitBreakerState: string }> {
        return this.providers.map(provider => ({
            name: provider.name,
            circuitBreakerState: this.circuitBreakers.get(provider.name)?.getState() || 'unknown'
        }));
    }

    getRateLimitStatus(key: string): { remaining: number; limit: number } {
        return {
            remaining: this.rateLimiter.getRemainingRequests(key),
            limit: 100
        };
    }

    getLogs(): ReturnType<Logger['getLogs']> {
        return this.logger.getLogs();
    }

    clearLogs(): void {
        this.logger.clearLogs();
    }

    getQueueSize(): number {
        return this.queue.length;
    }

    getAllAttempts(): EmailAttempt[] {
        return Array.from(this.attempts.values());
    }

    /**
     * 🕒 Wait until all queued emails are processed
     * Used in tests to avoid async log error: "Cannot log after tests are done"
     */
    public async waitUntilIdle(): Promise<void> {
        while (this.processing || this.queue.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }
}
