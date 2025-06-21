import { FastifyInstance } from 'fastify';
import { ApiResponse } from '../../types';
import { WebhookEventModel } from './WebhookEvent';
import { EmailTargetModel } from '../email-target/EmailTarget';
import { SuppressionModel } from '../suppression/Suppression';

export default async function webhookRoutes(fastify: FastifyInstance) {
  
  // Brevo webhook handler
  fastify.post('/brevo', async (request, reply) => {
    try {
      const events = Array.isArray(request.body) ? request.body : [request.body];
      
      for (const event of events) {
        await processWebhookEvent('brevo', event);
      }

      return reply.send({
        success: true,
        message: 'Webhook processed successfully'
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error processing Brevo webhook:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // MailerLite webhook handler
  fastify.post('/mailerlite', async (request, reply) => {
    try {
      const event = request.body;
      await processWebhookEvent('mailerlite', event);

      return reply.send({
        success: true,
        message: 'Webhook processed successfully'
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error processing MailerLite webhook:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Get webhook events with pagination
  fastify.get<{ 
    Querystring: { 
      page?: string; 
      limit?: string; 
      eventType?: string;
      providerId?: string;
    } 
  }>('/events', async (request, reply) => {
    try {
      const page = parseInt(request.query.page || '1');
      const limit = parseInt(request.query.limit || '20');
      const eventType = request.query.eventType;
      const providerId = request.query.providerId;

      const filter: any = {};
      if (eventType) filter.eventType = eventType;
      if (providerId) filter.providerId = providerId;

      const skip = (page - 1) * limit;
      
      const [events, total] = await Promise.all([
        WebhookEventModel.find(filter)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit),
        WebhookEventModel.countDocuments(filter)
      ]);

      return reply.send({
        success: true,
        data: {
          events,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error getting webhook events:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });
}

async function processWebhookEvent(providerId: string, eventData: any) {
  try {
    // Extract common fields based on provider
    let email: string;
    let eventType: string;
    let timestamp: Date;

    if (providerId === 'brevo') {
      email = eventData.email;
      eventType = mapBrevoEventType(eventData.event);
      timestamp = new Date(eventData.ts * 1000); // Brevo uses Unix timestamp
    } else if (providerId === 'mailerlite') {
      email = eventData.data?.subscriber?.email;
      eventType = mapMailerLiteEventType(eventData.type);
      timestamp = new Date(eventData.created_at);
    } else {
      throw new Error(`Unknown provider: ${providerId}`);
    }

    if (!email || !eventType) {
      console.warn(`Invalid webhook event data for ${providerId}:`, eventData);
      return;
    }

    // Save webhook event
    const webhookEvent = new WebhookEventModel({
      id: `${providerId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      providerId,
      eventType,
      email,
      timestamp,
      data: eventData
    });

    await webhookEvent.save();

    // Update email target status if applicable
    if (eventType === 'delivered') {
      await EmailTargetModel.updateMany(
        { email, status: 'sent' },
        { status: 'sent' } // Keep as sent, but we know it was delivered
      );
    } else if (eventType === 'bounced') {
      // Mark as failed and add to suppression list
      await EmailTargetModel.updateMany(
        { email, status: 'sent' },
        { 
          status: 'failed',
          failureReason: 'bounced'
        }
      );

      // Add to suppression list
      await SuppressionModel.findOneAndUpdate(
        { email },
        { 
          email,
          reason: 'bounce',
          addedAt: new Date()
        },
        { upsert: true }
      );
    }

    console.log(`Processed ${eventType} event for ${email} from ${providerId}`);

  } catch (error) {
    console.error('Error processing webhook event:', error);
    throw error;
  }
}

function mapBrevoEventType(brevoEvent: string): string {
  const mapping: Record<string, string> = {
    'delivered': 'delivered',
    'hard_bounce': 'bounced',
    'soft_bounce': 'bounced',
    'spam': 'complained',
    'opened': 'opened',
    'click': 'clicked'
  };
  return mapping[brevoEvent] || brevoEvent;
}

function mapMailerLiteEventType(mailerLiteEvent: string): string {
  const mapping: Record<string, string> = {
    'subscriber.bounced': 'bounced',
    'subscriber.complained': 'complained',
    'campaign.sent': 'delivered',
    'campaign.opened': 'opened',
    'campaign.clicked': 'clicked'
  };
  return mapping[mailerLiteEvent] || mailerLiteEvent;
}

