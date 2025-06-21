import mongoose, { Schema, Document } from 'mongoose';
import type { User } from '../types';
import { UserRole } from '../types/enums';

interface UserDocument extends Omit<User, 'id'>, Document {
  id: string;
}

const userSchema = new Schema<UserDocument>({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String,
    trim: true
  },
  googleId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.USER,
    index: true
  },
  lastLoginAt: {
    type: Date,
    index: true
  },
  settings: {
    defaultSender: {
      name: String,
      email: String
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  }
}, {
  timestamps: true,
  collection: 'users'
});

// Indexes for common queries
userSchema.index({ isActive: 1, role: 1 });
userSchema.index({ lastLoginAt: -1 });

export const UserModel = mongoose.model<UserDocument>('User', userSchema);
