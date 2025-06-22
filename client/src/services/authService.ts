import { AuthResponse, User, ProfileUpdateData } from '@/types/auth';

const API_BASE_URL = "http://localhost:4000/api";

class AuthService {
  private baseURL = `${API_BASE_URL}/auth`;

  // Google OAuth login
  async loginWithGoogle(idToken: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      return data;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  }

  // Development login
  async loginDev(email: string, name?: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/dev-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Development login failed');
      }

      return data;
    } catch (error) {
      console.error('Development login error:', error);
      throw error;
    }
  }

  // Get current user
  async getCurrentUser(token: string): Promise<User> {
    try {
      const response = await fetch(`${this.baseURL}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get user');
      }

      return data.data;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(token: string, profileData: ProfileUpdateData): Promise<User> {
    try {
      const response = await fetch(`${this.baseURL}/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      return data.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  // Refresh token
  async refreshToken(token: string): Promise<{ token: string; expiresIn: string }> {
    try {
      const response = await fetch(`${this.baseURL}/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to refresh token');
      }

      return data.data;
    } catch (error) {
      console.error('Refresh token error:', error);
      throw error;
    }
  }

  // Verify token
  async verifyToken(token: string): Promise<{ valid: boolean; user: User }> {
    try {
      const response = await fetch(`${this.baseURL}/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Token verification failed');
      }

      return data.data;
    } catch (error) {
      console.error('Token verification error:', error);
      throw error;
    }
  }

  // Logout
  async logout(token?: string): Promise<void> {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      await fetch(`${this.baseURL}/logout`, {
        method: 'POST',
        headers,
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Don't throw error for logout - always succeed locally
    }
  }

  // Token storage utilities
  saveToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  removeToken(): void {
    localStorage.removeItem('authToken');
  }

  // User storage utilities
  saveUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  getUser(): User | null {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }

  removeUser(): void {
    localStorage.removeItem('user');
  }

  // Clear all auth data
  clearAuthData(): void {
    this.removeToken();
    this.removeUser();
  }
}

export const authService = new AuthService();
