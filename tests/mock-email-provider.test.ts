import { MockEmailProvider } from '../src/providers/mock-email-provider';
import { EmailMessage } from '../src/types/email';

describe('MockEmailProvider', () => {
    it('should send email successfully with no failures', async () => {
        const provider = new MockEmailProvider('TestProvider', 0, 100);
        const message: EmailMessage = {
            id: 'test-1',
            to: 'test@example.com',
            from: 'sender@example.com',
            subject: 'Test Subject',
            body: 'Test Body'
        };

        const result = await provider.send(message);

        expect(result.success).toBe(true);
        expect(result.provider).toBe('TestProvider');
        expect(result.messageId).toBeTruthy();
        expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should simulate failures based on failure rate', async () => {
        const provider = new MockEmailProvider('FailingProvider', 1.0, 50); // 100% failure rate
        const message: EmailMessage = {
            id: 'test-2',
            to: 'test@example.com',
            from: 'sender@example.com',
            subject: 'Test Subject',
            body: 'Test Body'
        };

        await expect(provider.send(message)).rejects.toThrow('FailingProvider provider failed to send email');
    });

    it('should simulate latency', async () => {
        const provider = new MockEmailProvider('SlowProvider', 0, 200);
        const message: EmailMessage = {
            id: 'test-3',
            to: 'test@example.com',
            from: 'sender@example.com',
            subject: 'Test Subject',
            body: 'Test Body'
        };

        const startTime = Date.now();
        await provider.send(message);
        const endTime = Date.now();

        expect(endTime - startTime).toBeGreaterThanOrEqual(190);
    });
});