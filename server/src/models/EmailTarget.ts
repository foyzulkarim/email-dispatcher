import mongoose, { Schema, Document } from 'mongoose';
import type { EmailTarget } from '../types';
import { EmailTargetStatus } from '../types/enums';

interface EmailTargetDocument extends Omit<EmailTarget, 'id' | 'createdAt' | 'updatedAt'>, Document {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

const emailTargetSchema = new Schema<EmailTargetDocument>({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  jobId: {
    type: String,
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
  status: {
    type: String,
    enum: Object.values(EmailTargetStatus),
    default: EmailTargetStatus.PENDING,
    index: true
  },
  providerId: {
    type: String,
    index: true
  },
  sentAt: {
    type: Date,
    index: true
  },
  failureReason: {
    type: String,
    trim: true
  },
  retryCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  collection: 'email_targets'
});

// Compound indexes for better query performance
emailTargetSchema.index({ jobId: 1, status: 1 });
emailTargetSchema.index({ status: 1, createdAt: 1 });
emailTargetSchema.index({ email: 1, status: 1 });
emailTargetSchema.index({ sentAt: -1 });

// Index for worker queries (finding pending emails to send)
emailTargetSchema.index({ status: 1, retryCount: 1, createdAt: 1 });

export const EmailTargetModel = mongoose.model<EmailTargetDocument>('EmailTarget', emailTargetSchema);

