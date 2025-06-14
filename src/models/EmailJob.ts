import mongoose, { Schema, Document } from 'mongoose';
import { EmailJob } from '../types';

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
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
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
  }
}, {
  timestamps: true,
  collection: 'email_jobs'
});

// Indexes for better query performance
emailJobSchema.index({ createdAt: -1 });
emailJobSchema.index({ status: 1, createdAt: -1 });
emailJobSchema.index({ templateId: 1, createdAt: -1 });

export const EmailJobModel = mongoose.model<EmailJobDocument>('EmailJob', emailJobSchema);

