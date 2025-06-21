import { EmailProviderModel } from './EmailProvider';
import { getProviderConfig } from '../../config/providers';

export class ProviderService {
  
  async initializeProviders() {
    try {
      // Check if providers already exist
      const existingProviders = await EmailProviderModel.countDocuments();
      
      if (existingProviders > 0) {
        console.log('✅ Email providers already initialized');
        return;
      }

      // Create default providers with configurations
      const providers = [
        {
          id: 'brevo-default',
          name: 'Brevo Default',
          type: 'brevo' as const,
          apiKey: process.env.BREVO_API_KEY || 'demo_key',
          dailyQuota: parseInt(process.env.BREVO_DAILY_QUOTA || '300'),
          usedToday: 0,
          isActive: process.env.BREVO_API_KEY ? true : false, // Only activate if API key exists
          lastResetDate: new Date(),
          config: getProviderConfig('brevo')!
        },
        {
          id: 'sendgrid-default',
          name: 'SendGrid Default',
          type: 'sendgrid' as const,
          apiKey: process.env.SENDGRID_API_KEY || 'demo_key',
          dailyQuota: parseInt(process.env.SENDGRID_DAILY_QUOTA || '100'),
          usedToday: 0,
          isActive: process.env.SENDGRID_API_KEY ? true : false, // Only activate if API key exists
          lastResetDate: new Date(),
          config: getProviderConfig('sendgrid')!
        },
        {
          id: 'mailjet-default',
          name: 'Mailjet Default',
          type: 'mailjet' as const,
          apiKey: process.env.MAILJET_API_KEY || 'demo_key', // Should be "public_key:private_key"
          dailyQuota: parseInt(process.env.MAILJET_DAILY_QUOTA || '200'),
          usedToday: 0,
          isActive: process.env.MAILJET_API_KEY ? true : false, // Only activate if API key exists
          lastResetDate: new Date(),
          config: getProviderConfig('mailjet')!
        },
        {
          id: 'mailerlite-default',
          name: 'MailerLite Default',
          type: 'mailerlite' as const,
          apiKey: process.env.MAILERLITE_API_KEY || 'demo_key',
          dailyQuota: parseInt(process.env.MAILERLITE_DAILY_QUOTA || '1000'),
          usedToday: 0,
          isActive: process.env.MAILERLITE_API_KEY ? true : false, // Only activate if API key exists
          lastResetDate: new Date(),
          config: getProviderConfig('mailerlite')!
        }
      ];

      await EmailProviderModel.insertMany(providers);
      console.log('✅ Email providers initialized successfully');
      
      // Log which providers are active
      const activeProviders = providers.filter(p => p.isActive);
      if (activeProviders.length > 0) {
        console.log(`📧 Active providers: ${activeProviders.map(p => p.name).join(', ')}`);
      } else {
        console.log('⚠️  No active providers (missing API keys in environment)');
      }
      
    } catch (error) {
      console.error('❌ Error initializing providers:', error);
      throw error;
    }
  }

  async resetDailyQuotas() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Reset quotas for providers that haven't been reset today
      const result = await EmailProviderModel.updateMany(
        { lastResetDate: { $lt: today } },
        { 
          usedToday: 0,
          lastResetDate: new Date()
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`✅ Reset daily quotas for ${result.modifiedCount} providers`);
      }

    } catch (error) {
      console.error('❌ Error resetting daily quotas:', error);
      throw error;
    }
  }

  async startQuotaResetScheduler() {
    // Reset quotas every hour (in production, you might want to use a proper cron job)
    setInterval(async () => {
      await this.resetDailyQuotas();
    }, 60 * 60 * 1000); // 1 hour

    console.log('📅 Quota reset scheduler started');
  }
}

export const providerService = new ProviderService();

