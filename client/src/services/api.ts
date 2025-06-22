import { DashboardStats, EmailJob, EmailProvider, SubmitEmailRequest, SuppressionEntry, ChartData, DynamicProvider, DynamicProviderListResponse, DynamicProviderResponse, ProviderPreset, SimpleProviderRequest, AdvancedProviderRequest, TestProviderRequest, TestProviderResponse, BulkProviderRequest } from "@/types/api";

const API_BASE_URL = "http://localhost:4000/api";

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Dashboard endpoints
  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/dashboard/stats');
  }

  async getChartData(type: 'volume' | 'providers', days: number = 7): Promise<ChartData[]> {
    return this.request<ChartData[]>(`/dashboard/chart/${type}?days=${days}`);
  }

  // Email job endpoints
  async getEmailJobs(page: number = 1, limit: number = 20, status?: string): Promise<{jobs: EmailJob[], total: number}> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status }),
    });
    return this.request<{jobs: EmailJob[], total: number}>(`/email-jobs?${params}`);
  }

  async getEmailJob(id: string): Promise<EmailJob> {
    return this.request<EmailJob>(`/email-jobs/${id}`);
  }

  async submitEmailJob(data: SubmitEmailRequest): Promise<{jobId: string, message: string}> {
    return this.request<{jobId: string, message: string}>('/email-jobs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Provider endpoints
  async getProviders(): Promise<EmailProvider[]> {
    return this.request<EmailProvider[]>('/provider/list');
  }

  async updateProviderStatus(id: string, enabled: boolean): Promise<void> {
    await this.request(`/provider/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    });
  }

  async resetProviderQuota(id: string): Promise<void> {
    await this.request(`/provider/${id}/reset-quota`, {
      method: 'POST',
    });
  }

  // Suppression list endpoints
  async getSuppressionList(page: number = 1, limit: number = 50): Promise<{entries: SuppressionEntry[], total: number}> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    return this.request<{entries: SuppressionEntry[], total: number}>(`/suppression/list?${params}`);
  }

  async addSuppressionEntry(email: string, reason: string, notes?: string): Promise<void> {
    await this.request('/suppression/add', {
      method: 'POST',
      body: JSON.stringify({ email, reason, notes }),
    });
  }

  async removeSuppressionEntry(id: string): Promise<void> {
    await this.request(`/suppression/remove/${id}`, {
      method: 'DELETE',
    });
  }

  // Dynamic Provider endpoints (UserProvider)
  async getDynamicProviders(isActive?: boolean): Promise<DynamicProviderListResponse> {
    const params = isActive !== undefined ? `?isActive=${isActive}` : '';
    return this.request<DynamicProviderListResponse>(`/user-providers${params}`);
  }

  async getDynamicProvider(id: string): Promise<DynamicProviderResponse> {
    return this.request<DynamicProviderResponse>(`/user-providers/${id}`);
  }

  async createSimpleProvider(data: SimpleProviderRequest): Promise<DynamicProviderResponse> {
    return this.request<DynamicProviderResponse>('/user-providers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createAdvancedProvider(data: AdvancedProviderRequest): Promise<DynamicProviderResponse> {
    return this.request<DynamicProviderResponse>('/user-providers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async testProviderConfiguration(data: TestProviderRequest): Promise<{data: TestProviderResponse}> {
    return this.request<{data: TestProviderResponse}>('/user-providers/test', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDynamicProvider(id: string, data: Partial<SimpleProviderRequest>): Promise<DynamicProviderResponse> {
    return this.request<DynamicProviderResponse>(`/user-providers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDynamicProvider(id: string): Promise<{message: string}> {
    return this.request<{message: string}>(`/user-providers/${id}`, {
      method: 'DELETE',
    });
  }

  async bulkProviderOperation(data: BulkProviderRequest): Promise<{message: string}> {
    return this.request<{message: string}>('/user-providers/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get available platforms
  async getPlatforms(): Promise<{success: boolean, data: any[]}> {
    return this.request<{success: boolean, data: any[]}>('/platforms');
  }
}

export const apiService = new ApiService();
