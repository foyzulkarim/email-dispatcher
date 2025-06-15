import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';

describe('Basic API Integration Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify({
      logger: false
    });

    // Register CORS
    await app.register(cors, {
      origin: true,
      credentials: true
    });

    // Simple health check endpoint
    app.get('/health', async (request, reply) => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // Simple echo endpoint for testing
    app.post('/echo', async (request, reply) => {
      return { 
        success: true, 
        data: request.body,
        message: 'Echo successful'
      };
    });

    await app.ready();
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
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('Echo Endpoint', () => {
    it('should echo request data', async () => {
      const testData = {
        message: 'Hello World',
        number: 42,
        array: [1, 2, 3]
      };

      const response = await app.inject({
        method: 'POST',
        url: '/echo',
        payload: testData
      });

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(testData);
      expect(result.message).toBe('Echo successful');
    });

    it('should handle empty request body', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/echo',
        payload: {}
      });

      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.payload);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoints', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/non-existent'
      });

      expect(response.statusCode).toBe(404);
    });

    it('should handle invalid JSON', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/echo',
        payload: 'invalid-json',
        headers: {
          'content-type': 'application/json'
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });
}); 
