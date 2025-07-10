export class Logger {
    private logs: Array<{
        level: 'info' | 'warn' | 'error';
        message: string;
        timestamp: Date;
        metadata?: any;
    }> = [];

    info(message: string, metadata?: any): void {
        this.log('info', message, metadata);
    }

    warn(message: string, metadata?: any): void {
        this.log('warn', message, metadata);
    }

    error(message: string, metadata?: any): void {
        this.log('error', message, metadata);
    }

    private log(level: 'info' | 'warn' | 'error', message: string, metadata?: any): void {
        const logEntry = {
            level,
            message,
            timestamp: new Date(),
            metadata
        };

        this.logs.push(logEntry);

        // Console output for development
        if (process.env.NODE_ENV !== 'test') {
            console.log(`[${logEntry.timestamp.toISOString()}] ${level.toUpperCase()}: ${message}`,
                metadata ? JSON.stringify(metadata) : '');
        }

    }

    getLogs(): typeof this.logs {
        return [...this.logs];
    }

    clearLogs(): void {
        this.logs = [];
    }
}