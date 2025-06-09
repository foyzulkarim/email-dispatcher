import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { EmailJobRequest, ApiResponse } from '../types';
import { EmailJobModel } from '../models/EmailJob';
import { EmailTargetModel } from '../models/EmailTarget';
import { SuppressionModel } from '../models/Suppression';

export default async function emailRoutes(fastify: FastifyInstance) {
  
  // Submit new email job
  fastify.post<{ Body: EmailJobRequest }>('/submit', async (request, reply) => {
    try {
      const { subject, body, recipients, metadata } = request.body;

      // Validate input
      if (!subject || !body || !recipients || recipients.length === 0) {
        return reply.code(400).send({
          success: false,
          error: 'Missing required fields: subject, body, and recipients'
        } as ApiResponse);
      }

      // Filter out suppressed emails
      const suppressedEmails = await SuppressionModel.find({
        email: { $in: recipients }
      }).select('email');
      
      const suppressedSet = new Set(suppressedEmails.map(s => s.email));
      const validRecipients = recipients.filter(email => !suppressedSet.has(email));

      if (validRecipients.length === 0) {
        return reply.code(400).send({
          success: false,
          error: 'All recipients are in suppression list'
        } as ApiResponse);
      }

      // Create email job
      const jobId = uuidv4();
      const emailJob = new EmailJobModel({
        id: jobId,
        subject,
        body,
        recipients: validRecipients,
        status: 'pending',
        metadata: metadata || {}
      });

      await emailJob.save();

      // Create email targets for each recipient
      const emailTargets = validRecipients.map(email => ({
        id: uuidv4(),
        jobId,
        email,
        status: 'pending' as const,
        retryCount: 0
      }));

      await EmailTargetModel.insertMany(emailTargets);

      // Log suppressed emails
      const suppressedCount = recipients.length - validRecipients.length;
      if (suppressedCount > 0) {
        fastify.log.info(`Job ${jobId}: ${suppressedCount} recipients suppressed`);
      }

      return reply.send({
        success: true,
        data: {
          jobId,
          totalRecipients: recipients.length,
          validRecipients: validRecipients.length,
          suppressedRecipients: suppressedCount
        },
        message: 'Email job submitted successfully'
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error submitting email job:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Get job status
  fastify.get<{ Params: { jobId: string } }>('/job/:jobId', async (request, reply) => {
    try {
      const { jobId } = request.params;

      const job = await EmailJobModel.findOne({ id: jobId });
      if (!job) {
        return reply.code(404).send({
          success: false,
          error: 'Job not found'
        } as ApiResponse);
      }

      // Get target statistics
      const targets = await EmailTargetModel.find({ jobId });
      const stats = {
        total: targets.length,
        pending: targets.filter(t => t.status === 'pending').length,
        sent: targets.filter(t => t.status === 'sent').length,
        failed: targets.filter(t => t.status === 'failed').length,
        blocked: targets.filter(t => t.status === 'blocked').length
      };

      return reply.send({
        success: true,
        data: {
          job: {
            id: job.id,
            subject: job.subject,
            status: job.status,
            createdAt: job.createdAt,
            updatedAt: job.updatedAt
          },
          stats
        }
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error getting job status:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Get all jobs with pagination
  fastify.get<{ 
    Querystring: { 
      page?: string; 
      limit?: string; 
      status?: string; 
    } 
  }>('/jobs', async (request, reply) => {
    try {
      const page = parseInt(request.query.page || '1');
      const limit = parseInt(request.query.limit || '10');
      const status = request.query.status;

      const filter: any = {};
      if (status) {
        filter.status = status;
      }

      const skip = (page - 1) * limit;
      
      const [jobs, total] = await Promise.all([
        EmailJobModel.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .select('id subject status createdAt updatedAt recipients'),
        EmailJobModel.countDocuments(filter)
      ]);

      return reply.send({
        success: true,
        data: {
          jobs: jobs.map(job => ({
            id: job.id,
            subject: job.subject,
            status: job.status,
            recipientCount: job.recipients.length,
            createdAt: job.createdAt,
            updatedAt: job.updatedAt
          })),
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error getting jobs:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });
}

