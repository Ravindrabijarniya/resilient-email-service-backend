import {EmailMessage, EmailProvider, EmailResult} from "../types/email";

export class MockEmailProvider implements EmailProvider {
    constructor(
        public name: string,
        private failureRate: number = 0.2,
        private latency: number = 1000
    ) {}

    async send(message: EmailMessage): Promise<EmailResult> {
        // Simulate network latency
        await new Promise(resolve => setTimeout(resolve, this.latency));

        // Simulate random failures
        if (Math.random() < this.failureRate) {
            throw new Error(`${this.name} provider failed to send email`);
        }

        return {
            success: true,
            messageId: `${this.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            provider: this.name,
            timestamp: new Date()
        };
    }
}