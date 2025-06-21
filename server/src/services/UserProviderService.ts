import { UserProviderModel } from '../models/UserProvider';
import { platformService } from './PlatformService';
import type { UserProvider } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class UserProviderService {
  
  /**
   * Get all user providers for a specific user
   */
  async getUserProviders(userId: string): Promise<UserProvider[]> {
    try {
      const providers = await UserProviderModel.find({ userId })
        .sort({ name: 1 });
      
      return providers.map(p => p.toObject());
    } catch (error) {
      console.error('Error getting user providers:', error);
      throw error;
    }
  }

  /**
   * Get active user providers for a specific user
   */
  async getActiveUserProviders(userId: string): Promise<UserProvider[]> {
    try {
      const providers = await UserProviderModel.find({ 
        userId, 
        isActive: true 
      }).sort({ name: 1 });
      
      return providers.map(p => p.toObject());
    } catch (error) {
      console.error('Error getting active user providers:', error);
      throw error;
    }
  }

  /**
   * Get user provider by ID
   */
  async getUserProviderById(userId: string, providerId: string): Promise<UserProvider | null> {
    try {
      const provider = await UserProviderModel.findOne({ 
        id: providerId, 
        userId 
      });
      
      return provider ? provider.toObject() : null;
    } catch (error) {
      console.error('Error getting user provider by ID:', error);
      throw error;
    }
  }

  /**
   * Create a new user provider
   */
  async createUserProvider(userId: string, providerData: {
    platformId: string;
    name: string;
    apiKey: string;
    apiSecret?: string;
    dailyQuota: number;
    customConfig?: any;
  }): Promise<UserProvider> {
    try {
      // Validate platform exists
      const platform = await platformService.getPlatformById(providerData.platformId);
      if (!platform) {
        throw new Error(`Platform with ID ${providerData.platformId} not found`);
      }

      // Check if provider name is unique for this user
      const existingProvider = await UserProviderModel.findOne({
        userId,
        name: providerData.name
      });

      if (existingProvider) {
        throw new Error(`Provider with name "${providerData.name}" already exists`);
      }

      // Create new provider
      const newProvider = new UserProviderModel({
        id: uuidv4(),
        userId,
        platformId: providerData.platformId,
        name: providerData.name,
        apiKey: providerData.apiKey, // TODO: Encrypt this
        apiSecret: providerData.apiSecret, // TODO: Encrypt this
        dailyQuota: providerData.dailyQuota,
        usedToday: 0,
        isActive: true,
        lastResetDate: new Date(),
        customConfig: providerData.customConfig || {}
      });

      await newProvider.save();
      return newProvider.toObject();
    } catch (error) {
      console.error('Error creating user provider:', error);
      throw error;
    }
  }

  /**
   * Update user provider
   */
  async updateUserProvider(
    userId: string, 
    providerId: string, 
    updateData: Partial<{
      name: string;
      apiKey: string;
      apiSecret: string;
      dailyQuota: number;
      isActive: boolean;
      customConfig: any;
    }>
  ): Promise<UserProvider | null> {
    try {
      // If updating name, check uniqueness
      if (updateData.name) {
        const existingProvider = await UserProviderModel.findOne({
          userId,
          name: updateData.name,
          id: { $ne: providerId } // Exclude current provider
        });

        if (existingProvider) {
          throw new Error(`Provider with name "${updateData.name}" already exists`);
        }
      }

      // TODO: Encrypt sensitive fields if provided
      const processedUpdateData = {
        ...updateData,
        updatedAt: new Date()
      };

      const updatedProvider = await UserProviderModel.findOneAndUpdate(
        { id: providerId, userId },
        processedUpdateData,
        { new: true }
      );

      return updatedProvider ? updatedProvider.toObject() : null;
    } catch (error) {
      console.error('Error updating user provider:', error);
      throw error;
    }
  }

  /**
   * Delete user provider (soft delete by setting isActive to false)
   */
  async deleteUserProvider(userId: string, providerId: string): Promise<boolean> {
    try {
      const result = await UserProviderModel.findOneAndUpdate(
        { id: providerId, userId },
        { 
          isActive: false,
          updatedAt: new Date()
        }
      );
      
      return !!result;
    } catch (error) {
      console.error('Error deleting user provider:', error);
      throw error;
    }
  }

  /**
   * Get available providers (active and under quota)
   */
  async getAvailableProviders(userId: string): Promise<UserProvider[]> {
    try {
      const providers = await UserProviderModel.find({
        userId,
        isActive: true,
        $expr: { $lt: ['$usedToday', '$dailyQuota'] }
      }).sort({ usedToday: 1 }); // Sort by least used first

      return providers.map(p => p.toObject());
    } catch (error) {
      console.error('Error getting available providers:', error);
      throw error;
    }
  }

  /**
   * Increment provider usage
   */
  async incrementProviderUsage(providerId: string): Promise<void> {
    try {
      await UserProviderModel.updateOne(
        { id: providerId },
        { $inc: { usedToday: 1 } }
      );
    } catch (error) {
      console.error('Error incrementing provider usage:', error);
      throw error;
    }
  }

  /**
   * Reset daily usage for a specific provider
   */
  async resetProviderUsage(providerId: string): Promise<void> {
    try {
      await UserProviderModel.updateOne(
        { id: providerId },
        { 
          usedToday: 0,
          lastResetDate: new Date()
        }
      );
    } catch (error) {
      console.error('Error resetting provider usage:', error);
      throw error;
    }
  }

  /**
   * Get provider statistics for a user
   */
  async getProviderStats(userId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    totalQuota: number;
    totalUsed: number;
    availableQuota: number;
  }> {
    try {
      const providers = await UserProviderModel.find({ userId });
      
      const stats = {
        total: providers.length,
        active: providers.filter(p => p.isActive).length,
        inactive: providers.filter(p => !p.isActive).length,
        totalQuota: providers.reduce((sum, p) => sum + p.dailyQuota, 0),
        totalUsed: providers.reduce((sum, p) => sum + p.usedToday, 0),
        availableQuota: providers.reduce((sum, p) => sum + (p.dailyQuota - p.usedToday), 0)
      };

      return stats;
    } catch (error) {
      console.error('Error getting provider stats:', error);
      throw error;
    }
  }

  /**
   * Test provider connection (placeholder for future implementation)
   */
  async testProviderConnection(userId: string, providerId: string): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      const provider = await this.getUserProviderById(userId, providerId);
      if (!provider) {
        return {
          success: false,
          message: 'Provider not found'
        };
      }

      // TODO: Implement actual connection testing based on platform type
      // For now, just return a mock success
      return {
        success: true,
        message: 'Connection test not yet implemented',
        details: {
          provider: provider.name,
          platform: provider.platformId
        }
      };
    } catch (error) {
      console.error('Error testing provider connection:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const userProviderService = new UserProviderService();
