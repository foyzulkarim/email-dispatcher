import mongoose, { Schema, Document } from 'mongoose';
import { SuppressionEntry } from '../types';

interface SuppressionDocument extends SuppressionEntry, Document {}

const suppressionSchema = new Schema<SuppressionDocument>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  reason: {
    type: String,
    enum: ['bounce', 'complaint', 'manual'],
    required: true,
    index: true
  },
  addedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  collection: 'suppression_list'
});

// Index for fast email lookups during job submission
suppressionSchema.index({ email: 1 });
suppressionSchema.index({ reason: 1, addedAt: -1 });

export const SuppressionModel = mongoose.model<SuppressionDocument>('Suppression', suppressionSchema);

