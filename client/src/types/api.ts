
export interface DashboardStats {
  totalJobs: number;
  totalEmails: number;
  suppressedEmails: number;
  activeProviders: number;
  jobStatusBreakdown: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
  emailStatusBreakdown: {
    pending: number;
    sent: number;
    failed: number;
    blocked: number;
  };
  todayActivity: {
    sent: number;
    failed: number;
    total: number;
    successRate: number;
  };
}

export interface EmailJob {
  id: string;
  subject: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  recipientCount: number;
  processedCount: number;
  successCount: number;
  failedCount: number;
  createdAt: string;
  completedAt?: string;
  metadata?: Record<string, string>;
}

export interface EmailProvider {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'error';
  enabled: boolean;
  quotaUsed: number;
  quotaTotal: number;
  emailsSentToday: number;
  successRate: number;
  lastActivity: string;
}

export interface SubmitEmailRequest {
  subject: string;
  body: string;
  recipients: string[];
  metadata?: Record<string, string>;
}

export interface SuppressionEntry {
  id: string;
  email: string;
  reason: 'bounce' | 'complaint' | 'manual' | 'unsubscribe';
  dateAdded: string;
  source: string;
  notes?: string;
}

export interface ChartData {
  date: string;
  sent: number;
  failed: number;
  total: number;
}
