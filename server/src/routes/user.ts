import { FastifyInstance } from 'fastify';
import { ApiResponse } from '../types';
import { userService } from '../services/UserService';
import { UserRole } from '../types/enums';

export default async function userRoutes(fastify: FastifyInstance) {
  
  // Get all users with pagination and filtering (Admin function)
  fastify.get<{ 
    Querystring: { 
      page?: string;
      limit?: string;
      role?: string;
      isActive?: string;
      search?: string;
    } 
  }>('/', async (request, reply) => {
    try {
      const { page, limit, role, isActive, search } = request.query;

      const result = await userService.getAllUsers({
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        role,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        search
      });

      return reply.send({
        success: true,
        data: result
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error getting users:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Get user by ID
  fastify.get<{ 
    Params: { userId: string };
  }>('/:userId', async (request, reply) => {
    try {
      const { userId } = request.params;

      const user = await userService.getUserById(userId);
      
      if (!user) {
        return reply.code(404).send({
          success: false,
          error: 'User not found'
        } as ApiResponse);
      }

      return reply.send({
        success: true,
        data: user
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error getting user:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Update user information (Admin function)
  fastify.put<{ 
    Params: { userId: string };
    Body: Partial<{
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
    }>;
  }>('/:userId', async (request, reply) => {
    try {
      const { userId } = request.params;
      const updateData = request.body;

      // Validate role if provided
      if (updateData.role && !Object.values(UserRole).includes(updateData.role)) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid role specified'
        } as ApiResponse);
      }

      const updatedUser = await userService.updateUser(userId, updateData);

      if (!updatedUser) {
        return reply.code(404).send({
          success: false,
          error: 'User not found'
        } as ApiResponse);
      }

      return reply.send({
        success: true,
        data: updatedUser,
        message: 'User updated successfully'
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error updating user:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Soft delete user (Admin function)
  fastify.delete<{ 
    Params: { userId: string };
  }>('/:userId', async (request, reply) => {
    try {
      const { userId } = request.params;

      const deleted = await userService.softDeleteUser(userId);

      if (!deleted) {
        return reply.code(404).send({
          success: false,
          error: 'User not found'
        } as ApiResponse);
      }

      return reply.send({
        success: true,
        message: 'User deactivated successfully'
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error deactivating user:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Reactivate user (Admin function)
  fastify.post<{ 
    Params: { userId: string };
  }>('/:userId/reactivate', async (request, reply) => {
    try {
      const { userId } = request.params;

      const reactivated = await userService.reactivateUser(userId);

      if (!reactivated) {
        return reply.code(404).send({
          success: false,
          error: 'User not found'
        } as ApiResponse);
      }

      return reply.send({
        success: true,
        message: 'User reactivated successfully'
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error reactivating user:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Get user statistics (Admin function)
  fastify.get('/stats/overview', async (request, reply) => {
    try {
      const stats = await userService.getUserStats();

      return reply.send({
        success: true,
        data: stats
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error getting user stats:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Search users
  fastify.get<{ 
    Querystring: { 
      q: string;
      limit?: string;
    } 
  }>('/search', async (request, reply) => {
    try {
      const { q, limit } = request.query;

      if (!q || q.trim().length < 2) {
        return reply.code(400).send({
          success: false,
          error: 'Search query must be at least 2 characters long'
        } as ApiResponse);
      }

      const users = await userService.searchUsers(
        q.trim(), 
        limit ? parseInt(limit) : undefined
      );

      return reply.send({
        success: true,
        data: users
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error searching users:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Get users by role
  fastify.get<{ 
    Params: { role: string };
  }>('/role/:role', async (request, reply) => {
    try {
      const { role } = request.params;

      if (!Object.values(UserRole).includes(role as UserRole)) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid role specified'
        } as ApiResponse);
      }

      const users = await userService.getUsersByRole(role as UserRole);

      return reply.send({
        success: true,
        data: users
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error getting users by role:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Get recently active users
  fastify.get<{ 
    Querystring: { 
      days?: string;
      limit?: string;
    } 
  }>('/recent-activity', async (request, reply) => {
    try {
      const { days, limit } = request.query;

      const users = await userService.getRecentlyActiveUsers(
        days ? parseInt(days) : undefined,
        limit ? parseInt(limit) : undefined
      );

      return reply.send({
        success: true,
        data: users
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error getting recently active users:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Bulk update users (Admin function)
  fastify.patch<{ 
    Body: {
      userIds: string[];
      updateData: Partial<{
        role: UserRole;
        isActive: boolean;
      }>;
    };
  }>('/bulk-update', async (request, reply) => {
    try {
      const { userIds, updateData } = request.body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return reply.code(400).send({
          success: false,
          error: 'userIds array is required and cannot be empty'
        } as ApiResponse);
      }

      if (!updateData || Object.keys(updateData).length === 0) {
        return reply.code(400).send({
          success: false,
          error: 'updateData is required'
        } as ApiResponse);
      }

      // Validate role if provided
      if (updateData.role && !Object.values(UserRole).includes(updateData.role)) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid role specified'
        } as ApiResponse);
      }

      const result = await userService.bulkUpdateUsers(userIds, updateData);

      return reply.send({
        success: true,
        data: result,
        message: `${result.modifiedCount} users updated successfully`
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error bulk updating users:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Check if user is active
  fastify.get<{ 
    Params: { userId: string };
  }>('/:userId/status', async (request, reply) => {
    try {
      const { userId } = request.params;

      const isActive = await userService.isUserActive(userId);

      return reply.send({
        success: true,
        data: { 
          userId, 
          isActive 
        }
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error checking user status:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });
}
