import { v4 as uuidv4 } from 'uuid';
import { UserModel } from '../models/User';
import { userService } from '../services/UserService';
import type { User } from '../types';
import { GoogleUserProfile, CreateUserFromGoogleProfile } from '../types/auth';

/**
 * Creates a new user from Google OAuth profile data
 */
export async function createUserFromGoogleProfile(profile: GoogleUserProfile): Promise<User> {
  const userData = {
    googleId: profile.id,
    email: profile.email.toLowerCase(),
    name: profile.name,
    avatar: profile.picture
  };

  return await userService.createUser(userData);
}

/**
 * Finds or creates a user based on Google OAuth profile
 */
export async function findOrCreateUserFromGoogle(profile: GoogleUserProfile): Promise<User> {
  // First try to find by Google ID
  let user = await userService.getUserByGoogleId(profile.id);
  
  if (user) {
    // Update last login and potentially refresh profile data
    await userService.updateLastLogin(user.id);
    
    // Update profile data if changed
    const updates: any = {};
    if (profile.picture && profile.picture !== user.avatar) {
      updates.avatar = profile.picture;
    }
    if (profile.name && profile.name !== user.name) {
      updates.name = profile.name;
    }
    
    if (Object.keys(updates).length > 0) {
      const updatedUser = await userService.updateUser(user.id, updates);
      return updatedUser || user;
    }
    
    return user;
  }

  // If not found by Google ID, try by email (for existing users who haven't linked Google yet)
  user = await userService.getUserByEmail(profile.email);
  
  if (user) {
    // Link the Google account to existing user
    const updates: any = { googleId: profile.id };
    if (profile.picture) {
      updates.avatar = profile.picture;
    }
    
    await userService.updateUser(user.id, updates);
    await userService.updateLastLogin(user.id);
    
    const updatedUser = await userService.getUserById(user.id);
    return updatedUser || user;
  }

  // Create new user
  return await createUserFromGoogleProfile(profile);
}

/**
 * Updates user's last login timestamp
 */
export async function updateLastLogin(userId: string): Promise<void> {
  await userService.updateLastLogin(userId);
}
