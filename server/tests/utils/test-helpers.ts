import { v4 as uuidv4 } from 'uuid';

// Test data factories
export const createMockEmailJob = (overrides: any = {}) => ({
  id: uuidv4(),
  subject: 'Test Email Subject',
  body: '<h1>Test Email Body</h1>',
  status: 'pending',
  createdAt: new Date(),
  updatedAt: new Date(),
  metadata: {},
  ...overrides
});

export const createMockEmailTarget = (overrides: any = {}) => ({
  id: uuidv4(),
  jobId: uuidv4(),
  email: 'test@example.com',
  status: 'pending',
  retryCount: 0,
  ...overrides
});

export const createMockProvider = (overrides: any = {}) => ({
  id: uuidv4(),
  name: 'Test Provider',
  type: 'brevo',
  apiKey: 'test-api-key',
  dailyQuota: 1000,
  sentToday: 0,
  isActive: true,
  ...overrides
});

// Async test helpers
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const waitForCondition = async (
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await condition()) {
      return;
    }
    await waitFor(interval);
  }
  throw new Error(`Condition not met within ${timeout}ms`);
};

// Email validation helpers
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Mock response helpers
export const createSuccessResponse = (data: any, message?: string) => ({
  success: true,
  data,
  message
});

export const createErrorResponse = (error: string) => ({
  success: false,
  error
});

// Database test helpers
export const clearTestDatabase = jest.fn().mockResolvedValue({});
export const seedTestData = jest.fn().mockResolvedValue({});

// Environment helpers
export const setTestEnv = (key: string, value: string) => {
  const originalValue = process.env[key];
  process.env[key] = value;
  return () => {
    if (originalValue !== undefined) {
      process.env[key] = originalValue;
    } else {
      delete process.env[key];
    }
  };
}; 
