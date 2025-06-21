import { PlatformModel } from '../models/Platform';
import type { Platform } from '../types';

export class PlatformService {
  
  /**
   * Get all active platforms
   */
  async getAllPlatforms(): Promise<Platform[]> {
    try {
      const platforms = await PlatformModel.find({ isActive: true })
        .sort({ displayName: 1 });
      
      return platforms.map(p => p.toObject());
    } catch (error) {
      console.error('Error getting platforms:', error);
      throw error;
    }
  }

  /**
   * Get platform by ID
   */
  async getPlatformById(platformId: string): Promise<Platform | null> {
    try {
      const platform = await PlatformModel.findOne({ 
        id: platformId, 
        isActive: true 
      });
      
      return platform ? platform.toObject() : null;
    } catch (error) {
      console.error('Error getting platform by ID:', error);
      throw error;
    }
  }

  /**
   * Get platform by name
   */
  async getPlatformByName(name: string): Promise<Platform | null> {
    try {
      const platform = await PlatformModel.findOne({ 
        name: name.toLowerCase(), 
        isActive: true 
      });
      
      return platform ? platform.toObject() : null;
    } catch (error) {
      console.error('Error getting platform by name:', error);
      throw error;
    }
  }

  /**
   * Get platforms by type
   */
  async getPlatformsByType(type: string): Promise<Platform[]> {
    try {
      const platforms = await PlatformModel.find({ 
        type, 
        isActive: true 
      }).sort({ displayName: 1 });
      
      return platforms.map(p => p.toObject());
    } catch (error) {
      console.error('Error getting platforms by type:', error);
      throw error;
    }
  }

  /**
   * Check if platform exists and is active
   */
  async isPlatformActive(platformId: string): Promise<boolean> {
    try {
      const count = await PlatformModel.countDocuments({ 
        id: platformId, 
        isActive: true 
      });
      
      return count > 0;
    } catch (error) {
      console.error('Error checking platform status:', error);
      return false;
    }
  }

  /**
   * Get platform configuration for email sending
   */
  async getPlatformConfig(platformId: string): Promise<Platform['defaultConfig'] | null> {
    try {
      const platform = await PlatformModel.findOne({ 
        id: platformId, 
        isActive: true 
      }).select('defaultConfig');
      
      return platform ? platform.defaultConfig : null;
    } catch (error) {
      console.error('Error getting platform config:', error);
      throw error;
    }
  }

  /**
   * Get supported platform types
   */
  async getSupportedTypes(): Promise<string[]> {
    try {
      const types = await PlatformModel.distinct('type', { isActive: true });
      return types.sort();
    } catch (error) {
      console.error('Error getting supported types:', error);
      throw error;
    }
  }
}

export const platformService = new PlatformService();
