name: "SurvAI Bootstrap - Complete MVP Project Setup"
description: |
  Comprehensive PRP for bootstrapping SurvAI MVP with monorepo architecture, 
  React frontend, Express backend, Prisma ORM, Docker development environment,
  and complete testing setup.

---

## Goal
Create a complete development-ready SurvAI project structure with monorepo layout, containerized services, and functional development environment that includes frontend, backend, shared types, testing infrastructure, and proper documentation.

## Why
- **Business Value**: Establishes solid foundation for rapid AI-enhanced survey engine development
- **Integration**: Provides scalable architecture for dynamic AI-driven UX and monetization optimization
- **Developer Experience**: Complete development environment with hot-reload, containerized services, and comprehensive testing
- **Future-Proof**: Modular structure supporting OpenAI/Ollama integration and expansion

## What
A fully functional monorepo development environment with:
- React + TypeScript + Vite frontend with hot-reload
- Node.js + Express + TypeScript backend with API endpoints
- Prisma ORM configured for PostgreSQL
- Docker Compose with PostgreSQL and Redis
- Jest testing framework configured for monorepo
- Shared types package for type consistency
- Complete development scripts and environment setup
- Comprehensive documentation and validation gates

### Success Criteria
- [ ] Monorepo workspace resolution validates correctly
- [ ] Frontend loads at localhost:3000 with React app
- [ ] Backend responds to GET /health at localhost:8000
- [ ] Database connection established via Prisma
- [ ] Docker services (PostgreSQL, Redis) start successfully
- [ ] All lint and type-check commands pass
- [ ] Jest tests run successfully across all packages
- [ ] Development commands launch frontend + backend concurrently
- [ ] README provides clear setup and architecture instructions

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- url: https://vite.dev/guide/
  why: Vite configuration for React TypeScript setup
  
- url: https://www.prisma.io/express
  why: Express + Prisma integration patterns and best practices
  
- url: https://earthly.dev/blog/setup-typescript-monorepo/
  why: TypeScript monorepo setup with npm workspaces
  
- url: https://dev.to/mikhaelesa/how-to-setup-jest-on-typescript-monorepo-projects-o4d
  why: Jest configuration for TypeScript monorepo projects
  
- url: https://geshan.com.np/blog/2022/01/redis-docker/
  why: Docker Compose setup for Redis and PostgreSQL
  
- file: /home/ado/SurvAI.3.0/PLANNING.md
  why: Project architecture, tech stack, and conventions
  
- file: /home/ado/SurvAI.3.0/CLAUDE.md
  why: Development constraints, testing requirements, and code quality rules
  
- file: /home/ado/SurvAI.3.0/INITIAL.md
  why: Bootstrap requirements and target structure
```

### Current Codebase Structure
```bash
/home/ado/SurvAI.3.0/
├── CLAUDE.md                    # Development rules and constraints
├── INITIAL.md                   # Bootstrap requirements
├── LICENSE
├── PLANNING.md                  # Architecture and tech stack
├── PRPs/
│   └── templates/
│       └── prp_base.md         # PRP template
├── README.md                    # Basic project info
└── examples/                    # Currently empty
```

### Target Codebase Structure
```bash
/home/ado/SurvAI.3.0/
├── frontend/                    # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── index.html
├── backend/                     # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── models/
│   │   ├── types/
│   │   └── app.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── package.json
│   └── tsconfig.json
├── shared/                      # Shared types and utilities
│   ├── src/
│   │   ├── types/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── tests/                       # Mirror structure of src/
│   ├── frontend/
│   ├── backend/
│   └── shared/
├── docker-compose.yml           # PostgreSQL + Redis services
├── .env.example                 # Environment variables template
├── package.json                 # Monorepo root configuration
├── jest.config.js               # Jest monorepo configuration
├── .gitignore
└── README.md                    # Updated with setup instructions
```

### Known Gotchas & Library Quirks
```typescript
// CRITICAL: npm workspaces require "private": true in root package.json
// Example: Workspaces won't resolve without this setting

// CRITICAL: Prisma requires async/await - no sync operations
// Example: await prisma.user.findMany() NOT prisma.user.findMany()

// CRITICAL: Vite requires specific TypeScript config for React
// Example: Must include "jsx": "react-jsx" in compilerOptions

// CRITICAL: Jest in monorepo needs projects configuration
// Example: Use projects: ['<rootDir>/frontend', '<rootDir>/backend']

// CRITICAL: Docker Compose volumes needed for data persistence
// Example: PostgreSQL data will be lost without volume mapping

// CRITICAL: Express + TypeScript requires specific middleware setup
// Example: Must use express.json() and proper error handling middleware
```

## Implementation Blueprint

### Data Models and Structure
```typescript
// Shared types structure for type consistency across packages
interface User {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Prisma schema foundation
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Task List - Complete Implementation Order

```yaml
Task 1: Initialize Monorepo Structure
CREATE /home/ado/SurvAI.3.0/package.json:
  - SET "private": true for workspaces
  - ADD "workspaces": ["frontend", "backend", "shared"]
  - ADD root-level dev dependencies (typescript, jest, prettier, eslint)
  - ADD scripts for concurrent development

CREATE /home/ado/SurvAI.3.0/.gitignore:
  - ADD node_modules, .env, dist, build directories
  - ADD IDE-specific files and OS-specific files

Task 2: Setup Environment Configuration
CREATE /home/ado/SurvAI.3.0/.env.example:
  - ADD DATABASE_URL with PostgreSQL connection string
  - ADD REDIS_URL with Redis connection string
  - ADD PORT configurations for frontend/backend
  - ADD placeholder values for OpenAI/Ollama keys

Task 3: Configure Docker Development Environment
CREATE /home/ado/SurvAI.3.0/docker-compose.yml:
  - ADD PostgreSQL service with volume persistence
  - ADD Redis service with volume persistence
  - ADD pgweb for database management UI
  - ADD redis-commander for Redis management UI
  - SET proper port mappings and environment variables

Task 4: Initialize Shared Types Package
CREATE /home/ado/SurvAI.3.0/shared/package.json:
  - SET name: "@survai/shared"
  - ADD TypeScript and build scripts
  - SET proper module exports and types

CREATE /home/ado/SurvAI.3.0/shared/tsconfig.json:
  - EXTEND root TypeScript configuration
  - SET composite: true for project references
  - ADD declaration: true for type exports

CREATE /home/ado/SurvAI.3.0/shared/src/index.ts:
  - EXPORT common types and interfaces
  - ADD API response types
  - ADD user and survey domain types

Task 5: Setup Backend Package
CREATE /home/ado/SurvAI.3.0/backend/package.json:
  - SET name: "@survai/backend"
  - ADD Express, Prisma, and TypeScript dependencies
  - ADD @survai/shared workspace dependency
  - ADD development and build scripts

CREATE /home/ado/SurvAI.3.0/backend/tsconfig.json:
  - EXTEND root TypeScript configuration
  - ADD node-specific compiler options
  - SET project references to shared package

CREATE /home/ado/SurvAI.3.0/backend/src/app.ts:
  - SETUP Express application with TypeScript
  - ADD middleware (cors, express.json, morgan)
  - ADD /health endpoint for validation
  - ADD error handling middleware
  - ADD proper async/await patterns

CREATE /home/ado/SurvAI.3.0/backend/prisma/schema.prisma:
  - SETUP PostgreSQL provider
  - ADD User model for initial testing
  - ADD proper field types and constraints

Task 6: Setup Frontend Package  
CREATE /home/ado/SurvAI.3.0/frontend/package.json:
  - SET name: "@survai/frontend"
  - ADD React, TypeScript, Vite dependencies
  - ADD @survai/shared workspace dependency
  - ADD development and build scripts

CREATE /home/ado/SurvAI.3.0/frontend/tsconfig.json:
  - EXTEND root TypeScript configuration
  - ADD React-specific compiler options
  - SET "jsx": "react-jsx" for React 17+ JSX transform

CREATE /home/ado/SurvAI.3.0/frontend/vite.config.ts:
  - SETUP Vite with React plugin
  - ADD TypeScript path mapping for monorepo
  - SET proper development server configuration

CREATE /home/ado/SurvAI.3.0/frontend/src/main.tsx:
  - SETUP React application entry point
  - ADD StrictMode wrapper
  - ADD proper TypeScript imports

CREATE /home/ado/SurvAI.3.0/frontend/src/App.tsx:
  - CREATE basic React component
  - ADD health check API call to backend
  - ADD shared types usage example

Task 7: Configure Testing Framework
CREATE /home/ado/SurvAI.3.0/jest.config.js:
  - SETUP Jest projects for monorepo
  - ADD TypeScript preset configuration
  - SET proper test environment for each package

CREATE /home/ado/SurvAI.3.0/tests/backend/app.test.ts:
  - ADD health endpoint test
  - ADD database connection test
  - ADD error handling test

CREATE /home/ado/SurvAI.3.0/tests/frontend/App.test.tsx:
  - ADD component rendering test
  - ADD API integration test
  - ADD shared types usage test

Task 8: Root Configuration Files
CREATE /home/ado/SurvAI.3.0/tsconfig.json:
  - SETUP base TypeScript configuration
  - ADD project references to all packages
  - SET proper compiler options for monorepo

CREATE /home/ado/SurvAI.3.0/.eslintrc.js:
  - SETUP ESLint for TypeScript and React
  - ADD monorepo-specific rules
  - SET proper parser and plugin configurations

CREATE /home/ado/SurvAI.3.0/.prettierrc:
  - SETUP Prettier formatting rules
  - ADD consistent formatting across packages

Task 9: Development Scripts and Documentation
MODIFY /home/ado/SurvAI.3.0/package.json:
  - ADD "dev" script for concurrent frontend/backend
  - ADD "build" script for all packages
  - ADD "test" script for all packages
  - ADD "lint" and "type-check" scripts

CREATE /home/ado/SurvAI.3.0/README.md:
  - ADD project overview and architecture
  - ADD setup instructions and prerequisites
  - ADD development commands and workflow
  - ADD Docker services information
  - ADD folder structure explanation
  - ADD troubleshooting section

Task 10: Validation and Testing
RUN npm install in root directory:
  - VERIFY workspace resolution
  - VERIFY all dependencies installed correctly

RUN docker-compose up -d:
  - VERIFY PostgreSQL container starts
  - VERIFY Redis container starts
  - VERIFY UI tools accessible

RUN npm run dev:
  - VERIFY frontend loads at localhost:3000
  - VERIFY backend responds at localhost:8000/health
  - VERIFY hot-reload functionality

RUN npm run test:
  - VERIFY all Jest tests pass
  - VERIFY test coverage acceptable
  - VERIFY no test errors or warnings
```

### Per Task Pseudocode

#### Task 1: Monorepo Package.json
```json
{
  "name": "survai-mvp",
  "private": true,
  "workspaces": ["frontend", "backend", "shared"],
  "scripts": {
    "dev": "concurrently \"npm run dev --workspace=backend\" \"npm run dev --workspace=frontend\"",
    "build": "npm run build --workspaces --if-present",
    "test": "jest",
    "lint": "eslint . --ext .ts,.tsx --fix",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "concurrently": "^8.0.0"
  }
}
```

#### Task 3: Docker Compose Configuration
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: survai_dev
      POSTGRES_USER: survai_user
      POSTGRES_PASSWORD: survai_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  pgweb:
    image: sosedoff/pgweb
    depends_on:
      - postgres
    environment:
      PGWEB_DATABASE_URL: postgres://survai_user:survai_password@postgres:5432/survai_dev?sslmode=disable
    ports:
      - "8085:8081"
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

#### Task 5: Backend App.ts Structure
```typescript
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import type { ApiResponse } from '@survai/shared';

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    const response: ApiResponse<{ status: string; timestamp: string }> = {
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString()
      }
    };
    
    res.json(response);
  } catch (error) {
    const response: ApiResponse<never> = {
      success: false,
      error: 'Database connection failed'
    };
    
    res.status(500).json(response);
  }
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  const response: ApiResponse<never> = {
    success: false,
    error: 'Internal server error'
  };
  res.status(500).json(response);
});

export default app;
```

### Integration Points
```yaml
ENVIRONMENT:
  - file: .env.example
  - keys: DATABASE_URL, REDIS_URL, PORT, NODE_ENV
  - pattern: "DATABASE_URL=postgresql://survai_user:survai_password@localhost:5432/survai_dev"

WORKSPACE_DEPENDENCIES:
  - shared types: "@survai/shared": "workspace:^1.0.0"
  - backend reference: Add to frontend and backend package.json
  - pattern: Use workspace: protocol for internal dependencies

DOCKER_VOLUMES:
  - postgres_data: Persistent database storage
  - redis_data: Persistent cache storage
  - pattern: Named volumes for data persistence across container restarts

SCRIPTS:
  - concurrent development: Use concurrently package
  - pattern: "concurrently \"npm run dev --workspace=backend\" \"npm run dev --workspace=frontend\""
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# Run these FIRST - fix any errors before proceeding
npm run lint                     # ESLint check and auto-fix
npm run type-check              # TypeScript compilation check
npm run build                   # Build all packages

# Expected: No errors. If errors exist, READ the error message and fix.
```

### Level 2: Unit Tests
```bash
# Run Jest tests for all packages
npm run test

# Run tests for specific package
npm run test --workspace=backend
npm run test --workspace=frontend

# Expected: All tests pass. If failing, examine error output and fix code.
```

### Level 3: Integration Tests
```bash
# Start Docker services
docker-compose up -d
# Expected: PostgreSQL and Redis containers running

# Verify database connection
docker-compose exec postgres psql -U survai_user -d survai_dev -c "SELECT 1;"
# Expected: Returns (1 row) result

# Start development environment
npm run dev
# Expected: Frontend at http://localhost:3000, Backend at http://localhost:8000

# Test health endpoint
curl -X GET http://localhost:8000/health
# Expected: {"success":true,"data":{"status":"healthy","timestamp":"..."}}

# Test frontend loads
curl -X GET http://localhost:3000
# Expected: HTML response with React app

# Test database UI
curl -X GET http://localhost:8085
# Expected: Pgweb interface loads
```

### Level 4: Development Workflow
```bash
# Test hot-reload (make a change to frontend/src/App.tsx)
# Expected: Browser refreshes automatically

# Test backend restart (make a change to backend/src/app.ts)
# Expected: Backend restarts automatically

# Test shared types (modify shared/src/index.ts)
# Expected: Both frontend and backend recognize changes
```

## Final Validation Checklist
- [ ] All packages install successfully: `npm install`
- [ ] No linting errors: `npm run lint`
- [ ] No TypeScript errors: `npm run type-check`
- [ ] All tests pass: `npm run test`
- [ ] Docker services start: `docker-compose up -d`
- [ ] Database connection works: Health endpoint returns success
- [ ] Frontend loads: http://localhost:3000 displays React app
- [ ] Backend responds: http://localhost:8000/health returns JSON
- [ ] Hot-reload works: Changes trigger automatic reloads
- [ ] Shared types work: Changes in shared package affect other packages
- [ ] UI tools accessible: pgweb at http://localhost:8085
- [ ] Development workflow smooth: npm run dev starts both services
- [ ] Documentation complete: README has clear setup instructions

---

## Anti-Patterns to Avoid
- ❌ Don't skip Docker volume configuration - data will be lost
- ❌ Don't use sync Prisma operations - always use async/await
- ❌ Don't hardcode environment variables - use .env files
- ❌ Don't ignore TypeScript errors - fix them immediately
- ❌ Don't skip testing configuration - tests must run in monorepo
- ❌ Don't forget workspace: protocol for internal dependencies
- ❌ Don't use relative paths for shared packages - use workspace names
- ❌ Don't skip error handling in Express routes - always catch errors
- ❌ Don't forget to set "private": true in root package.json
- ❌ Don't use outdated React patterns - use React 18+ features

## Success Confidence Score: 9/10

This PRP provides comprehensive context, executable validation steps, and detailed implementation guidance. The high confidence score reflects:
- Complete technical context with real-world examples
- Executable validation commands at each level
- Detailed troubleshooting guidance
- Reference to authoritative documentation
- Clear anti-patterns to avoid common mistakes
- Structured task breakdown with specific file contents
- Integration points clearly defined
- Multiple validation layers ensuring working code

The monorepo bootstrap should succeed in one-pass implementation with this level of detail and context.