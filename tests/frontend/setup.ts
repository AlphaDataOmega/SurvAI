/**
 * @fileoverview Frontend test setup
 * 
 * Setup configuration for frontend (React) tests
 * including React Testing Library and Jest DOM matchers.
 */

import '@testing-library/jest-dom'
import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals'
import { cleanup } from '@testing-library/react'

// Mock environment variables for tests
process.env.NODE_ENV = 'test'

// Increase timeout for async operations
jest.setTimeout(10000)

/**
 * Global test setup
 */
beforeAll(() => {
  console.log('[TEST] Frontend test setup started')
  
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
  })

  // Mock IntersectionObserver
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }))

  // Mock ResizeObserver
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }))

  // Mock window.scrollTo
  Object.defineProperty(window, 'scrollTo', {
    writable: true,
    value: jest.fn(),
  })

  // Mock localStorage
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  }
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  })

  // Mock sessionStorage
  const sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  }
  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
  })

  // Mock import.meta
  global.importMetaEnv = {
    DEV: true,
    VITE_API_URL: 'http://localhost:8000',
  }

  console.log('[TEST] Frontend test setup completed')
})

/**
 * Global test teardown
 */
afterAll(() => {
  console.log('[TEST] Frontend test teardown started')
  
  // Clean up any global resources
  cleanup()
  
  console.log('[TEST] Frontend test teardown completed')
})

/**
 * Test case setup
 */
beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks()
  
  // Clear localStorage and sessionStorage
  window.localStorage.clear()
  window.sessionStorage.clear()
})

/**
 * Test case teardown
 */
afterEach(() => {
  // Clean up DOM after each test
  cleanup()
  
  // Restore all mocks
  jest.restoreAllMocks()
})

// Mock fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
  })
) as jest.Mock

// Mock axios for API calls
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn().mockResolvedValue({ data: {} }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    patch: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
  isAxiosError: jest.fn(() => false),
}))

// Mock React Router
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({
    pathname: '/',
    search: '',
    hash: '',
    state: null,
  }),
  useParams: () => ({}),
}))

// Mock React Query
jest.mock('react-query', () => ({
  QueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
  })),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
  useQuery: jest.fn(() => ({
    data: undefined,
    error: null,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  })),
  useMutation: jest.fn(() => ({
    mutate: jest.fn(),
    isLoading: false,
    isError: false,
    error: null,
  })),
  ReactQueryDevtools: () => null,
}))

export {}