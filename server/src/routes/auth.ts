import { FastifyInstance } from 'fastify';
import { authService } from '../services/AuthService';
import { ApiResponse } from '../types';
import { authenticateUser, optionalAuth } from '../middleware/auth';

export default async function authRoutes(fastify: FastifyInstance) {
  
  // Google OAuth login endpoint
  fastify.post<{
    Body: {
      idToken: string;
    };
  }>('/google', async (request, reply) => {
    try {
      const { idToken } = request.body;

      if (!idToken) {
        return reply.code(400).send({
          success: false,
          error: 'Google ID token is required'
        } as ApiResponse);
      }

      // Verify Google token and get user profile
      const googleProfile = await authService.verifyGoogleToken(idToken);
      
      // Create or update user
      const user = await authService.createOrUpdateUserFromGoogle(googleProfile);
      
      // Generate JWT token
      const token = authService.generateJWT(user);

      return reply.send({
        success: true,
        data: {
          user,
          token,
          expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        },
        message: 'Authentication successful'
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Google auth error:', error);
      
      // Return specific error message for auth failures
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      
      return reply.code(401).send({
        success: false,
        error: errorMessage
      } as ApiResponse);
    }
  });

  // Development login endpoint (only works in non-production)
  fastify.post<{
    Body: {
      email: string;
      name?: string;
    };
  }>('/dev-login', async (request, reply) => {
    try {
      // Only allow in development
      if (process.env.NODE_ENV === 'production') {
        return reply.code(404).send({
          success: false,
          error: 'Endpoint not available in production'
        } as ApiResponse);
      }

      const { email, name } = request.body;

      if (!email) {
        return reply.code(400).send({
          success: false,
          error: 'Email is required'
        } as ApiResponse);
      }

      // Create a mock Google profile for development
      const mockGoogleProfile = {
        id: `dev-${email.replace('@', '-').replace('.', '-')}`,
        email: email.toLowerCase(),
        name: name || 'Development User',
        verified_email: true
      };

      // Create or update user
      const user = await authService.createOrUpdateUserFromGoogle(mockGoogleProfile);
      
      // Generate JWT token
      const token = authService.generateJWT(user);

      return reply.send({
        success: true,
        data: {
          user,
          token,
          expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        },
        message: 'Development authentication successful'
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Development auth error:', error);
      
      return reply.code(500).send({
        success: false,
        error: 'Development authentication failed'
      } as ApiResponse);
    }
  });

  // Get current user profile
  fastify.get('/me', {
    preHandler: authenticateUser
  }, async (request, reply) => {
    try {
      // User is guaranteed to exist due to auth middleware
      const user = request.user!;

      return reply.send({
        success: true,
        data: user
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error getting current user:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Update current user profile
  fastify.put<{
    Body: {
      name?: string;
      settings?: {
        defaultSender?: {
          name: string;
          email: string;
        };
        timezone?: string;
      };
    };
  }>('/me', {
    preHandler: authenticateUser
  }, async (request, reply) => {
    try {
      const user = request.user!;
      const { name, settings } = request.body;

      // Prepare update data
      const updateData: any = {};
      if (name) updateData.name = name.trim();
      if (settings) updateData.settings = settings;

      // Update user in database
      const { userService } = await import('../services/UserService');
      const updatedUser = await userService.updateUser(user.id, updateData);

      if (!updatedUser) {
        return reply.code(404).send({
          success: false,
          error: 'User not found'
        } as ApiResponse);
      }

      // Return updated user data
      const responseUser = {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        avatar: updatedUser.avatar,
        role: updatedUser.role,
        isActive: updatedUser.isActive
      };

      return reply.send({
        success: true,
        data: responseUser,
        message: 'Profile updated successfully'
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error updating user profile:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Refresh token endpoint
  fastify.post('/refresh', {
    preHandler: authenticateUser
  }, async (request, reply) => {
    try {
      const user = request.user!;
      
      // Generate new JWT token
      const token = authService.generateJWT(user);

      return reply.send({
        success: true,
        data: {
          token,
          expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        },
        message: 'Token refreshed successfully'
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error refreshing token:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Logout endpoint (client-side token invalidation)
  fastify.post('/logout', {
    preHandler: optionalAuth
  }, async (request, reply) => {
    try {
      // In a JWT-based system, logout is primarily client-side
      // The client should remove the token from storage
      // We could implement a token blacklist here if needed

      return reply.send({
        success: true,
        message: 'Logged out successfully'
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error during logout:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Verify token endpoint
  fastify.get('/verify', {
    preHandler: authenticateUser
  }, async (request, reply) => {
    try {
      const user = request.user!;

      return reply.send({
        success: true,
        data: {
          valid: true,
          user
        },
        message: 'Token is valid'
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error verifying token:', error);
      return reply.code(401).send({
        success: false,
        error: 'Invalid token'
      } as ApiResponse);
    }
  });
}
