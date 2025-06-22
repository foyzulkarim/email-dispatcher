export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin';
  isActive: boolean;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: User;
    token: string;
    expiresIn: string;
  };
  error?: string;
  message?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (idToken: string) => Promise<void>;
  loginDev: (email: string, name?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshToken: () => Promise<void>;
}

export interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
}

export interface ProfileUpdateData {
  name?: string;
  settings?: {
    defaultSender?: {
      name: string;
      email: string;
    };
    timezone?: string;
  };
}
