import mongoose, { Schema, Document } from 'mongoose';
import type { WebhookEvent } from '../types';
import { WebhookEventType } from '../types/enums';

interface WebhookEventDocument extends Omit<WebhookEvent, 'id'>, Document {
  id: string;
}

const webhookEventSchema = new Schema<WebhookEventDocument>({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  providerId: {
    type: String,
    required: true,
    index: true
  },
  eventType: {
    type: String,
    enum: Object.values(WebhookEventType),
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  data: {
    type: Schema.Types.Mixed,
    required: true
  }
}, {
  collection: 'webhook_events'
});

// Compound indexes for better query performance
webhookEventSchema.index({ providerId: 1, timestamp: -1 });
webhookEventSchema.index({ eventType: 1, timestamp: -1 });
webhookEventSchema.index({ email: 1, timestamp: -1 });
webhookEventSchema.index({ timestamp: -1 });

export const WebhookEventModel = mongoose.model<WebhookEventDocument>('WebhookEvent', webhookEventSchema);

