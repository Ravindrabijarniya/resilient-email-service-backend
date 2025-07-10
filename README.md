# Resilient Email Service

A robust, production-ready email sending service built with TypeScript featuring retry logic, fallback mechanisms, rate limiting, and comprehensive monitoring.

## 🚀 Features

- **Retry Logic**: Exponential backoff with configurable retry attempts
- **Provider Fallback**: Automatic failover between multiple email providers
- **Rate Limiting**: Prevent abuse with configurable rate limits
- **Circuit Breaker**: Prevent cascade failures with circuit breaker pattern
- **Idempotency**: Prevent duplicate email sends
- **Queue System**: Asynchronous email processing with in-memory queue
- **Status Tracking**: Real-time monitoring of email delivery status
- **Comprehensive Logging**: Detailed logging for debugging and monitoring
- **Health Checks**: Built-in health check endpoints
- **TypeScript**: Full type safety and excellent developer experience

## 📋 Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Testing](#testing)
- [Deployment](#deployment)
- [Monitoring](#monitoring)
- [Contributing](#contributing)

## 🛠️ Installation

### Prerequisites

- Node.js 16.0+ 
- npm 8.0+
- TypeScript 5.0+

### Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/resilient-email-service.git
cd resilient-email-service

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev

# Or build and start production server
npm run build
npm start
```

### Using Docker

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build and run manually
docker build -t email-service .
docker run -p 3000:3000 email-service
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { EmailService } from './src/email-service';
import { MockEmailProvider } from './src/providers/mock-email-provider';

// Initialize providers
const providers = [
  new MockEmailProvider('SendGrid', 0.1, 500),
  new MockEmailProvider('Mailgun', 0.15, 800)
];

// Create email service
const emailService = new EmailService(providers, 3, 1000);

// Send an email
const message = {
  id: 'unique-id-123',
  to: 'recipient@example.com',
  from: 'sender@example.com',
  subject: 'Hello World',
  body: 'This is a test email'
};

const attempt = await emailService.sendEmail(message);
console.log('Email queued:', attempt.id);

// Check status
const status = emailService.getEmailStatus(message.id);
console.log('Status:', status?.status);
```

### REST API Usage

```bash
# Send an email
curl -X POST http://localhost:3000/api/emails \
  -H "Content-Type: application/json" \
  -d '{
    "to": "recipient@example.com",
    "from": "sender@example.com",
    "subject": "Hello World",
    "body": "This is a test email",
    "priority": "high"
  }'

# Check email status
curl http://localhost:3000/api/emails/{messageId}/status

# Get service status
curl http://localhost:3000/api/status

# View logs
curl http://localhost:3000/api/logs
```

## 📚 API Documentation

### Email Endpoints

#### POST `/api/emails`
Send a new email.

**Request Body:**
```json
{
  "to": "recipient@example.com",
  "from": "sender@example.com",
  "subject": "Email subject",
  "body": "Email body content",
  "priority": "high|medium|low"
}
```

**Response:**
```json
{
  "message": "Email queued for sending",
  "attemptId": "attempt-123",
  "messageId": "email-456",
  "status": "queued"
}
```

#### GET `/api/emails/{messageId}/status`
Get email delivery status.

**Response:**
```json
{
  "id": "attempt-123",
  "messageId": "email-456",
  "status": "sent",
  "attempts": 1,
  "provider": "SendGrid",
  "createdAt": "2023-07-10T10:00:00Z",
  "updatedAt": "2023-07-10T10:00:05Z"
}
```

### Monitoring Endpoints

#### GET `/api/status`
Get service health and status.

**Response:**
```json
{
  "providers": [
    {
      "name": "SendGrid",
      "circuitBreakerState": "closed"
    }
  ],
  "queueSize": 0,
  "totalAttempts": 25
}
```

#### GET `/api/logs`
Get service logs.

#### GET `/api/rate-limit/{key}`
Get rate limit status for a key.

## ⚙️ Configuration

### Environment Variables

```bash
# Application
NODE_ENV=development
PORT=3000

# Email Service
MAX_RETRIES=3
BASE_DELAY=1000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000

# Circuit Breaker
CIRCUIT_BREAKER_THRESHOLD=5
CIRCUIT_BREAKER_TIMEOUT=60000
```

### Service Configuration

```typescript
const emailService = new EmailService(
  providers,                    // Email providers array
  3,                           // Max retry attempts
  1000,                        // Base delay in ms
  {                            // Rate limiting config
    maxRequests: 100,
    windowMs: 60000
  }
);
```

## 🏗️ Architecture

### Core Components

1. **EmailService**: Main orchestrator handling email sending logic
2. **EmailProvider**: Abstract interface for email providers
3. **CircuitBreaker**: Prevents cascade failures
4. **RateLimiter**: Controls request rate per user/IP
5. **Logger**: Centralized logging system
6. **Queue System**: Asynchronous email processing

### Design Patterns

- **Strategy Pattern**: Pluggable email providers
- **Circuit Breaker Pattern**: Fault tolerance
- **Retry Pattern**: Exponential backoff
- **Observer Pattern**: Status tracking
- **Queue Pattern**: Asynchronous processing

### Flow Diagram

```
Request → Rate Limiter → Idempotency Check → Queue → 
  Provider Selection → Circuit Breaker → Retry Logic → 
  Status Update → Response
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- email-service.test.ts
```

### Test Coverage

The project maintains high test coverage:

- **Unit Tests**: Individual component testing
- **Integration Tests**: API endpoint testing
- **Performance Tests**: Load and stress testing
- **Edge Case Tests**: Error handling validation

### Test Categories

1. **Email Service Tests**
   - Basic email sending
   - Idempotency checks
   - Rate limiting
   - Retry logic
   - Provider fallback

2. **Component Tests**
   - Circuit breaker functionality
   - Rate limiter behavior
   - Mock provider simulation

3. **Integration Tests**
   - API endpoint functionality
   - Error handling
   - Status tracking

4. **Performance Tests**
   - Concurrent request handling
   - Rate limit enforcement
   - Memory usage under load

## 🚢 Deployment

### Production Checklist

- [ ] Environment variables configured
- [ ] Rate limiting configured
- [ ] Monitoring alerts set up
- [ ] Log aggregation configured
- [ ] Health checks enabled
- [ ] Backup procedures in place

### Docker Deployment

```bash
# Build production image
docker build -t email-service:latest .

# Run with docker-compose
docker-compose up -d

# Scale service
docker-compose up -d --scale email-service=3
```

### Cloud Deployment

#### AWS ECS

```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
docker build -t email-service .
docker tag email-service:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/email-service:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/email-service:latest
```

#### Railway/Heroku

```bash
# Deploy to Railway
railway up

# Deploy to Heroku
heroku create your-email-service
git push heroku main
```

#### Vercel (Serverless)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## 📊 Monitoring

### Health Checks

The service provides built-in health check endpoints:

- `/api/status` - Service health and metrics
- `/health` - Simple health check (via nginx)

### Metrics

Key metrics to monitor:

- **Email Send Rate**: Emails processed per minute
- **Success Rate**: Percentage of successful deliveries
- **Provider Performance**: Response times and failure rates
- **Queue Size**: Number of pending emails
- **Circuit Breaker State**: Provider health status
- **Rate Limit Hits**: Rate limiting effectiveness

### Logging

Structured logging with multiple levels:

```typescript
logger.info('Email sent successfully', { messageId, provider });
logger.warn('Provider failed, trying fallback', { provider, error });
logger.error('Email failed after all retries', { messageId, attempts });
```

### Error Tracking

Common error scenarios:

1. **Rate Limit Exceeded**: 429 status code
2. **Provider Failures**: Automatic fallback
3. **Circuit Breaker Open**: Temporary service unavailable
4. **Invalid Request**: 400 status code
5. **Email Not Found**: 404 status code

## 🔧 Development

### Code Structure

```
src/
├── types/          # TypeScript type definitions
├── providers/      # Email provider implementations
├── utils/          # Utility classes (circuit breaker, rate limiter, logger)
├── services/       # Core business logic
├── tests/          # Test files
└── server.ts       # Main application entry point
