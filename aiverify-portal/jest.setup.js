// jest.setup.js
import '@testing-library/jest-dom';

// React 19 specific setup
import React from 'react';

// Ensure React is properly initialized for tests
if (typeof globalThis !== 'undefined') {
  globalThis.React = React;
}

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn(),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    };
  },
}));

// Mock Next.js navigation (App Router)
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    };
  },
  usePathname() {
    return '/';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Increase timeout for async operations
jest.setTimeout(10000);

// Global test utilities
global.testUtils = {
  // Helper to create mock projects
  createMockProject: (overrides = {}) => ({
    id: 1,
    globalVars: [],
    pages: [],
    templateId: 'template1',
    projectInfo: {
      name: 'Test Project',
      description: 'Test Description',
      reportTitle: 'Test Report',
      company: 'Test Company',
    },
    testModelId: 1,
    inputBlocks: [],
    testResults: [],
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    ...overrides,
  }),

  // Helper to wait for async operations
  waitForAsync: async (fn, timeout = 1000) => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      try {
        await fn();
        return;
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    throw new Error(`Timeout waiting for async operation after ${timeout}ms`);
  },

  // Helper to create mock API responses
  createMockApiResponse: (data, options = {}) => ({
    ok: true,
    status: 200,
    json: async () => data,
    ...options,
  }),

  // Helper to create mock API error responses
  createMockApiError: (message, status = 500) => ({
    ok: false,
    status,
    json: async () => ({ message }),
    text: async () => message,
  }),
};

// Console warning suppression for known issues
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    args[0] &&
    typeof args[0] === 'string' &&
    (args[0].includes('ReactDOM.render is deprecated') ||
      args[0].includes('Warning: Failed prop type'))
  ) {
    return;
  }
  originalWarn(...args);
};

// Console error suppression for known issues
const originalError = console.error;
console.error = (...args) => {
  if (
    args[0] &&
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render is deprecated') ||
      args[0].includes('Error: Uncaught'))
  ) {
    return;
  }
  originalError(...args);
};

// Custom matchers for better assertions
expect.extend({
  toHaveBeenCalledWithProject(received, expected) {
    const pass = received.mock.calls.some(call => 
      call[0] && call[0].id === expected.id
    );
    
    if (pass) {
      return {
        message: () => `Expected mock not to have been called with project ${expected.id}`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected mock to have been called with project ${expected.id}`,
        pass: false,
      };
    }
  },
  
  toHaveValidProjectStructure(received) {
    const requiredFields = ['id', 'projectInfo', 'created_at', 'updated_at'];
    const hasAllFields = requiredFields.every(field => 
      received.hasOwnProperty(field)
    );
    
    if (hasAllFields) {
      return {
        message: () => `Expected project not to have valid structure`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected project to have valid structure with fields: ${requiredFields.join(', ')}`,
        pass: false,
      };
    }
  },
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
}); 