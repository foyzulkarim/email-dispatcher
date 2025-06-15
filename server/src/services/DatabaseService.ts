import mongoose from 'mongoose';
import { EmailJobModel } from '../models/EmailJob';
import { EmailTargetModel } from '../models/EmailTarget';
import { EmailProviderModel } from '../models/EmailProvider';
import { SuppressionModel } from '../models/Suppression';
import { EmailTemplateModel } from '../models/EmailTemplate';
import { v4 as uuidv4 } from 'uuid';

export class DatabaseService {
  
  async initializeDatabase(): Promise<void> {
    try {
      console.log('🔧 Initializing database...');
      
      // Create indexes
      await this.createIndexes();
      
      // Initialize sample templates
      await this.initializeSampleTemplates();
      
      console.log('✅ Database initialized successfully');
      
    } catch (error) {
      console.error('❌ Error initializing database:', error);
      throw error;
    }
  }

  private async createIndexes(): Promise<void> {
    try {
      // Email jobs indexes
      await EmailJobModel.collection.createIndex({ status: 1, createdAt: -1 });
      await EmailJobModel.collection.createIndex({ createdAt: -1 });
      
      // Email targets indexes
      await EmailTargetModel.collection.createIndex({ jobId: 1 });
      await EmailTargetModel.collection.createIndex({ status: 1, retryCount: 1 });
      await EmailTargetModel.collection.createIndex({ email: 1 });
      
      // Email providers indexes
      await EmailProviderModel.collection.createIndex({ isActive: 1, usedToday: 1 });
      
      // Suppression list indexes
      await SuppressionModel.collection.createIndex({ email: 1 }, { unique: true });
      
      // Email templates indexes
      await EmailTemplateModel.collection.createIndex({ name: 1, isActive: 1 });
      await EmailTemplateModel.collection.createIndex({ category: 1, isActive: 1 });
      await EmailTemplateModel.collection.createIndex({ isActive: 1, createdAt: -1 });
      
      console.log('✅ Database indexes created');
      
    } catch (error) {
      // Indexes might already exist, that's fine
      console.log('ℹ️ Some indexes already exist (this is normal)');
    }
  }

  private async initializeSampleTemplates(): Promise<void> {
    try {
      // Check if templates already exist
      const existingTemplates = await EmailTemplateModel.countDocuments();
      
      if (existingTemplates > 0) {
        console.log('✅ Email templates already initialized');
        return;
      }

      const sampleTemplates = [
        {
          id: uuidv4(),
          name: 'Welcome Email',
          description: 'Welcome new users to the platform',
          subject: 'Welcome to {company_name}, {first_name}!',
          htmlContent: `
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h1 style="color: #2c3e50;">Welcome to {company_name}!</h1>
                  
                  <p>Hello {first_name},</p>
                  
                  <p>We're excited to have you join our community! Your account has been successfully created with the email address: <strong>{recipient_email}</strong></p>
                  
                  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Getting Started</h3>
                    <ul>
                      <li>Complete your profile setup</li>
                      <li>Explore our features</li>
                      <li>Connect with other users</li>
                    </ul>
                  </div>
                  
                  <p>
                    <a href="{dashboard_link}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                      Go to Dashboard
                    </a>
                  </p>
                  
                  <p>If you have any questions, feel free to contact our support team.</p>
                  
                  <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                  <p style="font-size: 12px; color: #666;">
                    This email was sent to {recipient_email} on {current_date}.<br>
                    © {current_year} {company_name}. All rights reserved.
                  </p>
                </div>
              </body>
            </html>
          `,
          textContent: `
            Welcome to {company_name}!
            
            Hello {first_name},
            
            We're excited to have you join our community! Your account has been successfully created with the email address: {recipient_email}
            
            Getting Started:
            - Complete your profile setup
            - Explore our features
            - Connect with other users
            
            Visit your dashboard: {dashboard_link}
            
            If you have any questions, feel free to contact our support team.
            
            This email was sent to {recipient_email} on {current_date}.
            © {current_year} {company_name}. All rights reserved.
          `,
          variables: ['company_name', 'first_name', 'dashboard_link'],
          category: 'onboarding',
          isActive: true,
          createdBy: 'system'
        },
        {
          id: uuidv4(),
          name: 'Password Reset',
          description: 'Help users reset their forgotten passwords',
          subject: 'Reset Your Password - {company_name}',
          htmlContent: `
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h1 style="color: #e74c3c;">Password Reset Request</h1>
                  
                  <p>Hello {first_name},</p>
                  
                  <p>We received a request to reset the password for your {company_name} account ({recipient_email}).</p>
                  
                  <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
                  </div>
                  
                  <p>To reset your password, click the button below:</p>
                  
                  <p>
                    <a href="{reset_link}" style="background-color: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                      Reset Password
                    </a>
                  </p>
                  
                  <p>Or copy and paste this link into your browser:</p>
                  <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 3px;">
                    {reset_link}
                  </p>
                  
                  <p><strong>This link will expire in 24 hours.</strong></p>
                  
                  <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                  <p style="font-size: 12px; color: #666;">
                    This email was sent to {recipient_email} on {current_date}.<br>
                    © {current_year} {company_name}. All rights reserved.
                  </p>
                </div>
              </body>
            </html>
          `,
          textContent: `
            Password Reset Request
            
            Hello {first_name},
            
            We received a request to reset the password for your {company_name} account ({recipient_email}).
            
            SECURITY NOTICE: If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
            
            To reset your password, visit this link:
            {reset_link}
            
            This link will expire in 24 hours.
            
            This email was sent to {recipient_email} on {current_date}.
            © {current_year} {company_name}. All rights reserved.
          `,
          variables: ['company_name', 'first_name', 'reset_link'],
          category: 'authentication',
          isActive: true,
          createdBy: 'system'
        },
        {
          id: uuidv4(),
          name: 'Order Confirmation',
          description: 'Confirm customer orders and provide details',
          subject: 'Order Confirmation #{order_id} - Thank You!',
          htmlContent: `
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h1 style="color: #28a745;">Order Confirmed!</h1>
                  
                  <p>Hello {first_name},</p>
                  
                  <p>Thank you for your order! We're excited to let you know that we've received your order and it's being processed.</p>
                  
                  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Order Details</h3>
                    <p><strong>Order ID:</strong> #{order_id}</p>
                    <p><strong>Order Date:</strong> {order_date}</p>
                    <p><strong>Total Amount:</strong> {total_amount}</p>
                    <p><strong>Shipping Address:</strong> {shipping_address}</p>
                    
                    <hr style="margin: 15px 0; border: none; border-top: 1px solid #dee2e6;">
                    
                    <h4>Items Ordered:</h4>
                    <p>{order_items}</p>
                  </div>
                  
                  <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>Estimated Delivery:</strong> {estimated_delivery}</p>
                  </div>
                  
                  <p>
                    <a href="{tracking_link}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                      Track Your Order
                    </a>
                  </p>
                  
                  <p>We'll send you another email with tracking information once your order ships.</p>
                  
                  <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                  <p style="font-size: 12px; color: #666;">
                    This email was sent to {recipient_email} on {current_date}.<br>
                    © {current_year} {company_name}. All rights reserved.
                  </p>
                </div>
              </body>
            </html>
          `,
          textContent: `
            Order Confirmed!
            
            Hello {first_name},
            
            Thank you for your order! We're excited to let you know that we've received your order and it's being processed.
            
            Order Details:
            - Order ID: #{order_id}
            - Order Date: {order_date}
            - Total Amount: {total_amount}
            - Shipping Address: {shipping_address}
            
            Items Ordered:
            {order_items}
            
            Estimated Delivery: {estimated_delivery}
            
            Track your order: {tracking_link}
            
            We'll send you another email with tracking information once your order ships.
            
            This email was sent to {recipient_email} on {current_date}.
            © {current_year} {company_name}. All rights reserved.
          `,
          variables: ['company_name', 'first_name', 'order_id', 'order_date', 'total_amount', 'shipping_address', 'order_items', 'estimated_delivery', 'tracking_link'],
          category: 'ecommerce',
          isActive: true,
          createdBy: 'system'
        },
        {
          id: uuidv4(),
          name: 'Newsletter',
          description: 'Monthly newsletter template',
          subject: '{company_name} Newsletter - {month} {current_year}',
          htmlContent: `
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h1 style="color: #2c3e50;">{company_name} Newsletter</h1>
                  <p style="color: #666; font-size: 14px;">{month} {current_year} Edition</p>
                  
                  <p>Hello {first_name},</p>
                  
                  <p>Here's what's new this month at {company_name}:</p>
                  
                  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">🚀 Featured Updates</h3>
                    <p>{featured_content}</p>
                  </div>
                  
                  <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">📰 Latest News</h3>
                    <p>{news_content}</p>
                  </div>
                  
                  <div style="background-color: #d1ecf1; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">🎯 Special Offers</h3>
                    <p>{offers_content}</p>
                  </div>
                  
                  <p>
                    <a href="{website_link}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                      Visit Our Website
                    </a>
                  </p>
                  
                  <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                  <p style="font-size: 12px; color: #666;">
                    You're receiving this because you subscribed to {company_name} newsletter.<br>
                    <a href="{unsubscribe_link}" style="color: #666;">Unsubscribe</a> | 
                    <a href="{preferences_link}" style="color: #666;">Update Preferences</a><br>
                    © {current_year} {company_name}. All rights reserved.
                  </p>
                </div>
              </body>
            </html>
          `,
          variables: ['company_name', 'first_name', 'month', 'featured_content', 'news_content', 'offers_content', 'website_link', 'unsubscribe_link', 'preferences_link'],
          category: 'marketing',
          isActive: true,
          createdBy: 'system'
        }
      ];

      await EmailTemplateModel.insertMany(sampleTemplates);
      console.log(`✅ Created ${sampleTemplates.length} sample email templates`);
      
    } catch (error) {
      console.error('❌ Error initializing sample templates:', error);
      throw error;
    }
  }

  async clearAllData(): Promise<void> {
    try {
      console.log('🗑️ Clearing all data...');
      
      await Promise.all([
        EmailJobModel.deleteMany({}),
        EmailTargetModel.deleteMany({}),
        SuppressionModel.deleteMany({}),
        EmailTemplateModel.deleteMany({})
      ]);
      
      console.log('✅ All data cleared');
      
    } catch (error) {
      console.error('❌ Error clearing data:', error);
      throw error;
    }
  }

  async getStats(): Promise<any> {
    try {
      const [jobCount, targetCount, suppressionCount, templateCount, providerCount] = await Promise.all([
        EmailJobModel.countDocuments(),
        EmailTargetModel.countDocuments(),
        SuppressionModel.countDocuments(),
        EmailTemplateModel.countDocuments(),
        EmailProviderModel.countDocuments()
      ]);

      return {
        jobs: jobCount,
        targets: targetCount,
        suppressions: suppressionCount,
        templates: templateCount,
        providers: providerCount
      };
      
    } catch (error) {
      console.error('❌ Error getting database stats:', error);
      throw error;
    }
  }
}

export const databaseService = new DatabaseService(); 
