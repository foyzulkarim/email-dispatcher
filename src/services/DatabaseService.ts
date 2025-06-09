import mongoose from 'mongoose';
import { EmailProviderModel } from '../models/EmailProvider';

class DatabaseService {
  
  async initializeDatabase(): Promise<void> {
    try {
      // Ensure indexes are created
      await EmailProviderModel.createIndexes();
      console.log('✅ Database indexes created');
      
      // Check if we have any providers, if not create demo ones
      const providerCount = await EmailProviderModel.countDocuments();
      
      if (providerCount === 0) {
        await this.createDemoProviders();
        console.log('✅ Demo providers created');
      } else {
        console.log(`✅ Found ${providerCount} existing providers in database`);
      }
      
    } catch (error) {
      console.error('❌ Database initialization error:', error);
      throw error;
    }
  }
  
  private async createDemoProviders(): Promise<void> {
    const demoProviders = [
      {
        id: 'demo-brevo',
        name: 'Demo Brevo',
        type: 'brevo' as const,
        apiKey: 'demo-brevo-key',
        dailyQuota: 300,
        usedToday: 0,
        isActive: true,
        lastResetDate: new Date()
      },
      {
        id: 'demo-mailerlite',
        name: 'Demo MailerLite',
        type: 'mailerlite' as const,
        apiKey: 'demo-mailerlite-key',
        dailyQuota: 1000,
        usedToday: 0,
        isActive: true,
        lastResetDate: new Date()
      }
    ];
    
    for (const providerData of demoProviders) {
      const provider = new EmailProviderModel(providerData);
      await provider.save();
    }
  }
  
  async getConnectionStatus(): Promise<{
    connected: boolean;
    database: string;
    collections: string[];
  }> {
    try {
      const state = mongoose.connection.readyState;
      const connected = state === 1;
      
      const database = mongoose.connection.db?.databaseName || 'unknown';
      
      let collections: string[] = [];
      if (connected && mongoose.connection.db) {
        const collectionInfos = await mongoose.connection.db.listCollections().toArray();
        collections = collectionInfos.map(info => info.name);
      }
      
      return { connected, database, collections };
    } catch (error) {
      console.error('Error getting connection status:', error);
      return { connected: false, database: 'error', collections: [] };
    }
  }
  
  async clearProviders(): Promise<void> {
    try {
      await EmailProviderModel.deleteMany({});
      console.log('✅ All providers cleared from database');
    } catch (error) {
      console.error('❌ Error clearing providers:', error);
      throw error;
    }
  }
  
  async getProviderStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    totalQuota: number;
    usedQuota: number;
  }> {
    try {
      const total = await EmailProviderModel.countDocuments();
      const active = await EmailProviderModel.countDocuments({ isActive: true });
      const inactive = total - active;
      
      const stats = await EmailProviderModel.aggregate([
        {
          $group: {
            _id: null,
            totalQuota: { $sum: '$dailyQuota' },
            usedQuota: { $sum: '$usedToday' }
          }
        }
      ]);
      
      const { totalQuota = 0, usedQuota = 0 } = stats[0] || {};
      
      return { total, active, inactive, totalQuota, usedQuota };
    } catch (error) {
      console.error('❌ Error getting provider stats:', error);
      throw error;
    }
  }
}

export const databaseService = new DatabaseService(); 
