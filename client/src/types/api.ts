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

// Dynamic Provider Types
export interface DynamicProvider {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  dailyQuota: number;
  remainingToday: number;
  totalSent: number;
  successRate: number;
  usedToday?: number; // API sometimes uses this instead of totalSent
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
  lastResetDate?: string; // API provides this field
  config: ProviderConfig;
}

export interface ProviderConfig {
  apiKey: string;
  apiSecret?: string;
  endpoint?: string;
  method?: string;
  headers?: Record<string, string>;
  authentication?: {
    type: 'api-key' | 'basic' | 'bearer';
    headerName?: string;
  };
  payloadTemplate?: Record<string, any>;
  fieldMappings?: Record<string, string>;
}

export interface ProviderPreset {
  type: string;
  name: string;
  description: string;
  defaultConfig: Partial<ProviderConfig>;
  requiredFields: string[];
  optionalFields: string[];
}

export interface SimpleProviderRequest {
  name: string;
  type: string;
  apiKey: string;
  apiSecret?: string;
  dailyQuota: number;
  isActive: boolean;
}

export interface AdvancedProviderRequest {
  name: string;
  type: string;
  apiKey: string;
  apiSecret?: string;
  dailyQuota: number;
  isActive: boolean;
  endpoint: string;
  method: string;
  headers?: Record<string, string>;
  authentication?: {
    type: 'api-key' | 'basic' | 'bearer';
    headerName?: string;
  };
  payloadTemplate?: Record<string, any>;
  fieldMappings?: Record<string, string>;
}

export interface TestProviderRequest extends SimpleProviderRequest {
  // Inherits from SimpleProviderRequest for testing
}

export interface TestProviderResponse {
  isValid: boolean;
  message: string;
  generatedPayload?: Record<string, any>;
  errors?: string[];
}

export interface BulkProviderRequest {
  action: 'activate' | 'deactivate' | 'delete';
  providerIds: string[];
}

export interface DynamicProviderListResponse {
  data: DynamicProvider[];
  total: number;
}

export interface DynamicProviderResponse {
  data: DynamicProvider;
  message: string;
}
