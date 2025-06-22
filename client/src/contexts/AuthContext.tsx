import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthContextType, User } from '@/types/auth';
import { authService } from '@/services/authService';
import { toast } from 'sonner';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedToken = authService.getToken();
        const savedUser = authService.getUser();

        if (savedToken && savedUser) {
          // Verify token is still valid
          try {
            const verification = await authService.verifyToken(savedToken);
            if (verification.valid) {
              setToken(savedToken);
              setUser(verification.user);
            } else {
              // Token invalid, clear auth data
              authService.clearAuthData();
            }
          } catch (error) {
            // Token verification failed, clear auth data
            console.error('Token verification failed:', error);
            authService.clearAuthData();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        authService.clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Auto-refresh token before expiration
  useEffect(() => {
    if (!token) return;

    // Set up token refresh interval (refresh every 6 days if token expires in 7 days)
    const refreshInterval = setInterval(async () => {
      try {
        const refreshData = await authService.refreshToken(token);
        setToken(refreshData.token);
        authService.saveToken(refreshData.token);
        console.log('Token refreshed successfully');
      } catch (error) {
        console.error('Token refresh failed:', error);
        logout();
      }
    }, 6 * 24 * 60 * 60 * 1000); // 6 days

    return () => clearInterval(refreshInterval);
  }, [token]);

  const login = async (idToken: string): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authService.loginWithGoogle(idToken);
      
      if (response.success && response.data) {
        const { user: userData, token: authToken } = response.data;
        
        setUser(userData);
        setToken(authToken);
        
        // Save to localStorage
        authService.saveUser(userData);
        authService.saveToken(authToken);
        
        toast.success(`Welcome back, ${userData.name}!`);
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginDev = async (email: string, name?: string): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authService.loginDev(email, name);
      
      if (response.success && response.data) {
        const { user: userData, token: authToken } = response.data;
        
        setUser(userData);
        setToken(authToken);
        
        // Save to localStorage
        authService.saveUser(userData);
        authService.saveToken(authToken);
        
        toast.success(`Development login successful: ${userData.name}`);
      } else {
        throw new Error(response.error || 'Development login failed');
      }
    } catch (error) {
      console.error('Development login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Development login failed';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Call logout endpoint
      if (token) {
        await authService.logout(token);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state
      setUser(null);
      setToken(null);
      authService.clearAuthData();
      toast.success('Logged out successfully');
    }
  };

  const updateProfile = async (profileData: Partial<User>): Promise<void> => {
    if (!token) {
      throw new Error('No authentication token');
    }

    try {
      const updatedUser = await authService.updateProfile(token, profileData);
      setUser(updatedUser);
      authService.saveUser(updatedUser);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Profile update error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      toast.error(errorMessage);
      throw error;
    }
  };

  const refreshToken = async (): Promise<void> => {
    if (!token) {
      throw new Error('No authentication token');
    }

    try {
      const refreshData = await authService.refreshToken(token);
      setToken(refreshData.token);
      authService.saveToken(refreshData.token);
    } catch (error) {
      console.error('Token refresh error:', error);
      logout(); // If refresh fails, logout user
      throw error;
    }
  };

  const contextValue: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    loginDev,
    logout,
    updateProfile,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
