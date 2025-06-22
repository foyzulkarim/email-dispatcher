import { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from '../services/AuthService';
import { AuthenticatedUser } from '../types/auth';
import { UserRole } from '../types/enums';
import { ApiResponse } from '../types';

// Extend FastifyRequest to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

/**
 * Authentication middleware - verifies JWT token and attaches user to request
 */
export async function authenticateUser(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    const token = authService.extractTokenFromHeader(authHeader);

    if (!token) {
      return reply.code(401).send({
        success: false,
        error: 'Authentication token required'
      } as ApiResponse);
    }

    // Verify JWT token
    const payload = authService.verifyJWT(token);
    
    // Get user from database to ensure they're still active
    const user = await authService.getActiveUserById(payload.userId);
    
    if (!user) {
      return reply.code(401).send({
        success: false,
        error: 'Invalid or expired token'
      } as ApiResponse);
    }

    // Update last login timestamp (async, don't wait)
    authService.updateLastLogin(user.id).catch(console.error);

    // Attach user to request
    request.user = user;
    
  } catch (error) {
    console.error('Authentication error:', error);
    return reply.code(401).send({
      success: false,
      error: 'Invalid or expired token'
    } as ApiResponse);
  }
}

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export async function optionalAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    const token = authService.extractTokenFromHeader(authHeader);

    if (token) {
      const payload = authService.verifyJWT(token);
      const user = await authService.getActiveUserById(payload.userId);
      
      if (user) {
        request.user = user;
        // Update last login timestamp (async, don't wait)
        authService.updateLastLogin(user.id).catch(console.error);
      }
    }
  } catch (error) {
    // Silently ignore authentication errors for optional auth
    console.debug('Optional auth failed:', error);
  }
}

/**
 * Admin role middleware - requires user to be authenticated and have admin role
 */
export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // First authenticate the user
  await authenticateUser(request, reply);
  
  // If authentication failed, the response was already sent
  if (reply.sent) return;

  // Check if user has admin role
  if (!request.user || !authService.isAdmin(request.user)) {
    return reply.code(403).send({
      success: false,
      error: 'Admin privileges required'
    } as ApiResponse);
  }
}

/**
 * Role-based middleware factory
 */
export function requireRole(role: UserRole) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    // First authenticate the user
    await authenticateUser(request, reply);
    
    // If authentication failed, the response was already sent
    if (reply.sent) return;

    // Check if user has required role
    if (!request.user || !authService.hasRole(request.user, role)) {
      return reply.code(403).send({
        success: false,
        error: `${role} role required`
      } as ApiResponse);
    }
  };
}

/**
 * User ownership middleware - ensures user can only access their own resources
 */
export function requireOwnership(userIdParam: string = 'userId') {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    // First authenticate the user
    await authenticateUser(request, reply);
    
    // If authentication failed, the response was already sent
    if (reply.sent) return;

    const params = request.params as Record<string, string>;
    const resourceUserId = params[userIdParam];
    
    // Admin can access any resource
    if (request.user && authService.isAdmin(request.user)) {
      return;
    }

    // User can only access their own resources
    if (!request.user || request.user.id !== resourceUserId) {
      return reply.code(403).send({
        success: false,
        error: 'Access denied: You can only access your own resources'
      } as ApiResponse);
    }
  };
}

/**
 * Development mode middleware - bypasses auth in development with env token
 */
export async function developmentAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Only allow in development mode
  if (process.env.NODE_ENV === 'production') {
    return authenticateUser(request, reply);
  }

  // Check for development token in environment
  const devToken = process.env.DEV_AUTH_TOKEN;
  const authHeader = request.headers.authorization;
  
  if (devToken && authHeader === `Bearer ${devToken}`) {
    // Create a mock admin user for development
    request.user = {
      id: 'dev-user-id',
      email: 'dev@example.com',
      name: 'Development User',
      role: UserRole.ADMIN,
      isActive: true
    };
    return;
  }

  // Fall back to normal authentication
  return authenticateUser(request, reply);
}
