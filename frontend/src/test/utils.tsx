import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n/test-i18n';

// Create a test query client
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });

// Mock AuthContext for tests
const mockAuthContext = {
  user: {
    id: 'test-user-1',
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'admin' as const,
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  refreshUser: vi.fn(),
};

export const AuthContext = React.createContext(mockAuthContext);

// Custom render with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  queryClient?: QueryClient;
  authContext?: typeof mockAuthContext;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    route = '/',
    queryClient = createTestQueryClient(),
    authContext = mockAuthContext,
    ...renderOptions
  }: CustomRenderOptions = {}
): RenderResult & { queryClient: QueryClient } {
  // Set the initial route
  window.history.pushState({}, 'Test page', route);

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <AuthContext.Provider value={authContext}>
            <BrowserRouter>{children}</BrowserRouter>
          </AuthContext.Provider>
        </I18nextProvider>
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

// Helper for testing async components
export const waitForLoadingToFinish = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

// Mock data generators
export const createMockUser = (overrides: Partial<typeof mockAuthContext.user> = {}) => ({
  ...mockAuthContext.user,
  ...overrides,
});

export const createMockMinistry = (overrides: any = {}) => ({
  id: 'ministry-1',
  name: 'Ministry of Test',
  nameAr: 'وزارة الاختبار',
  description: 'Test ministry for unit tests',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockPosition = (overrides: any = {}) => ({
  id: 'position-1',
  title: 'Test Position',
  titleAr: 'منصب الاختبار',
  description: 'Test position for unit tests',
  grade: 12,
  status: 'active' as const,
  ministryId: 'ministry-1',
  departmentId: 'department-1',
  parentId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockAttribute = (overrides: any = {}) => ({
  id: 'attribute-1',
  name: 'Test Attribute',
  nameAr: 'صفة الاختبار',
  type: 'qualification' as const,
  description: 'Test attribute for unit tests',
  isRequired: false,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Utility to mock API responses
export const mockApiResponse = <T>(data: T, delay = 0) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(data), delay));

export const mockApiError = (message = 'Test error', delay = 0) =>
  new Promise((_, reject) => setTimeout(() => reject(new Error(message)), delay));

// Test helpers for form interactions
export const fillInput = async (input: HTMLElement, value: string) => {
  const { fireEvent } = await import('@testing-library/react');
  fireEvent.change(input, { target: { value } });
};

export const clickButton = async (button: HTMLElement) => {
  const { fireEvent } = await import('@testing-library/react');
  fireEvent.click(button);
};

// Re-export everything from testing library for convenience
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';