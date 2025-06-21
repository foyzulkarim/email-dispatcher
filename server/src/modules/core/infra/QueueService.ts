import * as amqp from 'amqplib';

class QueueService {
  private connection: any = null;
  private channel: any = null;
  private readonly QUEUE_NAME = 'email_jobs';
  private readonly RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

  async connect(): Promise<void> {
    try {
      console.log('🐰 Connecting to RabbitMQ...');
      this.connection = await amqp.connect(this.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();
      
      // Declare the queue (create if it doesn't exist)
      await this.channel.assertQueue(this.QUEUE_NAME, {
        durable: true, // Queue survives server restarts
      });

      console.log('✅ Connected to RabbitMQ successfully');
    } catch (error) {
      console.error('❌ Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      console.log('🐰 Disconnected from RabbitMQ');
    } catch (error) {
      console.error('Error disconnecting from RabbitMQ:', error);
    }
  }

  async publishJob(jobId: string): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    const message = JSON.stringify({ jobId, timestamp: new Date().toISOString() });
    
    this.channel.sendToQueue(this.QUEUE_NAME, Buffer.from(message), {
      persistent: true, // Message survives server restarts
    });

    console.log(`📨 Job ${jobId} added to queue`);
  }

  async startConsumer(processJobCallback: (jobId: string) => Promise<void>): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    // Set prefetch to 1 to process one job at a time
    await this.channel.prefetch(1);

    console.log('🔄 Starting job consumer...');
    
    await this.channel.consume(this.QUEUE_NAME, async (message: any) => {
      if (message) {
        try {
          const { jobId } = JSON.parse(message.content.toString());
          console.log(`🔄 Processing job: ${jobId}`);
          
          await processJobCallback(jobId);
          
          // Acknowledge the message (remove from queue)
          this.channel.ack(message);
          console.log(`✅ Job ${jobId} processed successfully`);
        } catch (error) {
          console.error('❌ Error processing job:', error);
          // Reject the message and requeue it
          this.channel.nack(message, false, true);
        }
      }
    });
  }

  isConnected(): boolean {
    return this.connection !== null && this.channel !== null;
  }
}

export const queueService = new QueueService();
