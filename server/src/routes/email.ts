import { FastifyInstance } from 'fastify';
import { EmailJobRequest, ApiResponse } from '../types';
import { emailJobService } from '../services/EmailJobService';
import { authenticateUser, requireOwnership } from '../middleware/auth';

export default async function emailRoutes(fastify: FastifyInstance) {
  
  // Submit new email job
  fastify.post<{ 
    Params: { userId: string };
    Body: EmailJobRequest;
  }>('/:userId/submit', {
    preHandler: requireOwnership()
  }, async (request, reply) => {
    try {
      const { userId } = request.params;
      const jobRequest = request.body;

      const result = await emailJobService.createEmailJob(userId, jobRequest);

      return reply.send({
        success: true,
        data: result,
        message: 'Email job submitted successfully'
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error submitting email job:', error);
      
      if (error instanceof Error) {
        // Handle specific validation errors
        if (error.message.includes('Missing required field') || 
            error.message.includes('Either provide') ||
            error.message.includes('Cannot use both') ||
            error.message.includes('All recipients are in suppression') ||
            error.message.includes('Template processing error')) {
          return reply.code(400).send({
            success: false,
            error: error.message
          } as ApiResponse);
        }
      }

      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Get job status
  fastify.get<{ 
    Params: { userId: string; jobId: string };
  }>('/:userId/job/:jobId', {
    preHandler: requireOwnership()
  }, async (request, reply) => {
    try {
      const { userId, jobId } = request.params;

      const job = await emailJobService.getJobById(userId, jobId);
      
      if (!job) {
        return reply.code(404).send({
          success: false,
          error: 'Job not found'
        } as ApiResponse);
      }

      return reply.send({
        success: true,
        data: job
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error getting job status:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Get user jobs with pagination
  fastify.get<{ 
    Params: { userId: string };
    Querystring: { 
      page?: string; 
      limit?: string; 
      status?: string; 
    };
  }>('/:userId/jobs', {
    preHandler: requireOwnership()
  }, async (request, reply) => {
    try {
      const { userId } = request.params;
      const { page, limit, status } = request.query;

      const result = await emailJobService.getUserJobs(userId, {
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        status
      });

      return reply.send({
        success: true,
        data: result
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error getting user jobs:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Get job targets (individual email statuses)
  fastify.get<{ 
    Params: { userId: string; jobId: string };
  }>('/:userId/job/:jobId/targets', {
    preHandler: requireOwnership()
  }, async (request, reply) => {
    try {
      const { userId, jobId } = request.params;

      const targets = await emailJobService.getJobTargets(userId, jobId);

      return reply.send({
        success: true,
        data: targets
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error getting job targets:', error);
      
      if (error instanceof Error && error.message === 'Job not found') {
        return reply.code(404).send({
          success: false,
          error: 'Job not found'
        } as ApiResponse);
      }

      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Cancel a job
  fastify.post<{ 
    Params: { userId: string; jobId: string };
  }>('/:userId/job/:jobId/cancel', async (request, reply) => {
    try {
      const { userId, jobId } = request.params;

      const cancelled = await emailJobService.cancelJob(userId, jobId);

      if (!cancelled) {
        return reply.code(404).send({
          success: false,
          error: 'Job not found or cannot be cancelled'
        } as ApiResponse);
      }

      return reply.send({
        success: true,
        message: 'Job cancelled successfully'
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error cancelling job:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Retry failed targets in a job
  fastify.post<{ 
    Params: { userId: string; jobId: string };
  }>('/:userId/job/:jobId/retry', async (request, reply) => {
    try {
      const { userId, jobId } = request.params;

      const result = await emailJobService.retryFailedTargets(userId, jobId);

      return reply.send({
        success: true,
        data: result,
        message: `${result.retriedCount} targets queued for retry`
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error retrying failed targets:', error);
      
      if (error instanceof Error && error.message === 'Job not found') {
        return reply.code(404).send({
          success: false,
          error: 'Job not found'
        } as ApiResponse);
      }

      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Get user job statistics
  fastify.get<{ 
    Params: { userId: string };
  }>('/:userId/stats', {
    preHandler: requireOwnership()
  }, async (request, reply) => {
    try {
      const { userId } = request.params;

      const stats = await emailJobService.getUserJobStats(userId);

      return reply.send({
        success: true,
        data: stats
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error getting user job stats:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });
}

