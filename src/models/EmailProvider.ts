import mongoose, { Schema, Document } from 'mongoose';
import { EmailProvider } from '../types';

interface EmailProviderDocument extends Omit<EmailProvider, 'id'>, Document {
  id: string;
}

const emailProviderSchema = new Schema<EmailProviderDocument>({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['brevo', 'mailerlite'],
    required: true
  },
  apiKey: {
    type: String,
    required: true
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
  }
}, {
  timestamps: true,
  collection: 'email_providers'
});

// Index for finding active providers with available quota
emailProviderSchema.index({ isActive: 1, usedToday: 1, dailyQuota: 1 });

export const EmailProviderModel = mongoose.model<EmailProviderDocument>('EmailProvider', emailProviderSchema);

