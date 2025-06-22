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
  userId: string;
  subject: string;
  body: string;
  recipients: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  metadata: Record<string, any>;
  templateId?: string;
  templateVariables?: Record<string, any>;
  userProviderId?: string;
  createdAt: string;
  updatedAt: string;
  // Calculated fields for UI
  recipientCount?: number;
  processedCount?: number;
  successCount?: number;
  failedCount?: number;
  completedAt?: string;
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
  templateId?: string;
  templateVariables?: Record<string, any>;
  userProviderId?: string;
  metadata?: Record<string, any>;
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

// Dynamic Provider Types (UserProvider from server)
export interface DynamicProvider {
  id: string;
  userId: string;
  platformId: string;
  name: string;
  type: string;
  apiKey: string;
  apiSecret?: string;
  isActive: boolean;
  dailyQuota: number;
  usedToday: number;
  remainingToday?: number; // calculated field
  totalSent?: number; // calculated field
  successRate?: number; // calculated field
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
  lastResetDate: string;
  customConfig?: {
    endpoint?: string;
    headers?: Record<string, any>;
    authentication?: {
      headerName?: string;
      prefix?: string;
      customHeaders?: Record<string, any>;
    };
  };
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
  payloadTemplate?: Record<string, unknown>;
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
  platformId: string;
  apiKey: string;
  apiSecret?: string;
  dailyQuota: number;
  isActive: boolean;
}

export interface AdvancedProviderRequest {
  name: string;
  platformId: string;
  apiKey: string;
  apiSecret?: string;
  dailyQuota: number;
  isActive: boolean;
  customConfig?: {
    endpoint?: string;
    headers?: Record<string, any>;
    authentication?: {
      headerName?: string;
      prefix?: string;
      customHeaders?: Record<string, any>;
    };
  };
}

export type TestProviderRequest = SimpleProviderRequest;

export interface TestProviderResponse {
  isValid: boolean;
  message: string;
  generatedPayload?: Record<string, unknown>;
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
