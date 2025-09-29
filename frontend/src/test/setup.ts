import '@testing-library/jest-dom';

// Global test setup
beforeEach(() => {
  // Reset localStorage before each test
  localStorage.clear();
  sessionStorage.clear();

  // Reset document title
  document.title = 'Test';

  // Reset document classes
  document.documentElement.className = '';
  document.body.className = '';

  // Reset document direction
  document.documentElement.dir = 'ltr';
  document.documentElement.lang = 'en';
});

// Mock window.location for tests
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    reload: vi.fn(),
    assign: vi.fn(),
    replace: vi.fn(),
  },
  writable: true,
});

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = (...args: any[]) => {
    // Only show React Testing Library errors and real errors
    if (
      args[0]?.includes?.('Warning:') ||
      args[0]?.includes?.('Error:') ||
      args[0]?.includes?.('ReactDOM.render')
    ) {
      originalConsoleError(...args);
    }
  };

  console.warn = (...args: any[]) => {
    // Suppress specific warnings we expect in tests
    if (args[0]?.includes?.('act(') || args[0]?.includes?.('Warning:')) {
      return;
    }
    originalConsoleWarn(...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Add custom matchers
expect.extend({
  toBeInTheDocument: (received) => {
    const pass = received && document.body.contains(received);
    return {
      pass,
      message: () => pass
        ? `Expected element not to be in the document`
        : `Expected element to be in the document`,
    };
  },
});