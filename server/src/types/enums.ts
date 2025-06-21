// Centralized enums for the email dispatcher system

/**
 * Supported email platform types
 * These represent the different email service providers we support
 */
export enum PlatformType {
  BREVO = 'brevo',
  MAILERLITE = 'mailerlite', 
  SENDGRID = 'sendgrid',
  MAILGUN = 'mailgun',
  POSTMARK = 'postmark',
  MAILJET = 'mailjet',
  SES = 'ses',
  CUSTOM = 'custom'
}

/**
 * Authentication types supported by email platforms
 */
export enum AuthType {
  API_KEY = 'api-key',
  API_KEY_SECRET = 'api-key-secret',
  BEARER = 'bearer',
  BASIC = 'basic'
}

/**
 * HTTP methods for API requests
 */
export enum HttpMethod {
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH'
}

/**
 * Email job status types
 */
export enum EmailJobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * Email target status types
 */
export enum EmailTargetStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  BLOCKED = 'blocked'
}

/**
 * Webhook event types
 */
export enum WebhookEventType {
  DELIVERED = 'delivered',
  BOUNCED = 'bounced',
  OPENED = 'opened',
  CLICKED = 'clicked',
  COMPLAINED = 'complained'
}

/**
 * Suppression reasons
 */
export enum SuppressionReason {
  BOUNCE = 'bounce',
  COMPLAINT = 'complaint',
  MANUAL = 'manual'
}

/**
 * User roles
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

// Utility functions for working with enums

/**
 * Get all platform type values as an array
 */
export function getAllPlatformTypes(): string[] {
  return Object.values(PlatformType);
}

/**
 * Check if a string is a valid platform type
 */
export function isValidPlatformType(type: string): type is PlatformType {
  return Object.values(PlatformType).includes(type as PlatformType);
}

/**
 * Get platform display name
 */
export function getPlatformDisplayName(type: PlatformType): string {
  const displayNames: Record<PlatformType, string> = {
    [PlatformType.BREVO]: 'Brevo (Sendinblue)',
    [PlatformType.MAILERLITE]: 'MailerLite',
    [PlatformType.SENDGRID]: 'SendGrid',
    [PlatformType.MAILGUN]: 'Mailgun',
    [PlatformType.POSTMARK]: 'Postmark',
    [PlatformType.MAILJET]: 'Mailjet',
    [PlatformType.SES]: 'Amazon SES',
    [PlatformType.CUSTOM]: 'Custom Provider'
  };
  
  return displayNames[type] || type;
}
