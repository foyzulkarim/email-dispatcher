import { v4 as uuidv4 } from 'uuid';
import { UserModel } from '../models/User';
import type { User } from '../types';
import { GoogleUserProfile, CreateUserFromGoogleProfile } from '../types/auth';

/**
 * Creates a new user from Google OAuth profile data
 */
export async function createUserFromGoogleProfile(profile: GoogleUserProfile): Promise<User> {
  const userData: CreateUserFromGoogleProfile & { id: string } = {
    id: uuidv4(),
    googleId: profile.id,
    email: profile.email.toLowerCase(),
    name: profile.name,
    avatar: profile.picture
  };

  const user = new UserModel(userData);
  await user.save();
  
  return user.toObject();
}

/**
 * Finds or creates a user based on Google OAuth profile
 */
export async function findOrCreateUserFromGoogle(profile: GoogleUserProfile): Promise<User> {
  // First try to find by Google ID
  let user = await UserModel.findOne({ googleId: profile.id, isActive: true });
  
  if (user) {
    // Update last login and potentially refresh profile data
    user.lastLoginAt = new Date();
    if (profile.picture && profile.picture !== user.avatar) {
      user.avatar = profile.picture;
    }
    if (profile.name && profile.name !== user.name) {
      user.name = profile.name;
    }
    await user.save();
    return user.toObject();
  }

  // If not found by Google ID, try by email (for existing users who haven't linked Google yet)
  user = await UserModel.findOne({ email: profile.email.toLowerCase(), isActive: true });
  
  if (user) {
    // Link the Google account to existing user
    user.googleId = profile.id;
    user.lastLoginAt = new Date();
    if (profile.picture) {
      user.avatar = profile.picture;
    }
    await user.save();
    return user.toObject();
  }

  // Create new user
  return await createUserFromGoogleProfile(profile);
}

/**
 * Updates user's last login timestamp
 */
export async function updateLastLogin(userId: string): Promise<void> {
  await UserModel.updateOne(
    { id: userId, isActive: true },
    { lastLoginAt: new Date() }
  );
}
