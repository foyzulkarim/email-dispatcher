export interface EmailJob {
  id: string;
  subject: string;
  body: string;
  recipients: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
  templateId?: string;
  templateVariables?: Record<string, any>;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailProvider {
  id: string;
  name: string;
  type: 'brevo' | 'mailerlite' | 'sendgrid' | 'mailgun' | 'postmark' | 'mailjet' | 'ses' | 'custom';
  apiKey: string;
  apiSecret?: string;
  dailyQuota: number;
  usedToday: number;
  isActive: boolean;
  lastResetDate: Date;
  config: EmailProviderConfig;
}

export interface ProviderConfig {
  baseUrl: string;
  endpoints: {
    send: string;
    webhook?: string;
  };
  authentication: {
    type: 'api_key' | 'bearer' | 'basic' | 'custom';
    headerName?: string;
    headerPrefix?: string;
    queryParam?: string;
  };
  requestFormat: {
    method: 'POST' | 'PUT';
    contentType: 'application/json' | 'application/x-www-form-urlencoded';
    bodyTemplate: string;
  };
  responseFormat: {
    successField?: string;
    messageIdField?: string;
    errorField?: string;
  };
  rateLimit?: {
    requestsPerSecond: number;
    burstLimit: number;
  };
}

export interface EmailSendRequest {
  to: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  fromEmail?: string;
  fromName?: string;
  metadata?: Record<string, any>;
}

export interface ProviderResponse {
  success: boolean;
  messageId?: string;
  statusCode?: number;
  error?: string;
  rawResponse?: any;
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

export interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables: string[];
  category?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'url';
  required: boolean;
  description?: string;
  defaultValue?: any;
}

export interface ProcessedTemplate {
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface EmailJobRequest {
  subject?: string;
  body?: string;
  templateId?: string;
  templateVariables?: Record<string, any>;
  recipients: string[];
  metadata?: Record<string, any>;
}

export interface TemplateRequest {
  name: string;
  description?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables: string[];
  category?: string;
  isActive?: boolean;
}

// New dynamic provider interfaces
export interface EmailProviderConfig {
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH';
  headers: Record<string, string>;
  payloadTemplate: Record<string, any> | string;
  authentication: {
    type: 'api-key' | 'bearer' | 'basic' | 'custom';
    headerName?: string;
    prefix?: string;
    customHeaders?: Record<string, string>;
  };
  fieldMappings: {
    sender: string;
    recipients: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
    cc?: string;
    bcc?: string;
    attachments?: string;
  };
  responseMapping: {
    successField?: string;
    messageIdField?: string;
    errorField?: string;
  };
}

export interface EmailData {
  sender: {
    email: string;
    name?: string;
  };
  recipients: Array<{
    email: string;
    name?: string;
  }>;
  cc?: Array<{
    email: string;
    name?: string;
  }>;
  bcc?: Array<{
    email: string;
    name?: string;
  }>;
  subject: string;
  htmlContent?: string;
  textContent?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    type: string;
  }>;
}

// UI Payload structures for provider configuration
export interface SimpleProviderConfigPayload {
  name: string;
  type: 'brevo' | 'sendgrid' | 'mailjet' | 'mailgun' | 'postmark' | 'ses' | 'custom';
  dailyQuota: number;
  isActive: boolean;
  apiKey: string;
  apiSecret?: string;
  customEndpoint?: string;
  customHeaders?: Record<string, string>;
}

export interface AdvancedProviderConfigPayload {
  name: string;
  type: 'custom';
  dailyQuota: number;
  isActive: boolean;
  apiKey: string;
  apiSecret?: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH';
  headers: Record<string, string>;
  authentication: {
    type: 'api-key' | 'bearer' | 'basic' | 'custom';
    headerName?: string;
    prefix?: string;
    customHeaders?: Record<string, string>;
  };
  payloadTemplate: Record<string, any> | string;
  fieldMappings?: {
    sender: string;
    recipients: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
    cc?: string;
    bcc?: string;
  };
}

