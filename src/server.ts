
import express from 'express';
import { EmailService } from './services/email-service';
import { MockEmailProvider } from './providers/mock-email-provider';
import { EmailMessage } from './types/email';

const app = express();
app.use(express.json());

// Initialize email service
const providers = [
    new MockEmailProvider('SendGrid', 0.1, 500),
    new MockEmailProvider('Mailgun', 0.15, 800)
];

const emailService = new EmailService(providers, 3, 1000, {
    maxRequests: 100,
    windowMs: 60000
});

// API Routes
app.post('/api/emails', async (req, res) => {
    try {
        const { to, from, subject, body, priority } = req.body;

        if (!to || !from || !subject || !body) {
            return res.status(400).json({
                error: 'Missing required fields: to, from, subject, body'
            });
        }

        const message: EmailMessage = {
            id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            to,
            from,
            subject,
            body,
            priority: priority || 'medium'
        };

        const attempt = await emailService.sendEmail(message);

        return res.status(202).json({
            message: 'Email queued for sending',
            attemptId: attempt.id,
            messageId: message.id,
            status: attempt.status
        });
    } catch (error) {
        return res.status(429).json({
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

app.get('/api/emails/:messageId/status', (req, res) => {
    const status = emailService.getEmailStatus(req.params.messageId);

    if (!status) {
        return res.status(404).json({ error: 'Email not found' });
    }

    return res.json(status);
});

app.get('/api/status', (req, res) => {
    res.json({
        providers: emailService.getProviderStatus(),
        queueSize: emailService.getQueueSize(),
        totalAttempts: emailService.getAllAttempts().length
    });
});

app.get('/api/logs', (req, res) => {
    res.json(emailService.getLogs());
});

app.get('/api/rate-limit/:key', (req, res) => {
    const rateLimitStatus = emailService.getRateLimitStatus(req.params.key);
    res.json(rateLimitStatus);
});

// ✅ Start server only if not in test environment
let server: ReturnType<typeof app.listen> | undefined;
if (process.env.NODE_ENV !== 'test') {
    const PORT = process.env.PORT || 3000;
    server = app.listen(PORT, () => {
        console.log(`Email service running on port ${PORT}`);
    });
}

export { app, emailService, server }; // ✅ export server for test cleanup
