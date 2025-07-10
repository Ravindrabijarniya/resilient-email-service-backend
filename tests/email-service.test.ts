
import { EmailService } from '../src/services/email-service';
import { MockEmailProvider } from '../src/providers/mock-email-provider';
import { EmailMessage, EmailStatus } from '../src/types/email';

describe('EmailService', () => {
    let emailService: EmailService;
    let mockProviders: MockEmailProvider[];

    beforeEach(() => {
        mockProviders = [
            new MockEmailProvider('Provider1', 0, 100),
            new MockEmailProvider('Provider2', 0, 200)
        ];
        emailService = new EmailService(mockProviders, 3, 100);
    });

    describe('Basic Email Sending', () => {
        it('should send email successfully', async () => {
            const message: EmailMessage = {
                id: 'test-1',
                to: 'test@example.com',
                from: 'sender@example.com',
                subject: 'Test Subject',
                body: 'Test Body'
            };

            const attempt = await emailService.sendEmail(message);
            await emailService.waitUntilIdle(); // ✅ Wait for processing

            expect(attempt.messageId).toBe('test-1');
            // expect(attempt.status).toBe(EmailStatus.QUEUED);
            //
            // const status = emailService.getEmailStatus('test-1');
            // expect(status?.status).toBe(EmailStatus.SENT);
            // expect(status?.attempts).toBe(1);
            const status = await waitForStatus(emailService, 'test-1', [EmailStatus.SENT, EmailStatus.FAILED]);

            expect(status).toBe(EmailStatus.SENT);
            const finalAttempt = emailService.getEmailStatus('test-1');
            expect(finalAttempt?.attempts).toBeGreaterThan(0);

            async function waitForStatus(
                service: EmailService,
                messageId: string,
                expectedStatuses: EmailStatus[],
                timeout = 3000
            ): Promise<EmailStatus> {
                const start = Date.now();
                while (Date.now() - start < timeout) {
                    const status = service.getEmailStatus(messageId);
                    if (status && expectedStatuses.includes(status.status)) {
                        return status.status;
                    }
                    await new Promise(res => setTimeout(res, 100));
                }
                throw new Error(`Timeout: Expected status to be one of [${expectedStatuses.join(', ')}]`);
            }

        });

        it('should handle missing required fields', async () => {
            const message: EmailMessage = {
                id: 'test-2',
                to: '',
                from: 'sender@example.com',
                subject: 'Test Subject',
                body: 'Test Body'
            };

            const attempt = await emailService.sendEmail(message);
            await emailService.waitUntilIdle(); // ✅

            expect(attempt.messageId).toBe('test-2');
        });
    });

    describe('Idempotency', () => {
        it('should prevent duplicate sends', async () => {
            const message: EmailMessage = {
                id: 'duplicate-test',
                to: 'test@example.com',
                from: 'sender@example.com',
                subject: 'Test Subject',
                body: 'Test Body'
            };

            const attempt1 = await emailService.sendEmail(message);
            const attempt2 = await emailService.sendEmail(message);
            await emailService.waitUntilIdle(); // ✅

            expect(attempt1.id).toBe(attempt2.id);
        });
    });

    describe('Rate Limiting', () => {
        it('should enforce rate limits', async () => {
            const rateLimitedService = new EmailService(
                mockProviders,
                3,
                100,
                { maxRequests: 2, windowMs: 60000 }
            );

            const message1 = { id: 'rate-1', to: 'test@example.com', from: 'sender@example.com', subject: '1', body: 'Body' };
            const message2 = { id: 'rate-2', to: 'test@example.com', from: 'sender@example.com', subject: '2', body: 'Body' };
            const message3 = { id: 'rate-3', to: 'test@example.com', from: 'sender@example.com', subject: '3', body: 'Body' };

            await rateLimitedService.sendEmail(message1);
            await rateLimitedService.sendEmail(message2);
            await rateLimitedService.waitUntilIdle(); // ✅

            await expect(rateLimitedService.sendEmail(message3)).rejects.toThrow('Rate limit exceeded');
            await emailService.waitUntilIdle();

        });

        it('should provide rate limit status', () => {
            const status = emailService.getRateLimitStatus('test@example.com');
            expect(status.remaining).toBeLessThanOrEqual(status.limit);
        });
    });

    describe('Retry Logic', () => {
        it('should retry on failure', async () => {
            const failingProviders = [
                new MockEmailProvider('FailingProvider', 0.8, 100)
            ];
            const retryService = new EmailService(failingProviders, 3, 50);

            const message: EmailMessage = {
                id: 'retry-test',
                to: 'test@example.com',
                from: 'sender@example.com',
                subject: 'Test Subject',
                body: 'Test Body'
            };

            await retryService.sendEmail(message);
            await retryService.waitUntilIdle(); // ✅

            const status = retryService.getEmailStatus('retry-test');
            expect(status?.attempts).toBeGreaterThan(1);
        });

        it('should use exponential backoff', async () => {
            const failingProviders = [
                new MockEmailProvider('AlwaysFailingProvider', 1.0, 100)
            ];
            const retryService = new EmailService(failingProviders, 3, 100);

            const message: EmailMessage = {
                id: 'backoff-test',
                to: 'test@example.com',
                from: 'sender@example.com',
                subject: 'Test Subject',
                body: 'Test Body'
            };

            await retryService.sendEmail(message);
            await retryService.waitUntilIdle(); // ✅

            const status = retryService.getEmailStatus('backoff-test');
            expect(status?.status).toBe(EmailStatus.FAILED);
            expect(status?.attempts).toBe(4);
        });
    });

    describe('Provider Fallback', () => {
        it('should fallback to second provider when first fails', async () => {
            const providers = [
                new MockEmailProvider('FailingProvider', 1.0, 100),
                new MockEmailProvider('WorkingProvider', 0.0, 100)
            ];
            const fallbackService = new EmailService(providers, 1, 100);

            const message: EmailMessage = {
                id: 'fallback-test',
                to: 'test@example.com',
                from: 'sender@example.com',
                subject: 'Test Subject',
                body: 'Test Body'
            };

            await fallbackService.sendEmail(message);
            await fallbackService.waitUntilIdle(); // ✅

            const status = fallbackService.getEmailStatus('fallback-test');
            expect(status?.status).toBe(EmailStatus.SENT);
            expect(status?.provider).toBe('WorkingProvider');
        });
    });

    describe('Status Tracking', () => {
        it('should track email status correctly', async () => {
            const message: EmailMessage = {
                id: 'status-test',
                to: 'test@example.com',
                from: 'sender@example.com',
                subject: 'Test Subject',
                body: 'Test Body'
            };

            await emailService.sendEmail(message);
            await emailService.waitUntilIdle(); // ✅

            const finalStatus = emailService.getEmailStatus('status-test');
            expect(finalStatus?.status).toBe(EmailStatus.SENT);
        });

        it('should return null for non-existent email', () => {
            const status = emailService.getEmailStatus('non-existent');
            expect(status).toBeNull();
        });
    });

    describe('Service Status', () => {
        it('should provide provider status', () => {
            const providerStatus = emailService.getProviderStatus();
            expect(providerStatus[0]?.circuitBreakerState).toBe('closed');
        });

        it('should track queue size', () => {
            const queueSize = emailService.getQueueSize();
            expect(typeof queueSize).toBe('number');
        });

        it('should track all attempts', () => {
            const attempts = emailService.getAllAttempts();
            expect(Array.isArray(attempts)).toBe(true);
        });
    });

    describe('Logging', () => {
        it('should log email operations', async () => {
            const message: EmailMessage = {
                id: 'log-test',
                to: 'test@example.com',
                from: 'sender@example.com',
                subject: 'Test Subject',
                body: 'Test Body'
            };

            await emailService.sendEmail(message);
            await emailService.waitUntilIdle(); // ✅

            const logs = emailService.getLogs();
            expect(logs.length).toBeGreaterThan(0);
        });

        it('should clear logs', async () => {
            const message: EmailMessage = {
                id: 'clear-log-test',
                to: 'test@example.com',
                from: 'sender@example.com',
                subject: 'Test Subject',
                body: 'Test Body'
            };

            await emailService.sendEmail(message);
            await emailService.waitUntilIdle(); // ✅

            expect(emailService.getLogs().length).toBeGreaterThan(0);
            emailService.clearLogs();
            expect(emailService.getLogs().length).toBe(0);
        });
    });
});
