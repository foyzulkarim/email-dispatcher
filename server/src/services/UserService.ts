import { UserModel } from '../models/User';
import type { User } from '../types';
import { UserRole } from '../types/enums';
import { v4 as uuidv4 } from 'uuid';

export class UserService {
  
  /**
   * Get all users with pagination and filtering (Admin function)
   */
  async getAllUsers(options: {
    page?: number;
    limit?: number;
    role?: string;
    isActive?: boolean;
    search?: string;
  } = {}): Promise<{
    users: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 20;
      const { role, isActive, search } = options;

      // Build filter
      const filter: any = {};
      
      if (role && role !== 'all') {
        filter.role = role;
      }
      
      if (isActive !== undefined) {
        filter.isActive = isActive;
      }
      
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;
      
      const [users, total] = await Promise.all([
        UserModel.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .select('-__v'),
        UserModel.countDocuments(filter)
      ]);

      return {
        users: users.map(user => user.toObject()),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      const user = await UserModel.findOne({ id: userId }).select('-__v');
      return user ? user.toObject() : null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await UserModel.findOne({ 
        email: email.toLowerCase(),
        isActive: true 
      }).select('-__v');
      
      return user ? user.toObject() : null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }

  /**
   * Get user by Google ID
   */
  async getUserByGoogleId(googleId: string): Promise<User | null> {
    try {
      const user = await UserModel.findOne({ 
        googleId,
        isActive: true 
      }).select('-__v');
      
      return user ? user.toObject() : null;
    } catch (error) {
      console.error('Error getting user by Google ID:', error);
      throw error;
    }
  }

  /**
   * Create a new user
   */
  async createUser(userData: {
    email: string;
    name: string;
    avatar?: string;
    googleId: string;
    role?: UserRole;
    settings?: {
      defaultSender?: {
        name: string;
        email: string;
      };
      timezone?: string;
    };
  }): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = await UserModel.findOne({
        $or: [
          { email: userData.email.toLowerCase() },
          { googleId: userData.googleId }
        ]
      });

      if (existingUser) {
        throw new Error('User with this email or Google ID already exists');
      }

      const newUser = new UserModel({
        id: uuidv4(),
        email: userData.email.toLowerCase(),
        name: userData.name,
        avatar: userData.avatar,
        googleId: userData.googleId,
        role: userData.role || UserRole.USER,
        isActive: true,
        lastLoginAt: new Date(),
        settings: userData.settings || {
          timezone: 'UTC'
        }
      });

      await newUser.save();
      return newUser.toObject();
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update user information
   */
  async updateUser(userId: string, updateData: Partial<{
    name: string;
    avatar: string;
    role: UserRole;
    isActive: boolean;
    settings: {
      defaultSender?: {
        name: string;
        email: string;
      };
      timezone?: string;
    };
  }>): Promise<User | null> {
    try {
      // Don't allow email or googleId updates through this method
      const allowedUpdates = {
        ...updateData,
        updatedAt: new Date()
      };

      const updatedUser = await UserModel.findOneAndUpdate(
        { id: userId },
        allowedUpdates,
        { new: true }
      ).select('-__v');

      return updatedUser ? updatedUser.toObject() : null;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Soft delete user (set isActive to false)
   */
  async softDeleteUser(userId: string): Promise<boolean> {
    try {
      const result = await UserModel.findOneAndUpdate(
        { id: userId },
        { 
          isActive: false,
          updatedAt: new Date()
        }
      );
      
      return !!result;
    } catch (error) {
      console.error('Error soft deleting user:', error);
      throw error;
    }
  }

  /**
   * Reactivate user (set isActive to true)
   */
  async reactivateUser(userId: string): Promise<boolean> {
    try {
      const result = await UserModel.findOneAndUpdate(
        { id: userId },
        { 
          isActive: true,
          updatedAt: new Date()
        }
      );
      
      return !!result;
    } catch (error) {
      console.error('Error reactivating user:', error);
      throw error;
    }
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(userId: string): Promise<void> {
    try {
      await UserModel.updateOne(
        { id: userId, isActive: true },
        { lastLoginAt: new Date() }
      );
    } catch (error) {
      console.error('Error updating last login:', error);
      throw error;
    }
  }

  /**
   * Get user statistics (Admin function)
   */
  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    admins: number;
    users: number;
    recentSignups: number; // Last 30 days
    recentLogins: number; // Last 7 days
  }> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [
        total,
        active,
        inactive,
        admins,
        users,
        recentSignups,
        recentLogins
      ] = await Promise.all([
        UserModel.countDocuments(),
        UserModel.countDocuments({ isActive: true }),
        UserModel.countDocuments({ isActive: false }),
        UserModel.countDocuments({ role: UserRole.ADMIN }),
        UserModel.countDocuments({ role: UserRole.USER }),
        UserModel.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
        UserModel.countDocuments({ lastLoginAt: { $gte: sevenDaysAgo } })
      ]);

      return {
        total,
        active,
        inactive,
        admins,
        users,
        recentSignups,
        recentLogins
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  /**
   * Search users by name or email
   */
  async searchUsers(query: string, limit: number = 10): Promise<User[]> {
    try {
      const users = await UserModel.find({
        isActive: true,
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ]
      })
      .limit(limit)
      .select('id name email avatar role')
      .sort({ name: 1 });

      return users.map(user => user.toObject());
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role: UserRole): Promise<User[]> {
    try {
      const users = await UserModel.find({ 
        role, 
        isActive: true 
      })
      .select('-__v')
      .sort({ name: 1 });

      return users.map(user => user.toObject());
    } catch (error) {
      console.error('Error getting users by role:', error);
      throw error;
    }
  }

  /**
   * Get recently active users
   */
  async getRecentlyActiveUsers(days: number = 7, limit: number = 20): Promise<User[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const users = await UserModel.find({
        isActive: true,
        lastLoginAt: { $gte: cutoffDate }
      })
      .select('-__v')
      .sort({ lastLoginAt: -1 })
      .limit(limit);

      return users.map(user => user.toObject());
    } catch (error) {
      console.error('Error getting recently active users:', error);
      throw error;
    }
  }

  /**
   * Bulk update users (Admin function)
   */
  async bulkUpdateUsers(userIds: string[], updateData: Partial<{
    role: UserRole;
    isActive: boolean;
  }>): Promise<{
    modifiedCount: number;
    matchedCount: number;
  }> {
    try {
      const result = await UserModel.updateMany(
        { id: { $in: userIds } },
        { 
          ...updateData,
          updatedAt: new Date()
        }
      );

      return {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount
      };
    } catch (error) {
      console.error('Error bulk updating users:', error);
      throw error;
    }
  }

  /**
   * Check if user exists and is active
   */
  async isUserActive(userId: string): Promise<boolean> {
    try {
      const count = await UserModel.countDocuments({ 
        id: userId, 
        isActive: true 
      });
      
      return count > 0;
    } catch (error) {
      console.error('Error checking if user is active:', error);
      return false;
    }
  }
}

export const userService = new UserService();
