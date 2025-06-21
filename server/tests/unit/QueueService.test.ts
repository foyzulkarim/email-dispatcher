import { queueService } from '../../src/services/QueueService';
import amqp from 'amqplib';

// Mock amqplib
jest.mock('amqplib');
const mockAmqp = amqp as jest.Mocked<typeof amqp>;

describe('QueueService', () => {
  let mockConnection: any;
  let mockChannel: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock objects
    mockChannel = {
      assertQueue: jest.fn().mockResolvedValue({}),
      sendToQueue: jest.fn(),
      consume: jest.fn(),
      prefetch: jest.fn().mockResolvedValue({}),
      ack: jest.fn(),
      nack: jest.fn(),
      close: jest.fn().mockResolvedValue({})
    };
    
    mockConnection = {
      createChannel: jest.fn().mockResolvedValue(mockChannel),
      close: jest.fn().mockResolvedValue({})
    };
    
    mockAmqp.connect.mockResolvedValue(mockConnection);
  });

  afterEach(() => {
    // Reset connection state
    (queueService as any).connection = null;
    (queueService as any).channel = null;
  });

  describe('connect', () => {
    it('should establish connection and create channel successfully', async () => {
      await queueService.connect();
      
      // Focus on behavior, not infrastructure details
      expect(mockAmqp.connect).toHaveBeenCalledTimes(1);
      expect(mockConnection.createChannel).toHaveBeenCalled();
      expect(mockChannel.assertQueue).toHaveBeenCalledWith('email_jobs', {
        durable: true
      });
    });

    it('should throw error when connection fails', async () => {
      const error = new Error('Connection failed');
      mockAmqp.connect.mockRejectedValue(error);
      
      await expect(queueService.connect()).rejects.toThrow('Connection failed');
    });
  });

  describe('disconnect', () => {
    it('should close channel and connection', async () => {
      // Setup connection first
      await queueService.connect();
      
      await queueService.disconnect();
      
      expect(mockChannel.close).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('should handle errors during disconnection', async () => {
      await queueService.connect();
      mockChannel.close.mockRejectedValue(new Error('Close failed'));
      
      // Should not throw error
      await expect(queueService.disconnect()).resolves.toBeUndefined();
    });
  });

  describe('publishJob', () => {
    beforeEach(async () => {
      await queueService.connect();
    });

    it('should publish job to queue', async () => {
      const jobId = 'test-job-123';
      
      await queueService.publishJob(jobId);
      
      expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
        'email_jobs',
        expect.any(Buffer),
        { persistent: true }
      );
      
      // Verify message content
      const messageBuffer = mockChannel.sendToQueue.mock.calls[0][1];
      const message = JSON.parse(messageBuffer.toString());
      expect(message.jobId).toBe(jobId);
      expect(message.timestamp).toBeDefined();
    });

    it('should throw error when channel not initialized', async () => {
      (queueService as any).channel = null;
      
      await expect(queueService.publishJob('test-job')).rejects.toThrow(
        'RabbitMQ channel not initialized'
      );
    });
  });

  describe('startConsumer', () => {
    beforeEach(async () => {
      await queueService.connect();
    });

    it('should start consumer with correct configuration', async () => {
      const mockCallback = jest.fn().mockResolvedValue(undefined);
      
      await queueService.startConsumer(mockCallback);
      
      expect(mockChannel.prefetch).toHaveBeenCalledWith(1);
      expect(mockChannel.consume).toHaveBeenCalledWith(
        'email_jobs',
        expect.any(Function)
      );
    });

    it('should process messages and acknowledge them', async () => {
      const mockCallback = jest.fn().mockResolvedValue(undefined);
      const jobId = 'test-job-123';
      const message = {
        content: Buffer.from(JSON.stringify({ jobId }))
      };
      
      // Mock the consume callback
      mockChannel.consume.mockImplementation((queue: string, callback: any) => {
        callback(message);
      });
      
      await queueService.startConsumer(mockCallback);
      
      expect(mockCallback).toHaveBeenCalledWith(jobId);
      expect(mockChannel.ack).toHaveBeenCalledWith(message);
    });

    it('should handle processing errors and nack messages', async () => {
      const mockCallback = jest.fn().mockRejectedValue(new Error('Processing failed'));
      const jobId = 'test-job-123';
      const message = {
        content: Buffer.from(JSON.stringify({ jobId }))
      };
      
      mockChannel.consume.mockImplementation((queue: string, callback: any) => {
        callback(message);
      });
      
      await queueService.startConsumer(mockCallback);
      
      expect(mockCallback).toHaveBeenCalledWith(jobId);
      expect(mockChannel.nack).toHaveBeenCalledWith(message, false, true);
    });

    it('should throw error when channel not initialized', async () => {
      (queueService as any).channel = null;
      const mockCallback = jest.fn();
      
      await expect(queueService.startConsumer(mockCallback)).rejects.toThrow(
        'RabbitMQ channel not initialized'
      );
    });
  });

  describe('isConnected', () => {
    it('should return false when not connected', () => {
      expect(queueService.isConnected()).toBe(false);
    });

    it('should return true when connected', async () => {
      await queueService.connect();
      expect(queueService.isConnected()).toBe(true);
    });
  });
}); 
