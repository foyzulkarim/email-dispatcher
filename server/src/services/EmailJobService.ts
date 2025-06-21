import { EmailJobModel } from '../models/EmailJob';
import { EmailTargetModel } from '../models/EmailTarget';
import { SuppressionModel } from '../models/Suppression';
import { templateService } from './TemplateService';
import { queueService } from './QueueService';
import type { EmailJob, EmailTarget, EmailJobRequest } from '../types';
import { EmailJobStatus, EmailTargetStatus } from '../types/enums';
import { v4 as uuidv4 } from 'uuid';

export class EmailJobService {
  
  /**
   * Create a new email job with targets
   */
  async createEmailJob(userId: string, jobRequest: EmailJobRequest): Promise<{
    jobId: string;
    totalRecipients: number;
    validRecipients: number;
    suppressedRecipients: number;
  }> {
    try {
      const { subject, body, templateId, templateVariables, recipients, metadata } = jobRequest;

      // Validate input - either direct email or template-based
      if (!recipients || recipients.length === 0) {
        throw new Error('Missing required field: recipients');
      }

      // Validate email content - either direct or template-based
      const isDirectEmail = subject && body;
      const isTemplateEmail = templateId;

      if (!isDirectEmail && !isTemplateEmail) {
        throw new Error('Either provide subject+body for direct email OR templateId for template-based email');
      }

      if (isDirectEmail && isTemplateEmail) {
        throw new Error('Cannot use both direct email (subject+body) and template-based email in the same request');
      }

      let finalSubject = subject || '';
      let finalBody = body || '';
      let processedTemplateId = templateId;
      let processedTemplateVariables = templateVariables;

      // If template-based, process the template
      if (isTemplateEmail && templateId) {
        try {
          // Process template to get subject and body
          const processedTemplate = await templateService.processTemplate(
            templateId, 
            templateVariables || {},
            undefined, // recipientEmail - will be processed per target later
            userId // Pass userId for user-aware template access
          );
          
          finalSubject = processedTemplate.subject;
          finalBody = processedTemplate.htmlContent;
          
        } catch (templateError) {
          throw new Error(`Template processing error: ${templateError instanceof Error ? templateError.message : 'Unknown error'}`);
        }
      }

      // Filter out suppressed emails
      const suppressedEmails = await SuppressionModel.find({
        email: { $in: recipients }
      }).select('email');
      
      const suppressedSet = new Set(suppressedEmails.map(s => s.email));
      const validRecipients = recipients.filter(email => !suppressedSet.has(email));

      if (validRecipients.length === 0) {
        throw new Error('All recipients are in suppression list');
      }

      // Create email job
      const jobId = uuidv4();
      const emailJob = new EmailJobModel({
        id: jobId,
        userId,
        subject: finalSubject,
        body: finalBody,
        recipients: validRecipients,
        status: EmailJobStatus.PENDING,
        metadata: metadata || {},
        templateId: processedTemplateId,
        templateVariables: processedTemplateVariables || {}
      });

      await emailJob.save();

      // Create email targets for each recipient
      const emailTargets = validRecipients.map(email => ({
        id: uuidv4(),
        jobId,
        email,
        status: EmailTargetStatus.PENDING,
        retryCount: 0
      }));

      await EmailTargetModel.insertMany(emailTargets);

      // Add job to processing queue
      try {
        await queueService.publishJob(jobId);
        console.log(`📨 Job ${jobId} added to processing queue`);
      } catch (queueError) {
        console.error('Failed to add job to queue:', queueError);
        // Job is still created, but not queued for processing
        // You might want to handle this differently in production
      }

      // Log suppressed emails
      const suppressedCount = recipients.length - validRecipients.length;
      if (suppressedCount > 0) {
        console.log(`Job ${jobId}: ${suppressedCount} recipients suppressed`);
      }

      return {
        jobId,
        totalRecipients: recipients.length,
        validRecipients: validRecipients.length,
        suppressedRecipients: suppressedCount
      };

    } catch (error) {
      console.error('Error creating email job:', error);
      throw error;
    }
  }

  /**
   * Get job by ID with detailed statistics
   */
  async getJobById(userId: string, jobId: string): Promise<any> {
    try {
      const job = await EmailJobModel.findOne({ id: jobId, userId });
      if (!job) {
        return null;
      }

      // Get target statistics
      const targets = await EmailTargetModel.find({ jobId });
      const stats = {
        total: targets.length,
        pending: targets.filter(t => t.status === EmailTargetStatus.PENDING).length,
        sent: targets.filter(t => t.status === EmailTargetStatus.SENT).length,
        failed: targets.filter(t => t.status === EmailTargetStatus.FAILED).length,
        blocked: targets.filter(t => t.status === EmailTargetStatus.BLOCKED).length
      };

      return {
        id: job.id,
        subject: job.subject,
        status: job.status,
        recipientCount: targets.length,
        processedCount: stats.sent + stats.failed + stats.blocked,
        successCount: stats.sent,
        failedCount: stats.failed + stats.blocked,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        completedAt: job.status === EmailJobStatus.COMPLETED ? job.updatedAt : undefined,
        metadata: job.metadata || {},
        templateId: job.templateId,
        templateVariables: job.templateVariables,
        stats
      };

    } catch (error) {
      console.error('Error getting job by ID:', error);
      throw error;
    }
  }

  /**
   * Get jobs for a user with pagination and filtering
   */
  async getUserJobs(userId: string, options: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}): Promise<{
    jobs: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 10;
      const status = options.status;

      const filter: any = { userId };
      if (status && status !== 'all') {
        filter.status = status;
      }

      const skip = (page - 1) * limit;
      
      const [jobs, total] = await Promise.all([
        EmailJobModel.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        EmailJobModel.countDocuments(filter)
      ]);

      // Get detailed stats for each job
      const jobsWithStats = await Promise.all(
        jobs.map(async (job) => {
          const targets = await EmailTargetModel.find({ jobId: job.id });
          const stats = {
            total: targets.length,
            pending: targets.filter(t => t.status === EmailTargetStatus.PENDING).length,
            sent: targets.filter(t => t.status === EmailTargetStatus.SENT).length,
            failed: targets.filter(t => t.status === EmailTargetStatus.FAILED).length,
            blocked: targets.filter(t => t.status === EmailTargetStatus.BLOCKED).length
          };

          return {
            id: job.id,
            subject: job.subject,
            status: job.status,
            recipientCount: targets.length,
            processedCount: stats.sent + stats.failed + stats.blocked,
            successCount: stats.sent,
            failedCount: stats.failed + stats.blocked,
            createdAt: job.createdAt,
            updatedAt: job.updatedAt,
            completedAt: job.status === EmailJobStatus.COMPLETED ? job.updatedAt : undefined,
            metadata: job.metadata || {},
            templateId: job.templateId
          };
        })
      );

      return {
        jobs: jobsWithStats,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      console.error('Error getting user jobs:', error);
      throw error;
    }
  }

  /**
   * Get job targets (individual email statuses)
   */
  async getJobTargets(userId: string, jobId: string): Promise<EmailTarget[]> {
    try {
      // Check if job exists and belongs to user
      const job = await EmailJobModel.findOne({ id: jobId, userId });
      if (!job) {
        throw new Error('Job not found');
      }

      // Get all targets for this job
      const targets = await EmailTargetModel.find({ jobId }).sort({ createdAt: -1 });

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
      console.error('Error getting job targets:', error);
      throw error;
    }
  }

  /**
   * Cancel a pending job
   */
  async cancelJob(userId: string, jobId: string): Promise<boolean> {
    try {
      const job = await EmailJobModel.findOne({ 
        id: jobId, 
        userId, 
        status: EmailJobStatus.PENDING 
      });

      if (!job) {
        return false;
      }

      // Update job status
      await EmailJobModel.updateOne(
        { id: jobId },
        { 
          status: EmailJobStatus.FAILED,
          updatedAt: new Date()
        }
      );

      // Update all pending targets
      await EmailTargetModel.updateMany(
        { jobId, status: EmailTargetStatus.PENDING },
        { 
          status: EmailTargetStatus.FAILED,
          failureReason: 'Job cancelled by user',
          updatedAt: new Date()
        }
      );

      console.log(`Job ${jobId} cancelled by user ${userId}`);
      return true;

    } catch (error) {
      console.error('Error cancelling job:', error);
      throw error;
    }
  }

  /**
   * Get job statistics for a user
   */
  async getUserJobStats(userId: string): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    totalEmailsSent: number;
    totalEmailsFailed: number;
  }> {
    try {
      const jobs = await EmailJobModel.find({ userId });
      
      const stats = {
        total: jobs.length,
        pending: jobs.filter(j => j.status === EmailJobStatus.PENDING).length,
        processing: jobs.filter(j => j.status === EmailJobStatus.PROCESSING).length,
        completed: jobs.filter(j => j.status === EmailJobStatus.COMPLETED).length,
        failed: jobs.filter(j => j.status === EmailJobStatus.FAILED).length,
        totalEmailsSent: 0,
        totalEmailsFailed: 0
      };

      // Get email target statistics
      const jobIds = jobs.map(j => j.id);
      if (jobIds.length > 0) {
        const targets = await EmailTargetModel.find({ jobId: { $in: jobIds } });
        stats.totalEmailsSent = targets.filter(t => t.status === EmailTargetStatus.SENT).length;
        stats.totalEmailsFailed = targets.filter(t => 
          t.status === EmailTargetStatus.FAILED || t.status === EmailTargetStatus.BLOCKED
        ).length;
      }

      return stats;

    } catch (error) {
      console.error('Error getting user job stats:', error);
      throw error;
    }
  }

  /**
   * Retry failed targets in a job
   */
  async retryFailedTargets(userId: string, jobId: string): Promise<{
    retriedCount: number;
  }> {
    try {
      // Check if job exists and belongs to user
      const job = await EmailJobModel.findOne({ id: jobId, userId });
      if (!job) {
        throw new Error('Job not found');
      }

      // Reset failed targets to pending (with retry limit)
      const result = await EmailTargetModel.updateMany(
        { 
          jobId, 
          status: EmailTargetStatus.FAILED,
          retryCount: { $lt: 3 } // Max 3 retries
        },
        { 
          status: EmailTargetStatus.PENDING,
          failureReason: undefined,
          updatedAt: new Date()
        }
      );

      // If we have targets to retry, update job status back to pending
      if (result.modifiedCount > 0) {
        await EmailJobModel.updateOne(
          { id: jobId },
          { 
            status: EmailJobStatus.PENDING,
            updatedAt: new Date()
          }
        );

        // Re-queue the job
        try {
          await queueService.publishJob(jobId);
          console.log(`📨 Job ${jobId} re-queued for retry`);
        } catch (queueError) {
          console.error('Failed to re-queue job:', queueError);
        }
      }

      return {
        retriedCount: result.modifiedCount
      };

    } catch (error) {
      console.error('Error retrying failed targets:', error);
      throw error;
    }
  }
}

export const emailJobService = new EmailJobService();
