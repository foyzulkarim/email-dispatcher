import mongoose, { Schema, Document } from 'mongoose';
import { EmailProvider, EmailProviderConfig } from '../types';

export interface EmailProviderDocument extends Omit<EmailProvider, 'id'>, Document {
  id: string;
  apiSecret?: string; // For providers like Mailjet that need public/private keys
  config: EmailProviderConfig;
}

const emailProviderSchema = new Schema<EmailProviderDocument>({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['brevo', 'mailerlite', 'sendgrid', 'mailgun', 'postmark', 'mailjet', 'ses', 'custom'],
    required: true
  },
  apiKey: {
    type: String,
    required: true
  },
  apiSecret: {
    type: String,
    required: false // Only needed for some providers like Mailjet
  },
  dailyQuota: {
    type: Number,
    required: true,
    min: 0
  },
  usedToday: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastResetDate: {
    type: Date,
    default: Date.now
  },
  config: {
    endpoint: {
      type: String,
      required: true
    },
    method: {
      type: String,
      enum: ['POST', 'PUT', 'PATCH'],
      default: 'POST'
    },
    headers: {
      type: Schema.Types.Mixed,
      required: true
    },
    payloadTemplate: {
      type: Schema.Types.Mixed,
      required: true
    },
    authentication: {
      type: {
        type: String,
        enum: ['api-key', 'bearer', 'basic', 'custom'],
        required: true
      },
      headerName: String,
      prefix: String,
      customHeaders: Schema.Types.Mixed
    },
    fieldMappings: {
      sender: { type: String, required: true },
      recipients: { type: String, required: true },
      subject: { type: String, required: true },
      htmlContent: { type: String, required: true },
      textContent: String,
      cc: String,
      bcc: String,
      attachments: String
    },
    responseMapping: {
      successField: String,
      messageIdField: String,
      errorField: String
    }
  }
}, {
  timestamps: true,
  collection: 'email_providers'
});

// Index for finding active providers with available quota
emailProviderSchema.index({ isActive: 1, usedToday: 1, dailyQuota: 1 });

export const EmailProviderModel = mongoose.model<EmailProviderDocument>('EmailProvider', emailProviderSchema);

