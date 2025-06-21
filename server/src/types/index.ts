// Core business types for the email dispatcher system
import { 
  PlatformType, 
  AuthType, 
  HttpMethod, 
  EmailJobStatus, 
  EmailTargetStatus, 
  WebhookEventType, 
  SuppressionReason, 
  UserRole 
} from './enums';

export interface Platform {
  id: string;
  name: string;
  type: PlatformType;
  displayName: string;
  description?: string;
  documentationUrl?: string;
  isActive: boolean;
  authType: AuthType;
  defaultConfig: {
    endpoint: string;
    method: HttpMethod;
    headers: Record<string, any>;
    payloadTemplate: Record<string, any>;
    authentication: {
      type: 'api-key' | 'bearer' | 'basic' | 'custom';
      headerName?: string;
      prefix?: string;
      customHeaders?: Record<string, any>;
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
    responseMapping?: {
      successField?: string;
      messageIdField?: string;
      errorField?: string;
    };
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  googleId: string;
  isActive: boolean;
  role: UserRole;
  lastLoginAt?: Date;
  settings?: {
    defaultSender?: {
      name: string;
      email: string;
    };
    timezone?: string;
  };
}

export interface UserProvider {
  id: string;
  userId: string;
  platformId: string;
  name: string;
  apiKey: string;
  apiSecret?: string;
  dailyQuota: number;
  usedToday: number;
  isActive: boolean;
  lastResetDate: Date;
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

export interface EmailTemplate {
  id: string;
  userId: string;
  name: string;
  description?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables: string[];
  category?: string;
  isActive: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailJob {
  id: string;
  userId: string;
  subject: string;
  body: string;
  recipients: string[];
  status: EmailJobStatus;
  metadata: Record<string, any>;
  templateId?: string;
  templateVariables?: Record<string, any>;
  userProviderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailTarget {
  id: string;
  jobId: string;
  email: string;
  status: EmailTargetStatus;
  providerId?: string;
  sentAt?: Date;
  failureReason?: string;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookEvent {
  id: string;
  providerId: string;
  eventType: WebhookEventType;
  email: string;
  timestamp: Date;
  data: Record<string, any>;
}

export interface SuppressionEntry {
  email: string;
  reason: SuppressionReason;
  addedAt: Date;
}

// Request/Response types for API
export interface SendEmailRequest {
  templateId: string;
  recipients: string[];
  variables?: Record<string, any>;
  userProviderId?: string;
}

export interface SendEmailResponse {
  jobId: string;
  status: 'queued' | 'sent';
  message: string;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean';
  required: boolean;
  defaultValue?: any;
}

// Re-export enums for convenience
export {
  PlatformType,
  AuthType,
  HttpMethod,
  EmailJobStatus,
  EmailTargetStatus,
  WebhookEventType,
  SuppressionReason,
  UserRole,
  getAllPlatformTypes,
  isValidPlatformType,
  getPlatformDisplayName
} from './enums';
