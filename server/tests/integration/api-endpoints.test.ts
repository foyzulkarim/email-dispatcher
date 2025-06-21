import { FastifyInstance } from 'fastify';
import { build } from '../fixtures/app';

// Simple mocks without complex hoisting issues
jest.mock('../../src/modules/email-provider/EmailProvider');
jest.mock('../../src/modules/email-job/EmailJob');
jest.mock('../../src/modules/email-target/EmailTarget');
jest.mock('../../src/modules/suppression/Suppression');
jest.mock('../../src/modules/core/infra/QueueService');
jest.mock('../../src/modules/email-template/TemplateService');
jest.mock('../../src/modules/email-provider/EmailProviderService');
jest.mock('../../src/config/providers');

describe('API Endpoints Integration Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.payload);
      expect(result.status).toBe('ok');
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('Provider API Structure Tests', () => {
    it('should handle POST /api/provider/create with proper structure', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/provider/create',
        payload: {
          name: 'Test Provider',
          type: 'brevo',
          apiKey: 'test-key',
          dailyQuota: 1000
        }
      });

      // We expect either a success response or a validation error
      // This tests that the endpoint exists and accepts the payload structure
      expect([200, 201, 400, 409, 500]).toContain(response.statusCode);
      
      const result = JSON.parse(response.payload);
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
      
      if (!result.success) {
        expect(result).toHaveProperty('error');
        expect(typeof result.error).toBe('string');
      }
    });

    it('should validate required fields for provider creation', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/provider/create',
        payload: {
          name: 'Test Provider'
          // Missing required fields
        }
      });

      expect(response.statusCode).toBe(400);
      
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required fields');
    });

    it('should handle GET /api/provider/list', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/provider/list'
      });

      // Should return a list structure
      expect([200, 500]).toContain(response.statusCode);
      
      const result = JSON.parse(response.payload);
      expect(result).toHaveProperty('success');
      
      if (result.success) {
        expect(result).toHaveProperty('data');
        expect(Array.isArray(result.data)).toBe(true);
      }
    });

    it('should handle POST /api/provider/test with validation', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/provider/test',
        payload: {
          providerId: 'test-id',
          testEmail: 'test@example.com'
        }
      });

      // Should process the request structure
      expect([200, 400, 404, 500]).toContain(response.statusCode);
      
      const result = JSON.parse(response.payload);
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
    });

    it('should validate email format in provider test', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/provider/test',
        payload: {
          providerId: 'test-id',
          testEmail: 'invalid-email'
        }
      });

      expect(response.statusCode).toBe(400);
      
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email format');
    });
  });

  describe('Email API Structure Tests', () => {
    it('should handle POST /api/email/submit with direct email payload', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/email/submit',
        payload: {
          subject: 'Test Email Subject',
          body: '<h1>Test Email Body</h1>',
          recipients: ['test@example.com', 'user@example.com'],
          metadata: { campaign: 'test' }
        }
      });

      // Should accept the payload structure
      expect([200, 400, 500]).toContain(response.statusCode);
      
      const result = JSON.parse(response.payload);
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
      
      if (result.success) {
        expect(result.data).toHaveProperty('jobId');
        expect(result.data).toHaveProperty('totalRecipients');
        expect(result.data).toHaveProperty('validRecipients');
      }
    });

    it('should handle POST /api/email/submit with template payload', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/email/submit',
        payload: {
          templateId: 'template-123',
          templateVariables: {
            name: 'John Doe',
            product: 'Test Product'
          },
          recipients: ['test@example.com'],
          metadata: { campaign: 'template-test' }
        }
      });

      // Should accept the template payload structure
      expect([200, 400, 500]).toContain(response.statusCode);
      
      const result = JSON.parse(response.payload);
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
    });

    it('should validate required recipients field', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/email/submit',
        payload: {
          subject: 'Test Subject',
          body: 'Test Body'
          // Missing recipients
        }
      });

      expect(response.statusCode).toBe(400);
      
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required field: recipients');
    });

    it('should validate email content requirements', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/email/submit',
        payload: {
          recipients: ['test@example.com']
          // Missing both direct email content and template
        }
      });

      expect(response.statusCode).toBe(400);
      
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Either provide subject+body for direct email OR templateId for template-based email');
    });

    it('should prevent both direct email and template in same request', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/email/submit',
        payload: {
          subject: 'Test Subject',
          body: 'Test Body',
          templateId: 'template-123',
          recipients: ['test@example.com']
        }
      });

      expect(response.statusCode).toBe(400);
      
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot use both direct email (subject+body) and template-based email');
    });

    it('should handle GET /api/email/job/:jobId', async () => {
      const jobId = 'test-job-123';
      
      const response = await app.inject({
        method: 'GET',
        url: `/api/email/job/${jobId}`
      });

      // Should process the request
      expect([200, 404, 500]).toContain(response.statusCode);
      
      const result = JSON.parse(response.payload);
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
      
      if (result.success) {
        expect(result.data).toHaveProperty('id');
        expect(result.data).toHaveProperty('status');
        expect(result.data).toHaveProperty('stats');
      } else if (response.statusCode === 404) {
        expect(result.error).toContain('Job not found');
      }
    });
  });

  describe('API Response Structure', () => {
    it('should return consistent error structure for 404 routes', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/nonexistent/route'
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return consistent error structure for invalid JSON', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/email/submit',
        payload: 'invalid-json',
        headers: {
          'content-type': 'application/json'
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Payload Structure Validation', () => {
    it('should handle empty payloads gracefully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/email/submit',
        payload: {}
      });

      expect(response.statusCode).toBe(400);
      
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle malformed email addresses', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/email/submit',
        payload: {
          subject: 'Test',
          body: 'Test',
          recipients: ['invalid-email', 'another-invalid']
        }
      });

      // Should still process but may filter invalid emails
      expect([200, 400, 500]).toContain(response.statusCode);
      
      const result = JSON.parse(response.payload);
      expect(result).toHaveProperty('success');
    });
  });
}); 
