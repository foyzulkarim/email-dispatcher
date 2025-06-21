import mongoose, { Schema, Document } from 'mongoose';
import type { Platform } from '../types';
import { PlatformType, AuthType, HttpMethod, getAllPlatformTypes } from '../types/enums';

interface PlatformDocument extends Omit<Platform, 'id'>, Document {
  id: string;
}

const platformSchema = new Schema<PlatformDocument>({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    enum: getAllPlatformTypes(),
    required: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  documentationUrl: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  authType: {
    type: String,
    enum: Object.values(AuthType),
    required: true
  },
  defaultConfig: {
    endpoint: {
      type: String,
      required: true
    },
    method: {
      type: String,
      enum: Object.values(HttpMethod),
      default: HttpMethod.POST
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
  collection: 'platforms'
});

// Index for active platforms
platformSchema.index({ isActive: 1, type: 1 });

export const PlatformModel = mongoose.model<PlatformDocument>('Platform', platformSchema);
