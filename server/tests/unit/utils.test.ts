import { isValidEmail, createMockEmailJob } from '../utils/test-helpers';

describe('Test Utilities', () => {
  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
      expect(isValidEmail('user@sub.domain.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@invalid.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('createMockEmailJob', () => {
    it('should create mock email job with default values', () => {
      const job = createMockEmailJob();
      
      expect(job.id).toBeDefined();
      expect(job.subject).toBe('Test Email Subject');
      expect(job.body).toBe('<h1>Test Email Body</h1>');
      expect(job.status).toBe('pending');
      expect(job.createdAt).toBeInstanceOf(Date);
      expect(job.updatedAt).toBeInstanceOf(Date);
      expect(job.metadata).toEqual({});
    });

    it('should create mock email job with custom values', () => {
      const customJob = createMockEmailJob({
        subject: 'Custom Subject',
        status: 'completed',
        metadata: { source: 'test' }
      });
      
      expect(customJob.subject).toBe('Custom Subject');
      expect(customJob.status).toBe('completed');
      expect(customJob.metadata).toEqual({ source: 'test' });
    });
  });
}); 
