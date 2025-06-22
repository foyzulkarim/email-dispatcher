import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';
import { userService } from './UserService';
import { GoogleUserProfile, CreateUserFromGoogleProfile, AuthenticatedUser, JWTPayload } from '../types/auth';
import { UserRole } from '../types/enums';
import { v4 as uuidv4 } from 'uuid';

class AuthService {
  private googleClient: OAuth2Client;
  private jwtSecret: string;
  private jwtExpiresIn: string;

  constructor() {
    // Initialize Google OAuth client
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn('⚠️  GOOGLE_CLIENT_ID not found in environment variables. Google auth will not work.');
    }
    this.googleClient = new OAuth2Client(clientId);
    
    // JWT configuration
    this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    
    if (!process.env.JWT_SECRET) {
      console.warn('⚠️  JWT_SECRET not found in environment variables. Using default secret (not secure for production).');
    }
  }

  /**
   * Verify Google ID token and extract user profile
   */
  async verifyGoogleToken(idToken: string): Promise<GoogleUserProfile> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Invalid Google token payload');
      }

      return {
        id: payload.sub,
        email: payload.email!,
        name: payload.name!,
        picture: payload.picture,
        given_name: payload.given_name,
        family_name: payload.family_name,
        locale: payload.locale,
        verified_email: payload.email_verified
      };
    } catch (error) {
      console.error('Error verifying Google token:', error);
      throw new Error('Invalid Google token');
    }
  }

  /**
   * Create or update user from Google profile
   */
  async createOrUpdateUserFromGoogle(googleProfile: GoogleUserProfile): Promise<AuthenticatedUser> {
    try {
      // Check if user already exists by Google ID
      let user = await UserModel.findOne({ googleId: googleProfile.id });

      if (user) {
        // Update existing user's last login and profile info
        user.lastLoginAt = new Date();
        user.name = googleProfile.name;
        user.email = googleProfile.email.toLowerCase();
        if (googleProfile.picture) {
          user.avatar = googleProfile.picture;
        }
        await user.save();
      } else {
        // Check if user exists by email (for migration purposes)
        user = await UserModel.findOne({ email: googleProfile.email.toLowerCase() });
        
        if (user) {
          // Link existing user to Google account
          user.googleId = googleProfile.id;
          user.lastLoginAt = new Date();
          user.name = googleProfile.name;
          if (googleProfile.picture) {
            user.avatar = googleProfile.picture;
          }
          await user.save();
        } else {
          // Create new user
          const createUserData: CreateUserFromGoogleProfile = {
            googleId: googleProfile.id,
            email: googleProfile.email.toLowerCase(),
            name: googleProfile.name,
            avatar: googleProfile.picture
          };

          user = await this.createUserFromGoogleProfile(createUserData);
        }
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        isActive: user.isActive
      };
    } catch (error) {
      console.error('Error creating/updating user from Google:', error);
      throw new Error('Failed to process user authentication');
    }
  }

  /**
   * Create a new user from Google profile
   */
  private async createUserFromGoogleProfile(profileData: CreateUserFromGoogleProfile) {
    const userData = {
      id: uuidv4(),
      googleId: profileData.googleId,
      email: profileData.email,
      name: profileData.name,
      avatar: profileData.avatar,
      isActive: true,
      role: UserRole.USER,
      lastLoginAt: new Date(),
      settings: {
        timezone: 'UTC'
      }
    };

    const user = new UserModel(userData);
    await user.save();
    return user;
  }

  /**
   * Generate JWT token for authenticated user
   */
  generateJWT(user: AuthenticatedUser): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const options: jwt.SignOptions = {
      expiresIn: 3600,
    };
    // const accessToken = jwt.sign(payload, secret, options) as string;
    const token = jwt.sign(payload, this.jwtSecret as string, options);

    return token;
  }

  /**
   * Verify and decode JWT token
   */
  verifyJWT(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.jwtSecret as string, {
        issuer: 'email-dispatcher',
        audience: 'email-dispatcher-client'
      }) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }
    
    return parts[1];
  }

  /**
   * Get user by ID and verify they're active
   */
  async getActiveUserById(userId: string): Promise<AuthenticatedUser | null> {
    try {
      const user = await UserModel.findOne({ 
        id: userId, 
        isActive: true 
      });

      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        isActive: user.isActive
      };
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  /**
   * Refresh user's last login timestamp
   */
  async updateLastLogin(userId: string): Promise<void> {
    try {
      await UserModel.updateOne(
        { id: userId },
        { lastLoginAt: new Date() }
      );
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  /**
   * Check if user has required role
   */
  hasRole(user: AuthenticatedUser, requiredRole: UserRole): boolean {
    // Admin has access to everything
    if (user.role === UserRole.ADMIN) return true;
    
    // Check specific role
    return user.role === requiredRole;
  }

  /**
   * Check if user has admin privileges
   */
  isAdmin(user: AuthenticatedUser): boolean {
    return user.role === UserRole.ADMIN;
  }
}

export const authService = new AuthService();
