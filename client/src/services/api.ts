
import { DashboardStats, EmailJob, EmailProvider, SubmitEmailRequest, SuppressionEntry, ChartData } from "@/types/api";

const API_BASE_URL = "http://localhost:3001/api";

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
    return this.request<{jobs: EmailJob[], total: number}>(`/email/jobs?${params}`);
  }

  async getEmailJob(id: string): Promise<EmailJob> {
    return this.request<EmailJob>(`/email/job/${id}`);
  }

  async submitEmailJob(data: SubmitEmailRequest): Promise<{jobId: string, message: string}> {
    return this.request<{jobId: string, message: string}>('/email/submit', {
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
}

export const apiService = new ApiService();
