import { FastifyInstance } from 'fastify';
import { ApiResponse } from '../types';
import { EmailJobModel } from '../models/EmailJob';
import { EmailTargetModel } from '../models/EmailTarget';
import { EmailProviderModel } from '../models/EmailProvider';
import { SuppressionModel } from '../models/Suppression';
import { WebhookEventModel } from '../models/WebhookEvent';

export default async function dashboardRoutes(fastify: FastifyInstance) {
  
  // Get dashboard statistics
  fastify.get('/stats', async (request, reply) => {
    try {
      const [
        totalJobs,
        totalTargets,
        recentJobs,
        providerStats,
        suppressionCount,
        recentEvents
      ] = await Promise.all([
        EmailJobModel.countDocuments(),
        EmailTargetModel.countDocuments(),
        EmailJobModel.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .select('id subject status createdAt recipients'),
        EmailProviderModel.find().select('-apiKey'),
        SuppressionModel.countDocuments(),
        WebhookEventModel.find()
          .sort({ timestamp: -1 })
          .limit(10)
          .select('eventType email timestamp providerId')
      ]);

      // Calculate target statistics
      const targetStats = await EmailTargetModel.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const targetStatsMap = targetStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {} as Record<string, number>);

      // Calculate job statistics
      const jobStats = await EmailJobModel.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const jobStatsMap = jobStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {} as Record<string, number>);

      // Calculate today's activity
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayStats = await EmailTargetModel.aggregate([
        {
          $match: {
            sentAt: { $gte: today }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const todayStatsMap = todayStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {} as Record<string, number>);

      const dashboardData = {
        overview: {
          totalJobs,
          totalTargets,
          suppressionCount,
          activeProviders: providerStats.filter(p => p.isActive).length
        },
        jobStats: {
          pending: jobStatsMap.pending || 0,
          processing: jobStatsMap.processing || 0,
          completed: jobStatsMap.completed || 0,
          failed: jobStatsMap.failed || 0
        },
        targetStats: {
          pending: targetStatsMap.pending || 0,
          sent: targetStatsMap.sent || 0,
          failed: targetStatsMap.failed || 0,
          blocked: targetStatsMap.blocked || 0
        },
        todayStats: {
          sent: todayStatsMap.sent || 0,
          failed: todayStatsMap.failed || 0,
          total: Object.values(todayStatsMap).reduce((sum, count) => (sum as number) + (count as number), 0)
        },
        providers: providerStats.map(provider => ({
          id: provider.id,
          name: provider.name,
          type: provider.type,
          dailyQuota: provider.dailyQuota,
          usedToday: provider.usedToday,
          remainingToday: provider.dailyQuota - provider.usedToday,
          usagePercentage: Math.round((provider.usedToday / provider.dailyQuota) * 100),
          isActive: provider.isActive
        })),
        recentJobs: recentJobs.map(job => ({
          id: job.id,
          subject: job.subject,
          status: job.status,
          recipientCount: job.recipients.length,
          createdAt: job.createdAt
        })),
        recentEvents: recentEvents.map(event => ({
          eventType: event.eventType,
          email: event.email,
          timestamp: event.timestamp,
          providerId: event.providerId
        }))
      };

      return reply.send({
        success: true,
        data: dashboardData
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error getting dashboard stats:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Get email volume chart data
  fastify.get<{ 
    Querystring: { 
      days?: string;
    } 
  }>('/chart/volume', async (request, reply) => {
    try {
      const days = parseInt(request.query.days || '7');
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      const volumeData = await EmailTargetModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              status: '$status'
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.date': 1 }
        }
      ]);

      // Transform data for chart
      const chartData: Record<string, any> = {};
      volumeData.forEach(item => {
        const date = item._id.date;
        if (!chartData[date]) {
          chartData[date] = { date, pending: 0, sent: 0, failed: 0, blocked: 0 };
        }
        chartData[date][item._id.status] = item.count;
      });

      return reply.send({
        success: true,
        data: Object.values(chartData)
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error getting volume chart data:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Get provider usage chart data
  fastify.get('/chart/providers', async (request, reply) => {
    try {
      const providers = await EmailProviderModel.find().select('-apiKey');
      
      const chartData = providers.map(provider => ({
        name: provider.name,
        used: provider.usedToday,
        remaining: provider.dailyQuota - provider.usedToday,
        quota: provider.dailyQuota,
        usagePercentage: Math.round((provider.usedToday / provider.dailyQuota) * 100)
      }));

      return reply.send({
        success: true,
        data: chartData
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error getting provider chart data:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });
}

