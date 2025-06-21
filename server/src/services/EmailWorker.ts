import { EmailTargetModel } from '../models/EmailTarget';
import { EmailJobModel } from '../models/EmailJob';
import { EmailJobStatus } from '../types/enums';

export class EmailWorkerService {
  private isRunning = false;
  private batchSize = 50;
  private maxRetries = 3;
  private processingInterval = 5000; // 5 seconds

  async start() {
    if (this.isRunning) {
      console.log('Email worker is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Email worker started');
    
    this.processEmailQueue();
  }

  async stop() {
    this.isRunning = false;
    console.log('⏹️ Email worker stopped');
  }

  private async processEmailQueue() {
    while (this.isRunning) {
      try {
        await this.processBatch();
      } catch (error) {
        console.error('Error processing email batch:', error);
      }

      // Wait before next batch
      await this.sleep(this.processingInterval);
    }
  }

  private async processBatch() {
    // Get pending email targets
    const pendingTargets = await EmailTargetModel.find({
      status: 'pending',
      retryCount: { $lt: this.maxRetries }
    })
    .sort({ createdAt: 1 })
    .limit(this.batchSize);

    if (pendingTargets.length === 0) {
      return;
    }

    console.log(`Processing batch of ${pendingTargets.length} emails`);

    // Reserve these targets by marking them as processing
    const targetIds = pendingTargets.map(t => t.id);
    await EmailTargetModel.updateMany(
      { id: { $in: targetIds } },
      { status: 'processing' }
    );

    // Process each target
    for (const target of pendingTargets) {
      try {
        await this.processEmailTarget(target);
      } catch (error) {
        console.error(`Error processing target ${target.id}:`, error);
        await this.handleTargetFailure(target, error as Error);
      }
    }

    // Update job statuses
    await this.updateJobStatuses();
  }

  private async processEmailTarget(target: any) {
    // TODO: Implement actual email sending via UserProvider system
    // For now, we'll just mark as failed since the provider system is being refactored
    console.log(`⚠️ Email sending not implemented yet for ${target.email} - marking as failed`);
    await this.handleTargetFailure(target, new Error('Email sending not yet implemented'));
  }

  private async handleTargetFailure(target: any, error: Error) {
    const retryCount = target.retryCount + 1;
    
    if (retryCount >= this.maxRetries) {
      // Mark as permanently failed
      await EmailTargetModel.updateOne(
        { id: target.id },
        { 
          status: 'failed',
          failureReason: error.message,
          retryCount
        }
      );
      console.log(`❌ Email to ${target.email} permanently failed after ${retryCount} attempts`);
    } else {
      // Mark for retry
      await EmailTargetModel.updateOne(
        { id: target.id },
        { 
          status: 'pending',
          failureReason: error.message,
          retryCount
        }
      );
      console.log(`🔄 Email to ${target.email} will be retried (attempt ${retryCount})`);
    }
  }

  private async updateJobStatuses() {
    // Find jobs that need status updates
    const jobs = await EmailJobModel.find({
      status: { $in: ['pending', 'processing'] }
    });

    for (const job of jobs) {
      const targets = await EmailTargetModel.find({ jobId: job.id });
      const totalTargets = targets.length;
      const sentTargets = targets.filter(t => t.status === 'sent').length;
      const failedTargets = targets.filter(t => t.status === 'failed').length;
      const pendingTargets = targets.filter(t => t.status === 'pending').length;

      let newStatus = job.status;

      if (pendingTargets === 0) {
        // All targets processed
        if (sentTargets > 0) {
          newStatus = EmailJobStatus.COMPLETED;
        } else {
          newStatus = EmailJobStatus.FAILED;
        }
      } else if (sentTargets > 0 || failedTargets > 0) {
        // Some targets processed
        newStatus = EmailJobStatus.PROCESSING;
      }

      if (newStatus !== job.status) {
        await EmailJobModel.updateOne(
          { id: job.id },
          { status: newStatus }
        );
        console.log(`Job ${job.id} status updated to ${newStatus}`);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const emailWorker = new EmailWorkerService();

