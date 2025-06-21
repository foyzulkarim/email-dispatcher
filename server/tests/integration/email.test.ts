import { FastifyInstance } from 'fastify';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { EmailJobModel } from '../../src/modules/email-job/EmailJob';
import { EmailTargetModel } from '../../src/modules/email-target/EmailTarget';
import { SuppressionModel } from '../../src/modules/suppression/Suppression';

// Mock services before any other imports
jest.mock('../../src/modules/core/infra/QueueService', () => ({
  queueService: {
    connect: jest.fn().mockResolvedValue(void 0),
    disconnect: jest.fn().mockResolvedValue(void 0),
    publishJob: jest.fn().mockResolvedValue(void 0),
    startConsumer: jest.fn().mockResolvedValue(void 0),
    isConnected: jest.fn().mockReturnValue(true)
  }
}));

jest.mock('../../src/modules/email-template/TemplateService', () => ({
  templateService: {
    processTemplate: jest.fn().mockResolvedValue({
      subject: 'Mock Subject',
      htmlContent: 'Mock Content'
    }),
    previewTemplate: jest.fn(),
    getAllTemplates: jest.fn(),
    getTemplate: jest.fn(),
    createTemplate: jest.fn(),
    updateTemplate: jest.fn(),
    deleteTemplate: jest.fn()
  }
}));

// Now import the test app and services after mocking
import { buildTestApp } from '../utils/testApp';
import { queueService } from '../../src/modules/core/infra/QueueService';
import { templateService } from '../../src/modules/email-template/TemplateService';

describe('Email Routes Integration Tests', () => {
  let app: FastifyInstance;
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    // Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Build Fastify app
    app = await buildTestApp();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    await app.close();
  });

  beforeEach(async () => {
    // Clear all collections before each test
    await EmailJobModel.deleteMany({});
    await EmailTargetModel.deleteMany({});
    await SuppressionModel.deleteMany({});
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('POST /api/email/submit', () => {
    it('should create a new email job with direct email content', async () => {
      const payload = {
        subject: 'Test Subject',
        body: 'Test Body',
        recipients: ['test@example.com'],
        metadata: { test: 'value' }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/email/submit',
        payload
      });

      const result = JSON.parse(response.payload);
      expect(response.statusCode).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.jobId).toBeDefined();
      expect(result.data.totalRecipients).toBe(1);
      expect(result.data.validRecipients).toBe(1);

      // Verify job was created in database
      const job = await EmailJobModel.findOne({ id: result.data.jobId });
      expect(job).not.toBeNull();
      expect(job?.subject).toBe('Test Subject');
      expect(job?.body).toBe('Test Body');
      expect(job?.status).toBe('pending');

      // Verify targets were created
      const targets = await EmailTargetModel.find({ jobId: result.data.jobId });
      expect(targets).toHaveLength(1);
      expect(targets[0].email).toBe('test@example.com');
      expect(targets[0].status).toBe('pending');

      // Verify queue service was called
      expect(queueService.publishJob).toHaveBeenCalledWith(result.data.jobId);
    });

    it('should create a new email job with template', async () => {
      const mockProcessedTemplate = {
        subject: 'Processed Subject',
        htmlContent: '<p>Processed Content</p>'
      };

      (templateService.processTemplate as jest.MockedFunction<any>)
        .mockResolvedValue(mockProcessedTemplate);

      const payload = {
        templateId: 'template-123',
        templateVariables: { name: 'John' },
        recipients: ['test@example.com']
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/email/submit',
        payload
      });

      const result = JSON.parse(response.payload);
      expect(response.statusCode).toBe(200);
      expect(result.success).toBe(true);

      // Verify template service was called
      expect(templateService.processTemplate).toHaveBeenCalledWith(
        'template-123',
        { name: 'John' }
      );

      // Verify job was created with processed template content
      const job = await EmailJobModel.findOne({ id: result.data.jobId });
      expect(job?.subject).toBe('Processed Subject');
      expect(job?.body).toBe('<p>Processed Content</p>');
      expect(job?.templateId).toBe('template-123');
    });

    it('should handle template processing errors', async () => {
      (templateService.processTemplate as jest.MockedFunction<any>)
        .mockRejectedValue(new Error('Template not found'));

      const payload = {
        templateId: 'non-existent-template',
        templateVariables: { name: 'John' },
        recipients: ['test@example.com']
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/email/submit',
        payload
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Template processing error: Template not found');
    });

    it('should handle suppressed emails', async () => {
      // Create suppressed email
      await SuppressionModel.create({ 
        email: 'suppressed@example.com',
        reason: 'manual'
      });

      const payload = {
        subject: 'Test Subject',
        body: 'Test Body',
        recipients: ['valid@example.com', 'suppressed@example.com']
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/email/submit',
        payload
      });

      const result = JSON.parse(response.payload);
      expect(response.statusCode).toBe(200);
      expect(result.data.totalRecipients).toBe(2);
      expect(result.data.validRecipients).toBe(1);
      expect(result.data.suppressedRecipients).toBe(1);

      // Verify only valid recipients were created as targets
      const targets = await EmailTargetModel.find({ jobId: result.data.jobId });
      expect(targets).toHaveLength(1);
      expect(targets[0].email).toBe('valid@example.com');
    });

    it('should return 400 when all recipients are suppressed', async () => {
      await SuppressionModel.create({ 
        email: 'suppressed@example.com',
        reason: 'bounce'
      });

      const payload = {
        subject: 'Test Subject',
        body: 'Test Body',
        recipients: ['suppressed@example.com']
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/email/submit',
        payload
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.payload).error).toBe('All recipients are in suppression list');
    });

    it('should return 400 when neither subject+body nor templateId is provided', async () => {
      const payload = {
        recipients: ['test@example.com']
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/email/submit',
        payload
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.payload).error).toBe('Either provide subject+body for direct email OR templateId for template-based email');
    });

    it('should return 400 when no recipients are provided', async () => {
      const payload = {
        subject: 'Test Subject',
        body: 'Test Body',
        recipients: []
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/email/submit',
        payload
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.payload).error).toBe('Missing required field: recipients');
    });

    it('should return 400 when both direct email and template are provided', async () => {
      const payload = {
        subject: 'Test Subject',
        body: 'Test Body',
        templateId: 'template-123',
        recipients: ['test@example.com']
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/email/submit',
        payload
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.payload).error).toBe('Cannot use both direct email (subject+body) and template-based email in the same request');
    });
  });

  describe('GET /api/email/job/:jobId', () => {
    it('should return job status and statistics', async () => {
      // Create a test job
      const job = await EmailJobModel.create({
        id: 'test-job-id',
        subject: 'Test Subject',
        body: 'Test Body',
        status: 'processing'
      });

      // Create some test targets
      await EmailTargetModel.insertMany([
        { id: '1', jobId: job.id, email: 'test1@example.com', status: 'sent' },
        { id: '2', jobId: job.id, email: 'test2@example.com', status: 'failed' },
        { id: '3', jobId: job.id, email: 'test3@example.com', status: 'pending' }
      ]);

      const response = await app.inject({
        method: 'GET',
        url: `/api/email/job/${job.id}`
      });

      const result = JSON.parse(response.payload);
      expect(response.statusCode).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(job.id);
      expect(result.data.subject).toBe('Test Subject');
      expect(result.data.status).toBe('processing');
      expect(result.data.stats.total).toBe(3);
      expect(result.data.stats.sent).toBe(1);
      expect(result.data.stats.failed).toBe(1);
      expect(result.data.stats.pending).toBe(1);
      expect(result.data.recipientCount).toBe(3);
      expect(result.data.processedCount).toBe(2); // sent + failed
      expect(result.data.successCount).toBe(1);
      expect(result.data.failedCount).toBe(1);
    });

    it('should return 404 for non-existent job', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/email/job/non-existent-id'
      });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.payload).error).toBe('Job not found');
    });
  });

  describe('GET /api/email/jobs', () => {
    it('should return paginated jobs list', async () => {
      // Create test jobs
      await EmailJobModel.insertMany([
        { id: 'job-1', subject: 'Test 1', body: 'Test Body 1', status: 'completed' },
        { id: 'job-2', subject: 'Test 2', body: 'Test Body 2', status: 'processing' },
        { id: 'job-3', subject: 'Test 3', body: 'Test Body 3', status: 'pending' }
      ]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/email/jobs?page=1&limit=2'
      });

      const result = JSON.parse(response.payload);
      expect(response.statusCode).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.jobs).toHaveLength(2);
      expect(result.data.pagination.total).toBe(3);
      expect(result.data.pagination.pages).toBe(2);
      expect(result.data.pagination.page).toBe(1);
      expect(result.data.pagination.limit).toBe(2);
    });

    it('should filter jobs by status', async () => {
      await EmailJobModel.insertMany([
        { id: 'job-1', subject: 'Test 1', body: 'Test Body 1', status: 'completed' },
        { id: 'job-2', subject: 'Test 2', body: 'Test Body 2', status: 'processing' },
        { id: 'job-3', subject: 'Test 3', body: 'Test Body 3', status: 'completed' }
      ]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/email/jobs?status=completed'
      });

      const result = JSON.parse(response.payload);
      expect(response.statusCode).toBe(200);
      expect(result.data.jobs).toHaveLength(2);
      expect(result.data.jobs.every((job: any) => job.status === 'completed')).toBe(true);
    });

    it('should return empty array when no jobs exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/email/jobs'
      });

      const result = JSON.parse(response.payload);
      expect(response.statusCode).toBe(200);
      expect(result.data.jobs).toHaveLength(0);
      expect(result.data.pagination.total).toBe(0);
    });
  });

  describe('GET /api/email/job/:jobId/targets', () => {
    it('should return all email targets for a job', async () => {
      const job = await EmailJobModel.create({
        id: 'test-job-id',
        subject: 'Test Subject',
        body: 'Test Body',
        status: 'processing'
      });

      const sentDate = new Date();
      await EmailTargetModel.insertMany([
        { 
          id: '1',
          jobId: job.id,
          email: 'test1@example.com',
          status: 'sent',
          sentAt: sentDate,
          providerId: 'provider-1'
        },
        {
          id: '2',
          jobId: job.id,
          email: 'test2@example.com',
          status: 'failed',
          failureReason: 'Bounce',
          retryCount: 2
        }
      ]);

      const response = await app.inject({
        method: 'GET',
        url: `/api/email/job/${job.id}/targets`
      });

      const result = JSON.parse(response.payload);
      expect(response.statusCode).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      
      const sentTarget = result.data.find((t: any) => t.email === 'test1@example.com');
      expect(sentTarget).toMatchObject({
        id: '1',
        email: 'test1@example.com',
        status: 'sent',
        providerId: 'provider-1'
      });
      expect(new Date(sentTarget.sentAt)).toEqual(sentDate);

      const failedTarget = result.data.find((t: any) => t.email === 'test2@example.com');
      expect(failedTarget).toMatchObject({
        id: '2',
        email: 'test2@example.com',
        status: 'failed',
        failureReason: 'Bounce',
        retryCount: 2
      });
    });

    it('should return 404 for non-existent job', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/email/job/non-existent-id/targets'
      });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.payload).error).toBe('Job not found');
    });

    it('should return empty array for job with no targets', async () => {
      const job = await EmailJobModel.create({
        id: 'test-job-id',
        subject: 'Test Subject',
        body: 'Test Body',
        status: 'pending'
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/email/job/${job.id}/targets`
      });

      const result = JSON.parse(response.payload);
      expect(response.statusCode).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });
});
