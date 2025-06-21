import type { User, UserProvider, EmailTemplate } from '../types';
import { UserRole } from '../types/enums';

// Development user data
export const developmentUser: Omit<User, 'id'> = {
  email: 'dev@example.com',
  name: 'Development User',
  avatar: 'https://via.placeholder.com/150/0066cc/ffffff?text=DEV',
  googleId: 'dev-google-id-12345',
  isActive: true,
  role: UserRole.USER,
  lastLoginAt: new Date(),
  settings: {
    defaultSender: {
      name: 'Dev Sender',
      email: 'dev@example.com'
    },
    timezone: 'UTC'
  }
};

// Sample user providers for development (you'll need to add real API keys)
export const developmentUserProviders: Omit<UserProvider, 'id' | 'userId'>[] = [
  {
    platformId: '', // Will be filled with actual platform ID during seeding
    name: 'My SendGrid Account',
    apiKey: 'your-sendgrid-api-key-here', // Replace with real key for testing
    dailyQuota: 100,
    usedToday: 0,
    isActive: true,
    lastResetDate: new Date()
  },
  {
    platformId: '', // Will be filled with actual platform ID during seeding
    name: 'My Mailgun Account',
    apiKey: 'your-mailgun-api-key-here', // Replace with real key for testing
    dailyQuota: 50,
    usedToday: 0,
    isActive: true,
    lastResetDate: new Date()
  }
];

// Sample email templates for development
export const developmentEmailTemplates: Omit<EmailTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Welcome Email',
    description: 'Welcome new users to the platform',
    subject: 'Welcome to our platform, {{name}}!',
    htmlContent: `
      <h1>Welcome {{name}}!</h1>
      <p>Thank you for joining our platform. We're excited to have you on board.</p>
      <p>Your email is: {{email}}</p>
      <p>Best regards,<br>The Team</p>
    `,
    textContent: `
      Welcome {{name}}!
      
      Thank you for joining our platform. We're excited to have you on board.
      Your email is: {{email}}
      
      Best regards,
      The Team
    `,
    variables: ['name', 'email'],
    category: 'onboarding',
    isActive: true,
    createdBy: 'system'
  },
  {
    name: 'Password Reset',
    description: 'Password reset notification',
    subject: 'Reset your password, {{name}}',
    htmlContent: `
      <h2>Password Reset Request</h2>
      <p>Hi {{name}},</p>
      <p>You requested to reset your password. Click the link below:</p>
      <p><a href="{{resetLink}}">Reset Password</a></p>
      <p>This link expires in {{expiryTime}} minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
    textContent: `
      Password Reset Request
      
      Hi {{name}},
      
      You requested to reset your password. Use this link:
      {{resetLink}}
      
      This link expires in {{expiryTime}} minutes.
      
      If you didn't request this, please ignore this email.
    `,
    variables: ['name', 'resetLink', 'expiryTime'],
    category: 'authentication',
    isActive: true,
    createdBy: 'system'
  },
  {
    name: 'Newsletter',
    description: 'Monthly newsletter template',
    subject: 'Monthly Newsletter - {{month}} {{year}}',
    htmlContent: `
      <h1>{{companyName}} Newsletter</h1>
      <h2>{{month}} {{year}} Edition</h2>
      
      <p>Hi {{name}},</p>
      
      <h3>What's New This Month</h3>
      <p>{{newsContent}}</p>
      
      <h3>Featured Article</h3>
      <p>{{featuredArticle}}</p>
      
      <p>Thanks for reading!</p>
      <p>{{companyName}} Team</p>
      
      <hr>
      <small>You're receiving this because you subscribed to our newsletter.</small>
    `,
    variables: ['name', 'month', 'year', 'companyName', 'newsContent', 'featuredArticle'],
    category: 'marketing',
    isActive: true,
    createdBy: 'system'
  }
];
