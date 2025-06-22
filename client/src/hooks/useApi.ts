import { useAuth } from '@/contexts/AuthContext';
import { useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiOptions extends RequestInit {
  requireAuth?: boolean;
}

export const useApi = () => {
  const { token, logout } = useAuth();

  const apiCall = useCallback(async (
    endpoint: string, 
    options: ApiOptions = {}
  ): Promise<Response> => {
    const { requireAuth = true, headers = {}, ...restOptions } = options;

    const config: RequestInit = {
      ...restOptions,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    // Add authentication header if required and token exists
    if (requireAuth && token) {
      (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, config);

      // Handle authentication errors
      if (response.status === 401 && requireAuth) {
        // Token might be expired, logout user
        logout();
        throw new Error('Authentication required');
      }

      return response;
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  }, [token, logout]);

  const get = useCallback((endpoint: string, options: ApiOptions = {}) => {
    return apiCall(endpoint, { ...options, method: 'GET' });
  }, [apiCall]);

  const post = useCallback((endpoint: string, data?: any, options: ApiOptions = {}) => {
    return apiCall(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }, [apiCall]);

  const put = useCallback((endpoint: string, data?: any, options: ApiOptions = {}) => {
    return apiCall(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }, [apiCall]);

  const del = useCallback((endpoint: string, options: ApiOptions = {}) => {
    return apiCall(endpoint, { ...options, method: 'DELETE' });
  }, [apiCall]);

  const patch = useCallback((endpoint: string, data?: any, options: ApiOptions = {}) => {
    return apiCall(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }, [apiCall]);

  return {
    apiCall,
    get,
    post,
    put,
    delete: del,
    patch,
  };
};
