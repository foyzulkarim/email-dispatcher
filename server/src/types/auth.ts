// Authentication-related types

export interface GoogleUserProfile {
  id: string; // Google ID
  email: string;
  name: string;
  picture?: string; // Profile picture URL
  given_name?: string;
  family_name?: string;
  locale?: string;
  verified_email?: boolean;
}

export interface CreateUserFromGoogleProfile {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin';
  isActive: boolean;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin';
  iat?: number;
  exp?: number;
}
