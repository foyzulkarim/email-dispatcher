import mongoose, { Schema, Document } from 'mongoose';
import type { EmailTemplate } from '../types';

interface EmailTemplateDocument extends Omit<EmailTemplate, 'id'>, Document {
  id: string;
}

const emailTemplateSchema = new Schema<EmailTemplateDocument>({
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
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  htmlContent: {
    type: String,
    required: true
  },
  textContent: {
    type: String
  },
  variables: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    trim: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  createdBy: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'email_templates'
});

// Indexes for better query performance
emailTemplateSchema.index({ userId: 1, isActive: 1 });
emailTemplateSchema.index({ userId: 1, category: 1, isActive: 1 });
emailTemplateSchema.index({ createdAt: -1 });

// Ensure unique name per user within active templates
emailTemplateSchema.index({ userId: 1, name: 1, isActive: 1 }, { 
  unique: true, 
  partialFilterExpression: { isActive: true } 
});

export const EmailTemplateModel = mongoose.model<EmailTemplateDocument>('EmailTemplate', emailTemplateSchema);
