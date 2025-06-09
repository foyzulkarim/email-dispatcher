export interface EmailJob {
  id: string;
  subject: string;
  body: string;
  recipients: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface EmailTarget {
  id: string;
  jobId: string;
  email: string;
  status: 'pending' | 'sent' | 'failed' | 'blocked';
  providerId?: string;
  sentAt?: Date;
  failureReason?: string;
  retryCount: number;
}

export interface EmailProvider {
  id: string;
  name: string;
  type: 'brevo' | 'mailerlite';
  apiKey: string;
  dailyQuota: number;
  usedToday: number;
  isActive: boolean;
  lastResetDate: Date;
}

export interface SuppressionEntry {
  email: string;
  reason: 'bounce' | 'complaint' | 'manual';
  addedAt: Date;
}

export interface WebhookEvent {
  id: string;
  providerId: string;
  eventType: 'delivered' | 'bounced' | 'opened' | 'clicked' | 'complained';
  email: string;
  timestamp: Date;
  data: Record<string, any>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface EmailJobRequest {
  subject: string;
  body: string;
  recipients: string[];
  metadata?: Record<string, any>;
}

