# Auth Provider Fix - "useAuth must be used within an AuthProvider" Error

## Goal
Fix the runtime error that occurs when navigating to `/admin` route: `"useAuth must be used within an AuthProvider"`. The error happens because `useAuth()` is called in the `Layout` component, but the `AuthProvider` is not wrapping the React component tree in `main.tsx`.

## Why
- **User Experience**: Users cannot access the admin dashboard due to a runtime error
- **Integration**: The authentication system is properly implemented but not correctly wired into the app entry point
- **Business Impact**: Admin functionality is completely blocked, preventing survey management and analytics access
- **Code Quality**: The error prevents proper authentication flow and user session management

## What
Implement proper AuthProvider wrapping in the React application entry point and create authentication guards for protected routes.

### Success Criteria
- [ ] /admin route renders without throwing "useAuth must be used within an AuthProvider" error
- [ ] Unauthorized users accessing /admin are redirected to /login
- [ ] AuthProvider is properly positioned in the provider chain (after QueryClient, before BrowserRouter)
- [ ] New AdminPage.test.tsx passes with proper AuthProvider mocking
- [ ] All existing tests continue to pass
- [ ] Documentation is updated to reflect the authentication flow

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- url: https://legacy.reactjs.org/docs/context.html
  why: Official React Context API documentation for proper provider patterns
  
- url: https://auth0.com/blog/complete-guide-to-react-user-authentication/
  why: Modern authentication patterns and best practices for React applications
  
- url: https://ui.dev/react-router-protected-routes-authentication
  why: Protected routes implementation with React Router v6
  
- file: /home/ado/SurvAI.3.0/frontend/src/hooks/useAuth.tsx
  why: Existing AuthProvider and useAuth implementation - shows proper hook structure
  
- file: /home/ado/SurvAI.3.0/frontend/src/main.tsx
  why: Current app entry point - needs AuthProvider added to provider chain
  
- file: /home/ado/SurvAI.3.0/frontend/src/App.tsx
  why: Main app routes - understand current routing structure
  
- file: /home/ado/SurvAI.3.0/frontend/src/components/common/Layout.tsx
  why: Component that calls useAuth() - root cause of the error
  
- file: /home/ado/SurvAI.3.0/frontend/src/pages/AdminPage.tsx
  why: Protected page using Layout component - requires authentication
  
- file: /home/ado/SurvAI.3.0/tests/frontend/useAuth.test.tsx
  why: Existing test pattern using AuthTestWrapper - follow this pattern
  
- file: /home/ado/SurvAI.3.0/tests/frontend/App.test.tsx
  why: Current app test wrapper - needs AuthProvider added
  
- file: /home/ado/SurvAI.3.0/CLAUDE.md
  why: Project guidelines for testing, file structure, and documentation requirements
```

### Current Codebase Structure
```bash
/home/ado/SurvAI.3.0/
├── frontend/
│   ├── src/
│   │   ├── main.tsx                 # ❌ Missing AuthProvider
│   │   ├── App.tsx                  # ✅ Routes defined
│   │   ├── hooks/
│   │   │   └── useAuth.tsx          # ✅ AuthProvider + useAuth implemented
│   │   ├── components/
│   │   │   └── common/
│   │   │       └── Layout.tsx       # ❌ Calls useAuth() outside provider
│   │   └── pages/
│   │       ├── AdminPage.tsx        # ❌ Uses Layout with auth
│   │       └── LoginPage.tsx        # ❌ Uses useAuth() outside provider
│   └── tests/
│       └── frontend/
│           ├── useAuth.test.tsx     # ✅ Has AuthTestWrapper pattern
│           └── App.test.tsx         # ❌ Missing AuthProvider in test wrapper
```

### Desired Structure After Fix
```bash
/home/ado/SurvAI.3.0/
├── frontend/
│   ├── src/
│   │   ├── main.tsx                 # ✅ AuthProvider wrapping app
│   │   ├── App.tsx                  # ✅ Routes with auth guards
│   │   ├── components/
│   │   │   └── auth/
│   │   │       └── RequireAuth.tsx  # ✅ Route protection component
│   │   └── hooks/
│   │       └── useAuth.tsx          # ✅ Already implemented
│   └── tests/
│       └── frontend/
│           ├── useAuth.test.tsx     # ✅ Already has proper patterns
│           ├── App.test.tsx         # ✅ Updated test wrapper
│           └── AdminPage.test.tsx   # ✅ New test with auth mocking
```

### Known Gotchas & Library Quirks
```typescript
// CRITICAL: Provider ordering matters in React
// ❌ WRONG: AuthProvider > QueryClient > BrowserRouter
// ✅ CORRECT: QueryClient > AuthProvider > BrowserRouter
// Reason: QueryClient should be highest for API calls, Auth needs Router for navigation

// CRITICAL: useAuth hook throws error outside provider
// From /home/ado/SurvAI.3.0/frontend/src/hooks/useAuth.tsx:118-124
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// CRITICAL: Layout component requires auth but is used everywhere
// From /home/ado/SurvAI.3.0/frontend/src/components/common/Layout.tsx:27
const { user, isAuthenticated, isLoading, logout } = useAuth();

// CRITICAL: Testing pattern from existing tests
// From /home/ado/SurvAI.3.0/tests/frontend/useAuth.test.tsx:80-84
const AuthTestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthProvider>
    {children}
  </AuthProvider>
);

// CRITICAL: Current app setup missing AuthProvider
// From /home/ado/SurvAI.3.0/frontend/src/main.tsx:49-59
// Currently: QueryClient > BrowserRouter > App
// Need: QueryClient > AuthProvider > BrowserRouter > App
```

## Implementation Blueprint

### Provider Chain Architecture
Establish the correct provider hierarchy following React Context best practices:

```typescript
// Target structure in main.tsx
<QueryClientProvider client={queryClient}>
  <AuthProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </AuthProvider>
</QueryClientProvider>
```

### Authentication Route Guard
Create a reusable component for protecting routes that require authentication:

```typescript
// New component: RequireAuth.tsx
interface RequireAuthProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const RequireAuth: React.FC<RequireAuthProps> = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  if (isLoading) return <Loading />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requireAdmin && user?.role !== 'ADMIN') return <AccessDenied />;
  
  return <>{children}</>;
};
```

### List of tasks to be completed to fulfill the PRP in the order they should be completed

```yaml
Task 1: Update main.tsx to include AuthProvider
MODIFY frontend/src/main.tsx:
  - FIND pattern: "<QueryClientProvider client={queryClient}>"
  - INJECT AuthProvider import: "import { AuthProvider } from './hooks/useAuth'"
  - WRAP BrowserRouter with AuthProvider inside QueryClientProvider
  - PRESERVE existing QueryClient configuration and React.StrictMode
  - KEEP existing error handling and root element logic

Task 2: Create RequireAuth component for route protection
CREATE frontend/src/components/auth/RequireAuth.tsx:
  - IMPORT useAuth hook and React Router Navigate
  - IMPLEMENT RequireAuth functional component with children and requireAdmin props
  - ADD loading state handling with spinner/loading message
  - ADD authentication check with redirect to /login
  - ADD admin role check with access denied message
  - EXPORT component for use in routing

Task 3: Update App.tsx to use RequireAuth for protected routes
MODIFY frontend/src/App.tsx:
  - IMPORT RequireAuth component
  - WRAP AdminPage route with RequireAuth component
  - ADD requireAdmin={true} prop for admin routes
  - PRESERVE existing route structure and health check logic
  - MAINTAIN existing imports and components

Task 4: Update App.test.tsx to include AuthProvider in test wrapper
MODIFY tests/frontend/App.test.tsx:
  - IMPORT AuthProvider from useAuth hook
  - MODIFY createWrapper function to include AuthProvider
  - WRAP existing QueryClientProvider > BrowserRouter structure
  - PRESERVE existing test cases and mock configurations
  - ENSURE all tests pass with new provider structure

Task 5: Create AdminPage.test.tsx with proper authentication mocking
CREATE tests/frontend/AdminPage.test.tsx:
  - MIRROR pattern from existing useAuth.test.tsx file
  - CREATE test wrapper with AuthProvider, QueryClient, and BrowserRouter
  - MOCK useAuth hook with authenticated admin user
  - TEST AdminPage renders without authentication errors
  - TEST heading "Dashboard" is displayed (success criteria from ISSUES_01.md)
  - VERIFY admin dashboard content loads properly

Task 6: Create RequireAuth.test.tsx for component testing
CREATE tests/frontend/components/auth/RequireAuth.test.tsx:
  - IMPORT RequireAuth component and testing utilities
  - TEST unauthenticated users are redirected to /login
  - TEST authenticated non-admin users get access denied for admin routes
  - TEST authenticated admin users can access admin routes
  - TEST loading states are displayed properly
  - FOLLOW existing test patterns from useAuth.test.tsx

Task 7: Update Layout.tsx to handle authentication gracefully (if needed)
MODIFY frontend/src/components/common/Layout.tsx:
  - VERIFY useAuth hook works correctly with new provider structure
  - ADD error boundary for authentication errors if needed
  - PRESERVE existing navigation and styling logic
  - ENSURE logout functionality works properly
  - MAINTAIN existing props and component structure

Task 8: Create examples/AuthProviderWrapper.tsx for documentation
CREATE examples/AuthProviderWrapper.tsx:
  - REFERENCE from ISSUES_01.md line 15 mentions this file
  - CREATE example wrapper showing proper AuthProvider usage
  - INCLUDE comments explaining provider hierarchy
  - SHOW correct usage patterns for testing and production
  - DOCUMENT common pitfalls and solutions

Task 9: Update documentation
MODIFY docs/README.md:
  - ADD authentication flow section under API documentation
  - DOCUMENT RequireAuth component usage
  - INCLUDE example of proper provider setup
  - REFERENCE AuthProviderWrapper.tsx example
  - MAINTAIN existing documentation structure

Task 10: Run validation tests
EXECUTE validation commands:
  - npm run lint (fix any linting issues)
  - npm run type-check (resolve TypeScript errors)
  - npm run test:unit (ensure all tests pass)
  - npm run dev (manual testing - navigate to /admin)
  - VERIFY /admin loads without "useAuth must be used within an AuthProvider" error
```

### Per task pseudocode with critical details

```typescript
// Task 1: main.tsx AuthProvider integration
// CRITICAL: Provider order matters for proper functionality
import { AuthProvider } from './hooks/useAuth';

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

// Task 2: RequireAuth component
// PATTERN: Follow existing Layout component auth checking pattern
const RequireAuth: React.FC<RequireAuthProps> = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  // CRITICAL: Handle loading state first to prevent flashing
  if (isLoading) {
    return (
      <div className="page">
        <div className="page-content" style={{ textAlign: 'center' }}>
          <div>Loading...</div>
        </div>
      </div>
    );
  }
  
  // CRITICAL: Use Navigate component for declarative routing
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // CRITICAL: Check admin role for protected admin routes
  if (requireAdmin && user?.role !== 'ADMIN') {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Task 3: App.tsx route protection
// PATTERN: Wrap routes that need authentication
<Route 
  path="/admin" 
  element={
    <RequireAuth requireAdmin={true}>
      <AdminPage />
    </RequireAuth>
  } 
/>

// Task 4: Test wrapper update
// PATTERN: Mirror existing useAuth.test.tsx AuthTestWrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
  
  return TestWrapper;
};

// Task 5: AdminPage.test.tsx 
// PATTERN: Use existing auth test patterns with proper mocking
describe('AdminPage', () => {
  test('should render dashboard heading without auth error', async () => {
    // Mock successful authentication
    mockedApi.api.get.mockResolvedValue({
      data: {
        success: true,
        data: { user: mockAdminUser }
      }
    });

    render(
      <AuthTestWrapper>
        <AdminPage />
      </AuthTestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });
});
```

### Integration Points
```yaml
PROVIDER_CHAIN:
  - order: "QueryClientProvider > AuthProvider > BrowserRouter > App"
  - reason: "QueryClient handles API calls, Auth needs Router for navigation"
  
ROUTING:
  - add to: frontend/src/App.tsx
  - pattern: "<RequireAuth requireAdmin={true}><AdminPage /></RequireAuth>"
  
TESTING:
  - update: tests/frontend/App.test.tsx
  - pattern: "Add AuthProvider to existing test wrapper"
  
DOCUMENTATION:
  - update: docs/README.md
  - section: "Authentication Flow"
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# Run these FIRST - fix any errors before proceeding
npm run lint                         # Auto-fix linting issues
npm run type-check                   # TypeScript compilation check

# Expected: No errors. If errors, READ the error and fix.
```

### Level 2: Unit Tests
```bash
# Run existing tests to ensure no regression
npm run test:unit

# Expected: All tests pass, including new AdminPage.test.tsx
# If failing: Read error, understand root cause, fix code, re-run
```

### Level 3: Integration Test
```bash
# Start development server
npm run dev

# Manual testing:
# 1. Navigate to http://localhost:3000/admin
# 2. Should NOT see "useAuth must be used within an AuthProvider" error
# 3. Should either show admin dashboard (if authenticated) or redirect to login
# 4. Test login flow and admin access

# Expected: No runtime errors, proper authentication flow
```

## Final Validation Checklist
- [ ] All tests pass: `npm run test:unit`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run type-check`
- [ ] Manual test successful: Navigate to /admin without authentication error
- [ ] AuthProvider properly positioned in provider chain
- [ ] RequireAuth component protects admin routes
- [ ] Documentation updated with authentication flow
- [ ] Example AuthProviderWrapper.tsx created for reference

---

## Anti-Patterns to Avoid
- ❌ Don't change existing useAuth hook implementation - it's working correctly
- ❌ Don't modify Layout component logic - the issue is missing provider
- ❌ Don't create new authentication context - use existing AuthProvider
- ❌ Don't skip testing - authentication bugs are critical
- ❌ Don't ignore TypeScript errors - they indicate real issues
- ❌ Don't hardcode authentication state - use proper hook patterns
- ❌ Don't break existing routes - only add protection where needed

## Confidence Score: 9/10

This PRP has high confidence for one-pass implementation because:
- ✅ Problem is clearly identified and well-understood
- ✅ Existing authentication system is properly implemented
- ✅ Clear examples exist in codebase for proper patterns
- ✅ External documentation provides modern best practices
- ✅ Validation steps are comprehensive and executable
- ✅ All necessary context and gotchas are documented
- ✅ Tasks are specific and actionable with clear success criteria

The only minor risk is potential test flakiness due to authentication timing, but the existing test patterns handle this properly.