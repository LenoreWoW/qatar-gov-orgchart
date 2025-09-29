// Mock API service for development and testing when backend is not available
import type {
  User,
  LoginRequest,
  LoginResponse,
  Ministry,
  Department,
  Position,
  Attribute
} from '../types/api';

// Mock data
const mockUsers: User[] = [
  {
    id: 'user-admin',
    username: 'admin',
    email: 'admin@qatar.gov.qa',
    firstName: 'System',
    lastName: 'Administrator',
    role: 'admin',
    status: 'active',
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'user-planner',
    username: 'planner',
    email: 'planner@qatar.gov.qa',
    firstName: 'Organizational',
    lastName: 'Planner',
    role: 'planner',
    status: 'active',
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'user-hr',
    username: 'hr',
    email: 'hr@qatar.gov.qa',
    firstName: 'HR',
    lastName: 'Manager',
    role: 'hr',
    status: 'active',
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockMinistries: Ministry[] = [
  {
    id: 'ministry-1',
    name: 'Ministry of Interior',
    nameAr: 'وزارة الداخلية',
    description: 'Ministry responsible for internal security and civil affairs',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ministry-2',
    name: 'Ministry of Finance',
    nameAr: 'وزارة المالية',
    description: 'Ministry responsible for financial affairs and budget',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockPositions: Position[] = [
  {
    id: 'position-1',
    title: 'Minister',
    titleAr: 'وزير',
    description: 'Head of the ministry',
    grade: 20,
    status: 'active',
    ministryId: 'ministry-1',
    departmentId: 'dept-1',
    parentId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockAttributes: Attribute[] = [
  {
    id: 'attr-1',
    name: 'Security Clearance',
    nameAr: 'التصريح الأمني',
    type: 'security',
    description: 'Required security clearance level',
    isRequired: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class MockApiService {
  private currentUser: User | null = null;

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    await delay(1000); // Simulate network delay

    // Find user by username
    const user = mockUsers.find(u => u.username === credentials.username);

    // For demo purposes, accept any password that matches the username
    // In production, this would be properly secured
    if (user && credentials.password === credentials.username) {
      this.currentUser = user;
      return {
        token: `mock-jwt-token-${user.id}`,
        user: user,
        expiresIn: '24h',
      };
    }

    throw new Error('Invalid credentials. Try: admin/admin, planner/planner, or hr/hr');
  }

  async logout(): Promise<void> {
    await delay(500);
    this.currentUser = null;
  }

  async getCurrentUser(): Promise<User> {
    await delay(500);
    return this.currentUser || mockUsers[0]; // Default to admin user
  }

  async refreshToken(): Promise<{ token: string; expiresIn: string }> {
    await delay(500);
    return {
      token: 'mock-refreshed-token-67890',
      expiresIn: '24h',
    };
  }

  async getMinistries(): Promise<Ministry[]> {
    await delay(800);
    return mockMinistries;
  }

  async getPositions(): Promise<{ data: Position[]; pagination: any }> {
    await delay(800);
    return {
      data: mockPositions,
      pagination: { total: 1, page: 1, limit: 10 }
    };
  }

  async getAttributes(): Promise<Attribute[]> {
    await delay(600);
    return mockAttributes;
  }

  async getUsers(): Promise<{ data: User[]; pagination: any }> {
    await delay(700);
    return {
      data: mockUsers,
      pagination: { total: mockUsers.length, page: 1, limit: 10 }
    };
  }
}

export const mockApiService = new MockApiService();