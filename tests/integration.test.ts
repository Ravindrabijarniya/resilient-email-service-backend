// import request from 'supertest';
// import { app } from '../src/server';
//
// describe('Email API Integration', () => {
//     it('should send email via API', async () => {
//         const response = await request(app)
//             .post('/api/emails')
//             .send({
//                 to: 'test@example.com',
//                 from: 'sender@example.com',
//                 subject: 'Test Subject',
//                 body: 'Test Body',
//                 priority: 'high'
//             });
//
//         expect(response.status).toBe(202);
//         expect(response.body.message).toBe('Email queued for sending');
//         expect(response.body.messageId).toBeTruthy();
//         expect(response.body.attemptId).toBeTruthy();
//     });
//
//     it('should return 400 for missing required fields', async () => {
//         const response = await request(app)
//             .post('/api/emails')
//             .send({
//                 to: 'test@example.com',
//                 from: 'sender@example.com'
//                 // Missing subject and body
//             });
//
//         expect(response.status).toBe(400);
//         expect(response.body.error).toBe('Missing required fields: to, from, subject, body');
//     });
//
//     it('should get email status', async () => {
//         const sendResponse = await request(app)
//             .post('/api/emails')
//             .send({
//                 to: 'test@example.com',
//                 from: 'sender@example.com',
//                 subject: 'Test Subject',
//                 body: 'Test Body'
//             });
//
//         const messageId = sendResponse.body.messageId;
//
//         const statusResponse = await request(app)
//             .get(`/api/emails/${messageId}/status`);
//
//         expect(statusResponse.status).toBe(200);
//         expect(statusResponse.body.messageId).toBe(messageId);
//         expect(statusResponse.body.status).toBeTruthy();
//     });
//
//     it('should return 404 for non-existent email', async () => {
//         const response = await request(app)
//             .get('/api/emails/non-existent/status');
//
//         expect(response.status).toBe(404);
//         expect(response.body.error).toBe('Email not found');
//     });
//
//     it('should get service status', async () => {
//         const response = await request(app)
//             .get('/api/status');
//
//         expect(response.status).toBe(200);
//         expect(response.body.providers).toBeTruthy();
//         expect(response.body.queueSize).toBeDefined();
//         expect(response.body.totalAttempts).toBeDefined();
//     });
//
//     it('should get logs', async () => {
//         const response = await request(app)
//             .get('/api/logs');
//
//         expect(response.status).toBe(200);
//         expect(Array.isArray(response.body)).toBe(true);
//     });
//
//     it('should get rate limit status', async () => {
//         const response = await request(app)
//             .get('/api/rate-limit/test@example.com');
//
//         expect(response.status).toBe(200);
//         expect(response.body.remaining).toBeDefined();
//         expect(response.body.limit).toBeDefined();
//     });
// });
//
// // Performance and stress tests
// describe('Performance Tests', () => {
//     it('should handle multiple concurrent requests', async () => {
//         const promises = [];
//
//         for (let i = 0; i < 10; i++) {
//             promises.push(
//                 request(app)
//                     .post('/api/emails')
//                     .send({
//                         to: `test${i}@example.com`,
//                         from: 'sender@example.com',
//                         subject: `Test Subject ${i}`,
//                         body: `Test Body ${i}`
//                     })
//             );
//         }
//
//         const responses = await Promise.all(promises);
//
//         responses.forEach(response => {
//             expect(response.status).toBe(202);
//             expect(response.body.messageId).toBeTruthy();
//         });
//     });
//
//     it('should handle rate limiting correctly under load', async () => {
//         const promises = [];
//
//         // Send more requests than rate limit allows
//         for (let i = 0; i < 150; i++) {
//             promises.push(
//                 request(app)
//                     .post('/api/emails')
//                     .send({
//                         to: 'test@example.com',
//                         from: 'ratelimit@example.com', // Same sender to trigger rate limit
//                         subject: `Test Subject ${i}`,
//                         body: `Test Body ${i}`
//                     })
//             );
//         }
//
//         const responses = await Promise.all(promises);
//
//         const successful = responses.filter(r => r.status === 202);
//         const rateLimited = responses.filter(r => r.status === 429);
//
//         expect(successful.length).toBeLessThan(responses.length);
//         expect(rateLimited.length).toBeGreaterThan(0);
//     });
// });
//
// // Edge case tests
// describe('Edge Cases', () => {
//     it('should handle empty string fields', async () => {
//         const response = await request(app)
//             .post('/api/emails')
//             .send({
//                 to: '',
//                 from: '',
//                 subject: '',
//                 body: ''
//             });
//
//         expect(response.status).toBe(400);
//     });
//
//     it('should handle very long email content', async () => {
//         const longContent = 'x'.repeat(10000);
//
//         const response = await request(app)
//             .post('/api/emails')
//             .send({
//                 to: 'test@example.com',
//                 from: 'sender@example.com',
//                 subject: longContent,
//                 body: longContent
//             });
//
//         expect(response.status).toBe(202);
//     });
//
//     it('should handle special characters in email content', async () => {
//         const response = await request(app)
//             .post('/api/emails')
//             .send({
//                 to: 'test@example.com',
//                 from: 'sender@example.com',
//                 subject: 'Test with émojis 🚀 and special chars: <>&"\'',
//                 body: 'Body with special chars: <script>alert("xss")</script>'
//             });
//
//         expect(response.status).toBe(202);
//     });
// });

import request from 'supertest';
import { app, server } from '../src/server'; // ✅ make sure `server` is exported

afterAll((done) => {
    // ✅ Close the server after all tests complete
    if (server && server.close) {
        server.close(done);
    } else {
        done();
    }
});

describe('Email API Integration', () => {
    it('should send email via API', async () => {
        const response = await request(app)
            .post('/api/emails')
            .send({
                to: 'test@example.com',
                from: 'sender@example.com',
                subject: 'Test Subject',
                body: 'Test Body',
                priority: 'high'
            });

        expect(response.status).toBe(202);
        expect(response.body.message).toBe('Email queued for sending');
        expect(response.body.messageId).toBeTruthy();
        expect(response.body.attemptId).toBeTruthy();
    });

    it('should return 400 for missing required fields', async () => {
        const response = await request(app)
            .post('/api/emails')
            .send({
                to: 'test@example.com',
                from: 'sender@example.com'
                // Missing subject and body
            });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Missing required fields: to, from, subject, body');
    });

    it('should get email status', async () => {
        const sendResponse = await request(app)
            .post('/api/emails')
            .send({
                to: 'test@example.com',
                from: 'sender@example.com',
                subject: 'Test Subject',
                body: 'Test Body'
            });

        const messageId = sendResponse.body.messageId;

        const statusResponse = await request(app)
            .get(`/api/emails/${messageId}/status`);

        expect(statusResponse.status).toBe(200);
        expect(statusResponse.body.messageId).toBe(messageId);
        expect(statusResponse.body.status).toBeTruthy();
    });

    it('should return 404 for non-existent email', async () => {
        const response = await request(app)
            .get('/api/emails/non-existent/status');

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Email not found');
    });

    it('should get service status', async () => {
        const response = await request(app)
            .get('/api/status');

        expect(response.status).toBe(200);
        expect(response.body.providers).toBeTruthy();
        expect(response.body.queueSize).toBeDefined();
        expect(response.body.totalAttempts).toBeDefined();
    });

    it('should get logs', async () => {
        const response = await request(app)
            .get('/api/logs');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get rate limit status', async () => {
        const response = await request(app)
            .get('/api/rate-limit/test@example.com');

        expect(response.status).toBe(200);
        expect(response.body.remaining).toBeDefined();
        expect(response.body.limit).toBeDefined();
    });
});

// Performance and stress tests
describe('Performance Tests', () => {
    it('should handle multiple concurrent requests', async () => {
        const promises = [];

        for (let i = 0; i < 10; i++) {
            promises.push(
                request(app)
                    .post('/api/emails')
                    .send({
                        to: `test${i}@example.com`,
                        from: 'sender@example.com',
                        subject: `Test Subject ${i}`,
                        body: `Test Body ${i}`
                    })
            );
        }

        const responses = await Promise.all(promises);

        responses.forEach(response => {
            expect(response.status).toBe(202);
            expect(response.body.messageId).toBeTruthy();
        });
    });

    it('should handle rate limiting correctly under load', async () => {
        const promises = [];

        for (let i = 0; i < 150; i++) {
            promises.push(
                request(app)
                    .post('/api/emails')
                    .send({
                        to: 'test@example.com',
                        from: 'ratelimit@example.com',
                        subject: `Test Subject ${i}`,
                        body: `Test Body ${i}`
                    })
            );
        }

        const responses = await Promise.all(promises);
        const successful = responses.filter(r => r.status === 202);
        const rateLimited = responses.filter(r => r.status === 429);

        expect(successful.length).toBeLessThan(responses.length);
        expect(rateLimited.length).toBeGreaterThan(0);
    });
});

// Edge case tests
describe('Edge Cases', () => {
    it('should handle empty string fields', async () => {
        const response = await request(app)
            .post('/api/emails')
            .send({
                to: '',
                from: '',
                subject: '',
                body: ''
            });

        expect(response.status).toBe(400);
    });

    it('should handle very long email content', async () => {
        const longContent = 'x'.repeat(10000);

        const response = await request(app)
            .post('/api/emails')
            .send({
                to: 'test@example.com',
                from: 'sender@example.com',
                subject: longContent,
                body: longContent
            });

        expect(response.status).toBe(202);
    });

    it('should handle special characters in email content', async () => {
        const response = await request(app)
            .post('/api/emails')
            .send({
                to: 'test@example.com',
                from: 'sender@example.com',
                subject: 'Test with émojis 🚀 and special chars: <>&"\'',
                body: 'Body with special chars: <script>alert("xss")</script>'
            });

        expect(response.status).toBe(202);
    });
});
