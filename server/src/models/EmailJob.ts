import mongoose, { Schema, Document } from 'mongoose';
import type { EmailJob } from '../types';
import { EmailJobStatus } from '../types/enums';

interface EmailJobDocument extends Omit<EmailJob, 'id'>, Document {
  id: string;
}

const emailJobSchema = new Schema<EmailJobDocument>({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  body: {
    type: String,
    required: true
  },
  recipients: [{
    type: String,
    required: true,
    lowercase: true,
    trim: true
  }],
  status: {
    type: String,
    enum: Object.values(EmailJobStatus),
    default: EmailJobStatus.PENDING,
    index: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  // Template-related fields
  templateId: {
    type: String,
    index: true
  },
  templateVariables: {
    type: Schema.Types.Mixed,
    default: {}
  },
  // Provider selection
  userProviderId: {
    type: String,
    index: true
  }
}, {
  timestamps: true,
  collection: 'email_jobs'
});

// Indexes for better query performance
emailJobSchema.index({ userId: 1, createdAt: -1 });
emailJobSchema.index({ userId: 1, status: 1, createdAt: -1 });
emailJobSchema.index({ templateId: 1, createdAt: -1 });
emailJobSchema.index({ userProviderId: 1, createdAt: -1 });

export const EmailJobModel = mongoose.model<EmailJobDocument>('EmailJob', emailJobSchema);

