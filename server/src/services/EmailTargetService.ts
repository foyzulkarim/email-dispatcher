import { EmailTargetModel } from '../models/EmailTarget';
import { EmailJobModel } from '../models/EmailJob';
import type { EmailTarget } from '../types';
import { EmailTargetStatus } from '../types/enums';

export class EmailTargetService {
  
  /**
   * Get target by ID with user validation
   */
  async getTargetById(userId: string, targetId: string): Promise<EmailTarget | null> {
    try {
      const target = await EmailTargetModel.findOne({ id: targetId });
      if (!target) {
        return null;
      }

      // Verify the target belongs to a job owned by the user
      const job = await EmailJobModel.findOne({ id: target.jobId, userId });
      if (!job) {
        return null;
      }

      return {
        id: target.id,
        jobId: target.jobId,
        email: target.email,
        status: target.status,
        providerId: target.providerId,
        sentAt: target.sentAt,
        failureReason: target.failureReason,
        retryCount: target.retryCount,
        createdAt: target.createdAt,
        updatedAt: target.updatedAt
      };

    } catch (error) {
      console.error('Error getting target by ID:', error);
      throw error;
    }
  }

  /**
   * Update target status (internal use)
   */
  async updateTargetStatus(
    targetId: string, 
    status: EmailTargetStatus, 
    options: {
      providerId?: string;
      failureReason?: string;
      sentAt?: Date;
    } = {}
  ): Promise<boolean> {
    try {
      const updateData: any = {
        status,
        updatedAt: new Date()
      };

      if (options.providerId) updateData.providerId = options.providerId;
      if (options.failureReason) updateData.failureReason = options.failureReason;
      if (options.sentAt) updateData.sentAt = options.sentAt;

      const result = await EmailTargetModel.updateOne(
        { id: targetId },
        updateData
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error updating target status:', error);
      throw error;
    }
  }

  /**
   * Increment retry count for a target
   */
  async incrementRetryCount(targetId: string): Promise<boolean> {
    try {
      const result = await EmailTargetModel.updateOne(
        { id: targetId },
        { 
          $inc: { retryCount: 1 },
          updatedAt: new Date()
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error incrementing retry count:', error);
      throw error;
    }
  }

  /**
   * Get targets by status for processing
   */
  async getTargetsByStatus(
    status: EmailTargetStatus, 
    limit: number = 50
  ): Promise<EmailTarget[]> {
    try {
      const targets = await EmailTargetModel.find({ status })
        .sort({ createdAt: 1 })
        .limit(limit);

      return targets.map(target => ({
        id: target.id,
        jobId: target.jobId,
        email: target.email,
        status: target.status,
        providerId: target.providerId,
        sentAt: target.sentAt,
        failureReason: target.failureReason,
        retryCount: target.retryCount,
        createdAt: target.createdAt,
        updatedAt: target.updatedAt
      }));

    } catch (error) {
      console.error('Error getting targets by status:', error);
      throw error;
    }
  }

  /**
   * Get target statistics for a job
   */
  async getJobTargetStats(jobId: string): Promise<{
    total: number;
    pending: number;
    sent: number;
    failed: number;
    blocked: number;
  }> {
    try {
      const targets = await EmailTargetModel.find({ jobId });
      
      return {
        total: targets.length,
        pending: targets.filter(t => t.status === EmailTargetStatus.PENDING).length,
        sent: targets.filter(t => t.status === EmailTargetStatus.SENT).length,
        failed: targets.filter(t => t.status === EmailTargetStatus.FAILED).length,
        blocked: targets.filter(t => t.status === EmailTargetStatus.BLOCKED).length
      };

    } catch (error) {
      console.error('Error getting job target stats:', error);
      throw error;
    }
  }
}

export const emailTargetService = new EmailTargetService();
