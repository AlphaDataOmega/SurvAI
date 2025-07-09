name: "JWT Authentication + Admin Dashboard Scaffold - M1_PHASE_01"
description: |

## Purpose
Complete JWT authentication system with secure HTTP-only cookie storage and protected admin dashboard shell. This PRP provides comprehensive context for one-pass implementation following existing codebase patterns.

## Core Principles
1. **Security First**: HTTP-only cookies, bcrypt hashing, JWT validation
2. **Follow Existing Patterns**: Use established codebase conventions
3. **Comprehensive Testing**: Unit tests, integration tests, manual validation
4. **Progressive Enhancement**: Start with core auth, then add admin protection

---

## Goal
Build a secure authentication system with email/password login, JWT-based session management using HTTP-only cookies, and protected admin dashboard routing. Enable secure admin access with session persistence across page reloads.

## Why
- **Security Foundation**: Establishes secure access control for admin features
- **Session Management**: Persistent login sessions using industry-standard JWT + HTTP-only cookies
- **Admin Protection**: Ensures only authenticated admins can access dashboard
- **Scalability**: JWT-based auth enables future API scaling and microservices

## What
Complete authentication system with:
- Email/password registration and login
- JWT tokens stored in secure HTTP-only cookies
- Protected admin routes with role-based access
- Session validation middleware
- Login/logout functionality
- Admin dashboard shell with authentication guard

### Success Criteria
- [ ] User can register with email/password
- [ ] User can login and receive JWT in HTTP-only cookie
- [ ] `/admin` route is protected and requires ADMIN role
- [ ] Session persists across page reloads
- [ ] Logout clears session and redirects to login
- [ ] All auth endpoints return proper API responses
- [ ] Auth middleware validates JWT and attaches user to request
- [ ] Tests cover auth service, controller, and integration flows
- [ ] Documentation updated with new auth system 

## All Needed Context

### Documentation & References
```yaml
# Authentication Best Practices
- url: https://www.wisp.blog/blog/ultimate-guide-to-securing-jwt-authentication-with-httponly-cookies
  why: HTTP-only cookie security patterns and implementation
  
- url: https://medium.com/@sajaldewangan/authentication-using-cookies-with-jwt-in-expressjs-900467c3b8d3
  why: Express.js JWT cookie implementation patterns
  
- url: https://dev.to/idurar/advanced-nodejs-reactjs-auth-httponly-in-cookies-2911
  why: React authentication hooks with HTTP-only cookies

- url: https://mihai-andrei.com/blog/jwt-authentication-using-prisma-and-express/
  why: Prisma JWT authentication middleware patterns

- url: https://medium.com/@gigi.shalamberidze2022/implementing-secure-authentication-authorization-in-express-js-with-jwt-typescript-and-prisma-087c90596889
  why: TypeScript + Prisma + JWT security implementation

# Existing Codebase Patterns
- file: backend/src/middleware/errorHandler.ts
  why: Error handling patterns - use ApiError class and createUnauthorizedError, createForbiddenError
  
- file: backend/src/app.ts
  why: Route mounting patterns - follow existing middleware setup and route structure
  
- file: shared/src/types/user.ts
  why: User types already defined - use existing User, UserRole, JwtPayload, AuthResponse interfaces
  
- file: backend/prisma/schema.prisma
  why: User and UserSession models exist - use existing schema, no changes needed
  
- file: frontend/src/services/api.ts
  why: API client patterns - extend existing apiClient with withCredentials for cookies
  
- file: frontend/src/pages/AdminPage.tsx
  why: Admin shell exists - needs authentication guard wrapper
```

### Current Codebase Structure
```
backend/
├── src/
│   ├── app.ts                 # Express app setup (mount auth routes here)
│   ├── middleware/
│   │   ├── errorHandler.ts    # Use existing ApiError patterns
│   │   └── [auth.ts]         # CREATE - JWT validation middleware
│   ├── routes/
│   │   └── [auth.ts]         # CREATE - Auth endpoints
│   ├── controllers/
│   │   └── [authController.ts] # CREATE - Auth logic
│   ├── services/
│   │   └── [authService.ts]   # CREATE - Password hashing, JWT generation
│   └── types/
└── prisma/
    └── schema.prisma          # User/UserSession models exist

frontend/
├── src/
│   ├── services/
│   │   └── api.ts            # Extend for auth endpoints
│   ├── hooks/
│   │   └── [useAuth.ts]      # CREATE - Auth state management
│   ├── pages/
│   │   ├── AdminPage.tsx     # EXISTS - wrap with auth guard
│   │   └── [LoginPage.tsx]   # CREATE - Login form
│   └── components/
│       └── common/
│           └── [Layout.tsx]  # CREATE - Auth-aware layout

shared/
└── src/
    └── types/
        └── user.ts           # User types exist - use as-is
```

### Desired Codebase Structure with New Files
```
backend/src/
├── routes/auth.ts           # POST /login, /register, /logout, GET /me
├── controllers/authController.ts # login, register, logout, getCurrentUser
├── services/authService.ts  # hashPassword, comparePassword, generateJWT, verifyJWT
├── middleware/auth.ts       # authenticateUser, requireAdmin middleware

frontend/src/
├── pages/LoginPage.tsx      # Email/password form with validation
├── hooks/useAuth.ts         # login, logout, user state management
├── components/common/Layout.tsx # Check auth status, show nav if admin
```

### Known Gotchas & Library Quirks
```typescript
// CRITICAL: Use HTTP-only cookies, NOT localStorage
// Set cookie with these exact security attributes
res.cookie('accessToken', token, {
  httpOnly: true,        // Prevents XSS access
  secure: true,          // HTTPS only
  sameSite: 'strict',    // CSRF protection
  maxAge: 15 * 60 * 1000 // 15 minutes
});

// CRITICAL: bcrypt must be async
const hashedPassword = await bcrypt.hash(password, 12);
const isValid = await bcrypt.compare(password, hashedPassword);

// CRITICAL: JWT must include user role for admin access
const payload = { 
  sub: user.id, 
  email: user.email, 
  role: user.role 
};

// CRITICAL: Frontend API calls need withCredentials
axios.create({
  baseURL: 'http://localhost:8000',
  withCredentials: true  // Required for HTTP-only cookies
});

// CRITICAL: Use existing ApiError patterns
throw createUnauthorizedError('Invalid credentials');
throw createForbiddenError('Admin access required');
```

## Implementation Blueprint

### List of Tasks (In Order)
```yaml
Task 1: Create Authentication Service
CREATE backend/src/services/authService.ts:
  - IMPORT bcrypt, jsonwebtoken, prisma
  - IMPLEMENT hashPassword, comparePassword functions
  - IMPLEMENT generateJWT, verifyJWT functions
  - FOLLOW existing service patterns in codebase

Task 2: Create Authentication Controller
CREATE backend/src/controllers/authController.ts:
  - IMPORT authService, ApiError helpers
  - IMPLEMENT register, login, logout, getCurrentUser
  - USE existing error handling patterns
  - RETURN standardized ApiResponse format

Task 3: Create Authentication Middleware
CREATE backend/src/middleware/auth.ts:
  - IMPLEMENT authenticateUser middleware
  - IMPLEMENT requireAdmin middleware
  - USE existing ApiError patterns
  - EXTRACT JWT from HTTP-only cookies

Task 4: Create Auth Routes
CREATE backend/src/routes/auth.ts:
  - MOUNT POST /register, /login, /logout
  - MOUNT GET /me with auth middleware
  - FOLLOW existing route patterns
  - ADD validation middleware

Task 5: Update Express App
MODIFY backend/src/app.ts:
  - ADD app.use('/api/auth', authRoutes)
  - PRESERVE existing middleware order
  - ADD cookie-parser middleware

Task 6: Create Frontend Auth Hook
CREATE frontend/src/hooks/useAuth.ts:
  - IMPLEMENT login, logout, getCurrentUser
  - MANAGE user state with React context
  - USE existing API client patterns
  - HANDLE errors gracefully

Task 7: Create Login Page
CREATE frontend/src/pages/LoginPage.tsx:
  - CREATE email/password form
  - USE existing CSS classes and patterns
  - HANDLE form validation and submission
  - REDIRECT to /admin on success

Task 8: Create Auth-Aware Layout
CREATE frontend/src/components/common/Layout.tsx:
  - CHECK authentication status
  - SHOW navigation if user is ADMIN
  - HANDLE logout functionality
  - REDIRECT to login if unauthorized

Task 9: Protect Admin Page
MODIFY frontend/src/pages/AdminPage.tsx:
  - WRAP with authentication guard
  - SHOW loading state during auth check
  - REDIRECT to login if not authenticated
  - VERIFY ADMIN role requirement

Task 10: Update API Client
MODIFY frontend/src/services/api.ts:
  - ADD withCredentials: true to axios config
  - ADD auth-specific endpoints
  - PRESERVE existing interceptor patterns
  - HANDLE 401/403 responses

Task 11: Create Integration Tests
CREATE tests/backend/auth.test.ts:
  - TEST register/login/logout flows
  - TEST JWT validation
  - TEST admin route protection
  - USE existing test patterns
```

### Core Authentication Flow Pseudocode
```typescript
// Task 1: Authentication Service
export class AuthService {
  async hashPassword(password: string): Promise<string> {
    // PATTERN: Use bcrypt with salt rounds 12
    return bcrypt.hash(password, 12);
  }
  
  async comparePassword(password: string, hash: string): Promise<boolean> {
    // PATTERN: Use bcrypt compare
    return bcrypt.compare(password, hash);
  }
  
  generateJWT(user: User): string {
    // CRITICAL: Include role in payload
    const payload = { sub: user.id, email: user.email, role: user.role };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
  }
  
  verifyJWT(token: string): JwtPayload {
    // GOTCHA: May throw - caller must handle
    return jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
  }
}

// Task 2: Authentication Controller
export class AuthController {
  async login(req: Request, res: Response) {
    // PATTERN: Validate input first
    const { email, password } = req.body;
    
    // PATTERN: Use Prisma to find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw createUnauthorizedError('Invalid credentials');
    
    // PATTERN: Compare passwords
    const isValid = await authService.comparePassword(password, user.passwordHash);
    if (!isValid) throw createUnauthorizedError('Invalid credentials');
    
    // PATTERN: Generate JWT
    const token = authService.generateJWT(user);
    
    // CRITICAL: Set HTTP-only cookie
    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });
    
    // PATTERN: Return ApiResponse format
    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: {
        accessToken: token,
        user: { id: user.id, email: user.email, role: user.role },
        expiresAt: Date.now() + 15 * 60 * 1000
      },
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  }
}

// Task 3: Authentication Middleware
export const authenticateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // CRITICAL: Extract from HTTP-only cookie
    const token = req.cookies.accessToken;
    if (!token) throw createUnauthorizedError('No token provided');
    
    // PATTERN: Verify JWT
    const payload = authService.verifyJWT(token);
    
    // PATTERN: Attach user to request
    req.user = payload;
    next();
  } catch (error) {
    // PATTERN: Use existing error handler
    next(createUnauthorizedError('Invalid token'));
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== UserRole.ADMIN) {
    return next(createForbiddenError('Admin access required'));
  }
  next();
};
```

### Integration Points
```yaml
MIDDLEWARE:
  - add to: backend/src/app.ts
  - pattern: "app.use(cookieParser())" before routes
  - pattern: "app.use('/api/auth', authRoutes)" with other routes

FRONTEND_ROUTING:
  - protect: /admin route with auth guard
  - redirect: unauthorized users to /login
  - pattern: wrap AdminPage with requireAuth HOC

DATABASE:
  - existing: User model with passwordHash, role, status
  - existing: UserSession model for session tracking
  - no changes: schema already supports auth requirements

COOKIES:
  - name: accessToken
  - attributes: httpOnly, secure, sameSite=strict
  - expiry: 15 minutes matching JWT expiration
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# Run these FIRST - fix any errors before proceeding
npm run lint                    # ESLint validation
npm run type-check             # TypeScript type checking
npm run test:unit              # Unit tests

# Expected: No errors. If errors exist, read and fix before continuing.
```

### Level 2: Unit Tests
```typescript
// CREATE tests/backend/authService.test.ts
describe('AuthService', () => {
  test('hashPassword creates valid hash', async () => {
    const password = 'testpassword';
    const hash = await authService.hashPassword(password);
    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
  });
  
  test('comparePassword validates correctly', async () => {
    const password = 'testpassword';
    const hash = await authService.hashPassword(password);
    const isValid = await authService.comparePassword(password, hash);
    expect(isValid).toBe(true);
  });
  
  test('generateJWT creates valid token', () => {
    const user = { id: '123', email: 'test@example.com', role: UserRole.ADMIN };
    const token = authService.generateJWT(user);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
  });
});

// CREATE tests/backend/authController.test.ts
describe('AuthController', () => {
  test('login with valid credentials succeeds', async () => {
    // Setup test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: await authService.hashPassword('password'),
        role: UserRole.ADMIN
      }
    });
    
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password' })
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe('test@example.com');
  });
  
  test('login with invalid credentials fails', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrongpassword' })
      .expect(401);
  });
});
```

```bash
# Run unit tests and iterate until passing:
npm run test:unit
# If failing: Read error, understand root cause, fix code, re-run
```

### Level 3: Integration Tests
```typescript
// CREATE tests/backend/authIntegration.test.ts
describe('Authentication Integration', () => {
  test('complete login -> protected route flow', async () => {
    // 1. Login and get cookie
    const agent = request.agent(app);
    await agent
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'password' })
      .expect(200);
    
    // 2. Access protected route with cookie
    const response = await agent
      .get('/api/auth/me')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe('admin@example.com');
  });
  
  test('admin route protection works', async () => {
    const agent = request.agent(app);
    
    // Try to access admin route without auth
    await agent.get('/api/admin/dashboard').expect(401);
    
    // Login as non-admin
    await agent
      .post('/api/auth/login')
      .send({ email: 'viewer@example.com', password: 'password' })
      .expect(200);
    
    // Try to access admin route as non-admin
    await agent.get('/api/admin/dashboard').expect(403);
  });
});
```

```bash
# Run integration tests:
npm run test:integration
# Expected: All auth flows work correctly
```

### Level 4: Manual Testing
```bash
# Start the development server
npm run dev

# Test registration
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password", "role": "ADMIN"}'

# Test login (save cookies)
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password"}' \
  -c cookies.txt

# Test protected route
curl -X GET http://localhost:8000/api/auth/me \
  -b cookies.txt

# Test frontend
# 1. Navigate to http://localhost:3000/login
# 2. Enter credentials and submit
# 3. Should redirect to /admin
# 4. Refresh page - should stay logged in
# 5. Navigate to /admin directly - should stay authenticated
```

## Final Validation Checklist
- [ ] All unit tests pass: `npm run test:unit`
- [ ] All integration tests pass: `npm run test:integration`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run type-check`
- [ ] Manual login flow works in browser
- [ ] Admin route protection works
- [ ] Session persists across page refresh
- [ ] Logout clears session properly
- [ ] HTTP-only cookies are set correctly
- [ ] All API responses follow ApiResponse format
- [ ] Error handling uses existing ApiError patterns

---

## Anti-Patterns to Avoid
- ❌ Don't store JWT in localStorage (use HTTP-only cookies)
- ❌ Don't use sync bcrypt functions (use async versions)
- ❌ Don't hardcode JWT secrets (use environment variables)
- ❌ Don't skip role validation in protected routes
- ❌ Don't ignore existing error handling patterns
- ❌ Don't create new response formats (use existing ApiResponse)
- ❌ Don't skip cookie security attributes (httpOnly, secure, sameSite)
- ❌ Don't forget withCredentials in frontend API calls