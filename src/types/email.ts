export interface EmailMessage {
    id: string;
    to: string;
    from: string;
    subject: string;
    body: string;
    priority?: 'low' | 'medium' | 'high';
}

export interface EmailProvider {
    name: string;
    send(message: EmailMessage): Promise<EmailResult>;
}

export interface EmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
    provider: string;
    timestamp: Date;
}

export enum EmailStatus {
    QUEUED = 'queued',
    SENDING = 'sending',
    SENT = 'sent',
    FAILED = 'failed',
    RETRYING = 'retrying'
}

export interface EmailAttempt {
    id: string;
    messageId: string;
    status: EmailStatus;
    attempts: number;
    lastError?: string;
    provider?: string;
    createdAt: Date;
    updatedAt: Date;
}