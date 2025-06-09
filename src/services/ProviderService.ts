import { EmailProviderModel } from '../models/EmailProvider';

export class ProviderService {
  
  async initializeProviders() {
    try {
      // Check if providers already exist
      const existingProviders = await EmailProviderModel.countDocuments();
      
      if (existingProviders > 0) {
        console.log('✅ Email providers already initialized');
        return;
      }

      // Create default providers
      const providers = [
        {
          id: 'brevo',
          name: 'Brevo',
          type: 'brevo' as const,
          apiKey: process.env.BREVO_API_KEY || 'demo_key',
          dailyQuota: parseInt(process.env.BREVO_DAILY_QUOTA || '300'),
          usedToday: 0,
          isActive: true,
          lastResetDate: new Date()
        },
        {
          id: 'mailerlite',
          name: 'MailerLite',
          type: 'mailerlite' as const,
          apiKey: process.env.MAILERLITE_API_KEY || 'demo_key',
          dailyQuota: parseInt(process.env.MAILERLITE_DAILY_QUOTA || '1000'),
          usedToday: 0,
          isActive: true,
          lastResetDate: new Date()
        }
      ];

      await EmailProviderModel.insertMany(providers);
      console.log('✅ Email providers initialized successfully');
      
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

