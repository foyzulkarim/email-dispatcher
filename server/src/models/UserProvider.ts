import mongoose, { Schema, Document } from 'mongoose';
import type { UserProvider } from '../types';

interface UserProviderDocument extends Omit<UserProvider, 'id'>, Document {
  id: string;
}

const userProviderSchema = new Schema<UserProviderDocument>({
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
  platformId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
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
  customConfig: {
    endpoint: String,
    headers: Schema.Types.Mixed,
    authentication: {
      headerName: String,
      prefix: String,
      customHeaders: Schema.Types.Mixed
    }
  }
}, {
  timestamps: true,
  collection: 'user_providers'
});

// Compound indexes for better query performance
userProviderSchema.index({ userId: 1, isActive: 1 });
userProviderSchema.index({ userId: 1, platformId: 1 });
userProviderSchema.index({ isActive: 1, usedToday: 1, dailyQuota: 1 });

// Ensure unique provider names per user
userProviderSchema.index({ userId: 1, name: 1 }, { unique: true });

export const UserProviderModel = mongoose.model<UserProviderDocument>('UserProvider', userProviderSchema);
