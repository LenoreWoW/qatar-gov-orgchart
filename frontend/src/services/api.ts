import type { AxiosInstance, AxiosResponse } from 'axios';
import axios from 'axios';
import type {
  ApiResponse,
  PaginatedResponse,
  User,
  LoginRequest,
  LoginResponse,
  Ministry,
  Department,
  Position,
  PositionCreateRequest,
  Attribute,
  AttributeCreateRequest,
  HierarchyNode,
  PositionFormData,
  AttributeFormData,
} from '../types/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: 'http://localhost:3001/api/v1',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      config => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle auth errors
    this.api.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth Methods
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response: AxiosResponse<ApiResponse<LoginResponse>> = await this.api.post(
      '/auth/login',
      credentials
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Login failed');
  }

  async logout(): Promise<void> {
    await this.api.post('/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.get('/auth/me');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to get current user');
  }

  async refreshToken(): Promise<{ token: string; expiresIn: string }> {
    const response: AxiosResponse<ApiResponse<{ token: string; expiresIn: string }>> =
      await this.api.post('/auth/refresh');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to refresh token');
  }

  // User Management
  async getUsers(params?: {
    role?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<User>> {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<User>>> = await this.api.get(
      '/users',
      { params }
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch users');
  }

  async getUser(id: string): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.get(`/users/${id}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch user');
  }

  // Ministry Management
  async getMinistries(): Promise<Ministry[]> {
    const response: AxiosResponse<ApiResponse<Ministry[]>> = await this.api.get('/ministries');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch ministries');
  }

  async getMinistry(id: string): Promise<Ministry> {
    const response: AxiosResponse<ApiResponse<Ministry>> = await this.api.get(`/ministries/${id}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch ministry');
  }

  // Department Management
  async getDepartments(params?: { ministry_id?: string }): Promise<Department[]> {
    const response: AxiosResponse<ApiResponse<Department[]>> = await this.api.get('/departments', {
      params,
    });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch departments');
  }

  async getDepartment(id: string): Promise<Department> {
    const response: AxiosResponse<ApiResponse<Department>> = await this.api.get(
      `/departments/${id}`
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch department');
  }

  // Position Management
  async getPositions(params?: {
    ministry_id?: string;
    department_id?: string;
    status?: string;
    grade_min?: number;
    grade_max?: number;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Position>> {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<Position>>> = await this.api.get(
      '/positions',
      { params }
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch positions');
  }

  async getPosition(id: string): Promise<Position> {
    const response: AxiosResponse<ApiResponse<Position>> = await this.api.get(`/positions/${id}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch position');
  }

  async createPosition(data: PositionFormData): Promise<{ id: string }> {
    const response: AxiosResponse<ApiResponse<{ id: string }>> = await this.api.post(
      '/positions',
      data
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to create position');
  }

  async updatePosition(id: string, data: Partial<PositionFormData>): Promise<void> {
    const response: AxiosResponse<ApiResponse> = await this.api.put(`/positions/${id}`, data);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to update position');
    }
  }

  async deletePosition(id: string): Promise<void> {
    const response: AxiosResponse<ApiResponse> = await this.api.delete(`/positions/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete position');
    }
  }

  async assignAttributeToPosition(
    positionId: string,
    data: {
      attribute_id: string;
      assigned_date?: string;
      expiry_date?: string;
      notes?: string;
    }
  ): Promise<{ id: string }> {
    const response: AxiosResponse<ApiResponse<{ id: string }>> = await this.api.post(
      `/positions/${positionId}/attributes`,
      data
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to assign attribute to position');
  }

  async removeAttributeFromPosition(positionId: string, attributeId: string): Promise<void> {
    const response: AxiosResponse<ApiResponse> = await this.api.delete(
      `/positions/${positionId}/attributes/${attributeId}`
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to remove attribute from position');
    }
  }

  // Attribute Management
  async getAttributes(params?: {
    type?: string;
    category?: string;
    active_only?: boolean;
  }): Promise<Attribute[]> {
    const response: AxiosResponse<ApiResponse<Attribute[]>> = await this.api.get('/attributes', {
      params,
    });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch attributes');
  }

  async getAttribute(id: string): Promise<Attribute> {
    const response: AxiosResponse<ApiResponse<Attribute>> = await this.api.get(`/attributes/${id}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch attribute');
  }

  async createAttribute(data: AttributeFormData): Promise<{ id: string }> {
    const response: AxiosResponse<ApiResponse<{ id: string }>> = await this.api.post(
      '/attributes',
      data
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to create attribute');
  }

  async updateAttribute(id: string, data: Partial<AttributeFormData>): Promise<void> {
    const response: AxiosResponse<ApiResponse> = await this.api.put(`/attributes/${id}`, data);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to update attribute');
    }
  }

  async deleteAttribute(id: string): Promise<void> {
    const response: AxiosResponse<ApiResponse> = await this.api.delete(`/attributes/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete attribute');
    }
  }

  // Organizational Hierarchy
  async getOrganizationHierarchy(ministryId: string): Promise<HierarchyNode[]> {
    const response: AxiosResponse<ApiResponse<HierarchyNode[]>> = await this.api.get(
      `/organization/hierarchy/${ministryId}`
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch organization hierarchy');
  }

  // Audit endpoints
  async getAuditLogs(filter?: any): Promise<{ data: any[]; pagination: any }> {
    const response = await this.api.get('/audit', { params: filter });
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch audit logs');
  }

  async getAuditStats(startDate?: string, endDate?: string): Promise<any> {
    const response = await this.api.get('/audit/stats', {
      params: { startDate, endDate },
    });
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch audit stats');
  }

  async exportAuditLogs(filter?: any, format: 'csv' | 'json' | 'pdf' = 'csv'): Promise<Blob> {
    const response = await this.api.get('/audit/export', {
      params: { ...filter, format },
      responseType: 'blob',
    });
    return response.data;
  }

  async batchAuditLogs(events: any[]): Promise<void> {
    const response = await this.api.post('/audit/batch', { events });
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to batch audit logs');
    }
  }
}

export const apiService = new ApiService();
export default apiService;
