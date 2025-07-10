/**
 * @fileoverview AuthProviderWrapper examples
 * 
 * Example wrapper components showing proper AuthProvider usage patterns
 * for testing and production environments. Referenced in ISSUES_01.md.
 */

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider } from '../frontend/src/hooks/useAuth';

/**
 * Production wrapper showing correct provider hierarchy
 * 
 * CRITICAL: Provider order matters!
 * ✅ CORRECT: QueryClient > AuthProvider > BrowserRouter > App
 * ❌ WRONG:   AuthProvider > QueryClient > BrowserRouter > App
 * 
 * Reason: QueryClient should be highest for API calls, 
 * Auth needs Router for navigation redirects.
 */
export const ProductionWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Configure React Query client for production
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error: unknown) => {
          // Don't retry on 4xx errors (client errors)
          const axiosError = error as { response?: { status?: number } }
          if (axiosError?.response?.status && axiosError.response.status >= 400 && axiosError.response.status < 500) {
            return false
          }
          // Retry up to 3 times for other errors
          return failureCount < 3
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            {children}
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

/**
 * Testing wrapper for components that use authentication
 * 
 * Use this pattern in test files to provide proper context
 * for components that call useAuth().
 */
export const TestingWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Simple test configuration
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

/**
 * Memory router wrapper for testing specific routes
 * 
 * Useful for testing specific route behaviors without 
 * affecting browser history.
 */
export const MemoryTestWrapper: React.FC<{ 
  children: React.ReactNode;
  initialEntries?: string[];
}> = ({ children, initialEntries = ['/'] }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  // Note: Using MemoryRouter for isolated testing
  const { MemoryRouter } = require('react-router-dom');

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={initialEntries}>
          {children}
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

/**
 * Common pitfalls and solutions
 */

// ❌ WRONG: Missing AuthProvider
const WrongExample1 = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </QueryClientProvider>
);
// Error: "useAuth must be used within an AuthProvider"

// ❌ WRONG: AuthProvider outside QueryClient
const WrongExample2 = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <QueryClientProvider client={new QueryClient()}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  </AuthProvider>
);
// Problem: Auth API calls may not work correctly

// ❌ WRONG: AuthProvider outside BrowserRouter
const WrongExample3 = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    <BrowserRouter>
      <AuthProvider>
        {children}
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);
// Problem: Navigation redirects in auth may not work

// ✅ CORRECT: Proper hierarchy
const CorrectExample = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    <AuthProvider>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

/**
 * Usage examples in test files:
 * 
 * ```typescript
 * import { TestingWrapper } from '../examples/AuthProviderWrapper';
 * 
 * test('component with auth', async () => {
 *   render(
 *     <TestingWrapper>
 *       <MyComponentThatUsesAuth />
 *     </TestingWrapper>
 *   );
 *   
 *   await waitFor(() => {
 *     expect(screen.getByText('Dashboard')).toBeInTheDocument();
 *   });
 * });
 * ```
 * 
 * For specific route testing:
 * 
 * ```typescript
 * test('admin route protection', async () => {
 *   render(
 *     <MemoryTestWrapper initialEntries={['/admin']}>
 *       <App />
 *     </MemoryTestWrapper>
 *   );
 * });
 * ```
 */

export default {
  ProductionWrapper,
  TestingWrapper,
  MemoryTestWrapper,
  // Export wrong examples for documentation
  WrongExample1,
  WrongExample2,
  WrongExample3,
  CorrectExample,
};