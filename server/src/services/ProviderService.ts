import { EmailProviderModel } from '../models/EmailProvider';

export class ProviderService {
  async resetDailyQuotas() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Reset quotas for providers that haven't been reset today
      const result = await EmailProviderModel.updateMany(
        { lastResetDate: { $lt: today } },
        {
          usedToday: 0,
          lastResetDate: new Date(),
        }
      );

      if (result.modifiedCount > 0) {
        console.log(
          `✅ Reset daily quotas for ${result.modifiedCount} providers`
        );
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
