# 🚀 SurvAI MVP

AI-enhanced survey engine with dynamic monetization optimization

[![Build Status](https://github.com/survai/survai/actions/workflows/ci.yml/badge.svg)](https://github.com/survai/survai/actions/workflows/ci.yml)
[![Coverage Status](https://codecov.io/gh/survai/survai/branch/main/graph/badge.svg)](https://codecov.io/gh/survai/survai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/-React-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/-Node.js-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/-PostgreSQL-336791?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

## 🎯 Overview

SurvAI MVP is a comprehensive survey platform that combines artificial intelligence with affiliate marketing to create dynamic, optimized user experiences that maximize conversion rates and earnings per click (EPC). The platform features AI-powered question generation, real-time analytics, and intelligent survey flow optimization.

## 📑 Table of Contents

- [🎯 Overview](#-overview)
- [🏗️ Architecture](#-architecture)
- [⚠️ Important Development Notes](#-important-development-notes)
- [🚀 Quick Start](#-quick-start)
- [📁 Project Structure](#-project-structure)
- [🛠️ Development](#-development)
- [✅ Validation Status](#-validation-status)
- [🔧 Configuration](#-configuration)
- [🧪 Testing](#-testing)
- [🔐 Authentication System](#-authentication-system)
- [🤖 AI Integration Service](#-ai-integration-service)
- [🎛️ Admin Dashboard](#-admin-dashboard)
- [💬 Admin Chat Interface](#-admin-chat-interface)
- [🔗 Embeddable Widget](#-embeddable-widget)
- [📚 API Documentation](#-api-documentation)
- [🚢 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [🐛 Troubleshooting](#-troubleshooting)
- [📞 Support](#-support)
- [📄 License](#-license)
- [🎉 Acknowledgments](#-acknowledgments)

### Key Features

- **🤖 AI-Powered Question Generation**: Optimize questions using OpenAI and Ollama for maximum engagement
- **🔀 Dynamic Survey Flow**: Intelligent branching logic based on user responses and performance data
- **🎯 EPC-Driven Question Ordering**: Automatically order questions by performance to maximize revenue (M3_PHASE_05)
- **📊 Real-Time Analytics**: Track clicks, conversions, and performance metrics in real-time
- **💰 Affiliate Integration**: Seamless offer management with automatic tracking and optimization
- **🎯 Real-Time EPC Optimization**: Live calculation and tracking of Earnings Per Click with 7-day rolling analytics
- **🔗 Click Tracking**: Advanced click attribution with pixel-based conversion tracking
- **📈 Performance Monitoring**: Atomic EPC updates with Prisma transactions and comprehensive analytics
- **🛡️ Input Validation**: Comprehensive Joi validation with TypeScript integration
- **🔄 Idempotent Conversions**: Prevention of double-conversions through atomic transactions
- **🧪 Pixel Simulation**: Manual testing tools for click tracking and conversion verification
- **🤖 AI Integration Service**: Unified AI service with OpenAI and Ollama fallback support
- **🔒 Content Sanitization**: XSS prevention for all AI-generated content
- **📊 Provider Metrics**: Performance tracking for AI providers with fallback logic
- **📱 Responsive Design**: Mobile-first design that works on all devices
- **🔧 Admin Dashboard**: Complete control panel for managing surveys, offers, and analytics
- **📊 Dashboard Metrics & Visualization**: Real-time admin dashboard with EPC charts, performance tables, and interactive analytics
- **📈 Interactive Charts**: Recharts-powered bar charts for EPC visualization with responsive design
- **⏱️ Auto-Refresh**: 30-second auto-refresh with time-based filtering (24h, 7d, 30d)
- **🧪 A/B Testing**: Built-in testing capabilities for continuous optimization
- **🔐 Secure Authentication**: JWT-based authentication with HTTP-only cookies
- **👥 Admin Access Control**: Secure admin-only access for proprietary system
- **✨ Question Management**: AI-integrated CRUD operations with EPC-based ordering (M3_PHASE_03)
- **🚀 Intelligent Survey Routing**: Questions automatically ordered by EPC performance for maximum revenue optimization
- **💼 Comprehensive Offer Management**: Complete CRUD operations for affiliate offers with pixel URL auto-generation (M3_PHASE_08)
- **💬 Admin Chat Interface**: Conversational admin panel with slash commands for streamlined management (M3_PHASE_08)
- **🎯 Visual Regression Testing**: Playwright-based visual testing with 0.1% pixel difference detection and HTML reports (M3_PHASE_09)
- **🔗 Embeddable Widget**: Self-contained widget for external partner integration via script tag (M4_PHASE_01)
- **🎨 Enhanced Widget Theming**: CSS Variables-based theming with Shadow DOM isolation and remote configuration support (M4_PHASE_02)
- **🤝 Partner Attribution**: Comprehensive partner tracking with partner ID propagation across all API calls (M4_PHASE_02)
- **🔄 Widget Resilience**: Intelligent click batching, offline persistence, and exponential backoff retry for network reliability (M4_PHASE_03)
- **🚀 Production Widget Pipeline**: Automated CDN deployment with versioning, integrity hashes, and bundle size validation (M4_PHASE_04)

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│                 │    │                 │    │                 │
│ React + Vite    │◄──►│ Express + TS    │◄──►│ PostgreSQL      │
│ TypeScript      │    │ Prisma ORM      │    │ + Redis Cache   │
│ TailwindCSS     │    │ Health Checks   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └─────────────────────┐ │ ┌─────────────────────┘
                               │ │ │
                    ┌─────────────────┐
                    │  Shared Types   │
                    │                 │
                    │  TypeScript     │
                    │  Interfaces     │
                    └─────────────────┘
                               │
                    ┌─────────────────┐
                    │ Widget Package  │
                    │                 │
                    │ UMD Bundle      │
                    │ Shadow DOM      │
                    │ External API    │
                    └─────────────────┘
```

For comprehensive architecture planning and final review roadmap, see [FINAL_REVIEW_PLANNING.md](FINAL_REVIEW_PLANNING.md).

## ⚠️ Important Development Notes

### 🔧 Critical Setup Requirements

**Before starting development, please read these important considerations:**

1. **Environment Setup**: Copy `.env.example` to `.env` and update values before starting any services
2. **Build Order**: Always build `shared` package first when making type changes
3. **Database Migrations**: Run `npx prisma migrate dev` after any schema changes
4. **Docker Services**: Use `docker-compose up -d` for development database and Redis
5. **Testing**: Frontend tests require manual Jest configuration due to import.meta handling

### 🛠️ Known Development Considerations

#### TypeScript Project References
- The monorepo uses TypeScript project references for better build performance
- If you get build errors about missing .d.ts files, run `npm run build` in the `shared` package first
- Changes to shared types require rebuilding dependent packages

#### Jest Testing Configuration  
- Frontend tests currently have import.meta compatibility issues with Jest
- Shared and backend tests are fully functional (26/26 passing)
- Use `npm test -- --testPathIgnorePatterns=frontend` to run working tests only

#### ESLint Configuration
- ESLint is configured for monorepo with package-specific overrides
- Currently shows 15 warnings (mainly console statements) which are acceptable for development
- All TypeScript compilation errors have been resolved

#### Prisma Client Generation
- Run `npx prisma generate` after schema changes
- Environment variables must be loaded before Prisma client initialization
- Test environment mocks Prisma client to avoid database dependency

### 🔄 Development Workflow Issues

#### Hot Reload Considerations
- Frontend: Vite hot reload works correctly with shared types
- Backend: tsx watch restarts on file changes but may hang on database connection issues
- Shared: Changes require manual rebuild for dependent packages to see updates

#### Build Process Reliability
- All packages now build successfully after TypeScript fixes
- Frontend build includes proper bundling and asset optimization
- Backend builds to CommonJS modules in `dist/` directory

### 🐛 Current Limitations

1. **Frontend Testing**: Import.meta compatibility issues prevent frontend Jest tests from running
2. **Integration Testing**: Requires manual server startup to test API endpoints  
3. **Type Safety**: Some `any` types remain in API client for flexibility
4. **CORS Configuration**: May need adjustment for production deployment

### 🎯 Recommended Next Steps

1. **Fix Frontend Tests**: Implement proper import.meta mocking for Jest
2. **Add Integration Tests**: Create API endpoint tests that work with test database
3. **Improve Type Safety**: Replace remaining `any` types with proper interfaces
4. **Add Validation**: Implement runtime validation for API inputs/outputs
5. **Security Hardening**: Add rate limiting, authentication, and input sanitization

## 🚀 Quick Start

### One-Command Setup (Recommended)

The fastest way to get SurvAI running is with our bootstrap script:

```bash
git clone <repository-url>
cd SurvAI.3.0
./scripts/init.sh
```

That's it! The script will:
- ✅ Validate prerequisites (Docker, Node.js, npm)
- ✅ Generate secure environment configuration
- ✅ Start all Docker services (PostgreSQL, Redis, management UIs)
- ✅ Run database migrations and seed initial data
- ✅ Perform health checks
- ✅ Display setup summary with all access URLs

### Prerequisites

- **Docker** and **Docker Compose** (required for services)
- **Node.js** 18.0.0 or higher
- **npm** 8.0.0 or higher
- **Git**
- **curl** (for health checks)

### Manual Setup (Alternative)

If you prefer to set up manually or need to troubleshoot:

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SurvAI.3.0
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Generate secure JWT secrets:
   node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
   node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
   # Edit .env with the generated secrets
   ```

4. **Start development services**
   ```bash
   # Start database and cache services
   docker-compose up -d
   
   # Wait for services to be healthy
   docker-compose ps
   
   # Run database migrations and seeding
   npm run db:deploy --workspace=backend
   npm run db:seed --workspace=backend
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Health Check**: http://localhost:8000/health
- **Database UI (pgweb)**: http://localhost:8085
- **Redis UI**: http://localhost:8081

### Troubleshooting
- Run `./scripts/init.sh --help` for detailed setup options
- Use `./scripts/init.sh --verbose` for detailed logging
- Check that all required ports are available (5432, 6379, 8000, 8081, 8085)
- Ensure Docker daemon is running
- See the [Troubleshooting](#-troubleshooting) section for common issues

## 📁 Project Structure

```
SurvAI.3.0/
├── frontend/                    # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── admin/         # Admin-specific components
│   │   │   │   ├── Dashboard.tsx          # Main dashboard component
│   │   │   │   ├── OfferManagement.tsx    # Offer management interface
│   │   │   │   ├── OfferMetrics.tsx       # Detailed offer metrics
│   │   │   │   ├── chat/                 # Admin chat interface
│   │   │   │   │   ├── ChatPanel.tsx     # Main chat container
│   │   │   │   │   ├── ChatInput.tsx     # Chat input with slash commands
│   │   │   │   │   ├── ChatMessage.tsx   # Message display component
│   │   │   │   │   ├── ChatHistory.tsx   # Message history
│   │   │   │   │   └── ChatControls.tsx  # Chat controls
│   │   │   │   └── charts/               # Chart components
│   │   │   │       └── EpcBarChart.tsx   # Interactive EPC bar chart
│   │   │   ├── common/        # Shared UI components
│   │   │   └── survey/        # Survey-specific components
│   │   ├── pages/              # Page components
│   │   ├── hooks/              # Custom React hooks
│   │   │   └── useChatCommands.ts      # Chat command processing hook
│   │   ├── services/           # API clients and services
│   │   │   ├── api.ts          # Main API client
│   │   │   ├── dashboard.ts    # Dashboard API service
│   │   │   ├── offer.ts        # Offer management API service
│   │   │   ├── chat.ts         # Chat service abstractions
│   │   │   └── tracking.ts     # Tracking service
│   │   ├── types/              # Frontend-specific types
│   │   │   └── chat.ts         # Chat interface types
│   │   ├── utils/              # Utility functions
│   │   ├── widget/             # Embeddable widget components
│   │   │   ├── index.ts        # Widget entry point and mount API
│   │   │   ├── Widget.tsx      # Main widget component
│   │   │   ├── utils/          # Widget utility modules
│   │   │   │   ├── theme.ts    # Theme management and CSS variables
│   │   │   │   └── remoteConfig.ts # Remote configuration loader
│   │   │   └── services/       # Widget-specific services
│   │   │       └── widgetApi.ts # Widget API client
│   │   ├── App.tsx             # Main app component
│   │   └── main.tsx            # React entry point
│   ├── public/                 # Static assets
│   ├── package.json            # Frontend dependencies
│   ├── tsconfig.json          # TypeScript config
│   ├── vite.config.ts         # Vite configuration
│   └── index.html             # HTML template
├── backend/                     # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── routes/            # API route handlers
│   │   │   ├── auth.ts        # Authentication routes
│   │   │   ├── dashboard.ts   # Dashboard API routes
│   │   │   ├── questions.ts   # Question management routes
│   │   │   ├── sessions.ts    # Session management routes (widget)
│   │   │   └── tracking.ts    # Click tracking routes
│   │   ├── controllers/       # Business logic controllers
│   │   │   ├── authController.ts      # Authentication controller
│   │   │   ├── dashboardController.ts # Dashboard metrics controller
│   │   │   ├── questionController.ts  # Question management
│   │   │   ├── sessionController.ts   # Session management (widget)
│   │   │   └── trackingController.ts  # Click tracking
│   │   ├── middleware/        # Express middleware
│   │   ├── services/          # Business services
│   │   │   ├── aiService.ts           # AI integration service
│   │   │   ├── dashboardService.ts    # Dashboard metrics aggregation
│   │   │   ├── epcService.ts          # EPC calculations
│   │   │   └── trackingService.ts     # Click tracking
│   │   ├── validators/        # Request validation
│   │   │   └── dashboardValidation.ts # Dashboard request validation
│   │   ├── models/            # Data models
│   │   ├── types/             # Backend-specific types
│   │   ├── utils/             # Utility functions (EPC calc, time utils)
│   │   ├── app.ts             # Express app setup
│   │   └── server.ts          # Server entry point
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── package.json           # Backend dependencies
│   └── tsconfig.json          # TypeScript config
├── shared/                      # Shared types and utilities
│   ├── src/
│   │   ├── types/             # Shared TypeScript types (incl. AI types)
│   │   │   └── widget.ts      # Widget-specific types with theming and partner support
│   │   └── index.ts           # Export barrel
│   ├── package.json           # Shared package config
│   └── tsconfig.json          # TypeScript config
├── tests/                       # Test files and setup
│   ├── backend/               # Backend tests
│   ├── frontend/              # Frontend tests
│   │   ├── components/admin/chat/ # Chat component tests
│   │   ├── hooks/useChatCommands.test.ts # Chat hook tests
│   │   ├── widgetMount.test.ts    # Widget mount API tests
│   │   ├── widgetApi.test.ts      # Widget API service tests
│   │   ├── widgetTheme.test.ts    # Widget theme management tests
│   │   ├── widgetPartner.test.ts  # Partner attribution tests
│   │   └── widgetRemoteConfig.test.ts # Remote configuration tests
│   ├── shared/                # Shared package tests
│   ├── visual/                # Visual regression tests
│   │   ├── auth-helpers.ts    # Authentication helpers for visual tests
│   │   ├── visual-setup.ts    # Visual test environment setup
│   │   ├── visual.spec.ts     # Comprehensive visual regression suite
│   │   ├── simple-visual.spec.ts  # Simplified visual tests
│   │   └── showcase.spec.ts   # Visual testing showcase and demos
│   ├── global-setup.ts        # Global test setup
│   └── global-teardown.ts     # Global test cleanup
├── docker/                      # Docker configuration
│   └── postgres/
│       └── init.sql           # Database initialization
├── docs/                        # Documentation
│   ├── ADMIN_CHAT_INTERFACE.md              # Admin chat interface documentation
│   ├── AI_INTEGRATION_SERVICE.md           # AI service documentation
│   ├── AI_DEPLOYMENT_GUIDE.md               # AI deployment guide
│   ├── API_DYNAMIC_QUESTIONS.md             # Dynamic questions API
│   ├── DASHBOARD_API_REFERENCE.md           # Dashboard metrics and visualization API
│   ├── DYNAMIC_QUESTION_ENGINE_DEPLOYMENT.md  # Question engine deployment
│   ├── EPC_COMPREHENSIVE_GUIDE.md           # Complete EPC service documentation
│   ├── OFFER_MANAGEMENT_API_REFERENCE.md    # Offer management API documentation
│   ├── QUESTION_CONTROLLER_AI_INTEGRATION.md  # Question Controller + AI Integration (M3_PHASE_03)
│   ├── VISUAL_TESTING.md                     # Visual regression testing guide
│   ├── WIDGET.md                            # Embeddable widget integration guide
│   ├── WIDGET_API_REFERENCE.md              # Widget API endpoints documentation
│   ├── WIDGET_RESILIENCE.md                 # Widget batching and resilience guide
│   └── ZOD_VALIDATION_MIGRATION.md          # Zod validation migration guide
├── examples/                    # Example implementations
│   ├── widget-test.html        # Widget integration test page
│   ├── widget-theme-test.html  # Interactive theming demonstration
│   ├── widget-remote-config.html # Remote configuration examples
│   └── widget-offline-test.html # Offline resilience and batching test page
├── .github/                     # GitHub Actions workflows
│   └── workflows/
│       └── widget-deploy.yml   # Widget production deployment pipeline
├── scripts/                     # Utility scripts
│   └── update-widget-doc.mjs   # Documentation update automation
├── docker-compose.yml          # Development services
├── vite.widget.config.ts       # Widget build configuration
├── .env.example                # Environment variables template
├── package.json                # Monorepo configuration
├── tsconfig.json              # Root TypeScript config
├── jest.config.js             # Jest test configuration
├── .eslintrc.js               # ESLint configuration
├── .prettierrc                # Prettier configuration
└── README.md                  # This file
```

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start frontend and backend concurrently
npm run dev:frontend     # Start frontend only
npm run dev:backend      # Start backend only

# Building
npm run build            # Build all packages
npm run build:frontend   # Build frontend only
npm run build:backend    # Build backend only
npm run build:widget     # Build embeddable widget (development)
npm run build:widget:prod # Build widget for production with optimization

# Testing
npm run test             # Run all tests
npm run test:frontend    # Run frontend tests
npm run test:backend     # Run backend tests
npm run test:coverage    # Run tests with coverage

# Visual Testing
npm run test:visual      # Run visual regression tests
npm run test:visual:update  # Update visual baselines
npm run test:visual:ui   # Open Playwright UI for debugging

# Code Quality
npm run lint             # Lint all packages
npm run lint:fix         # Fix linting issues
npm run type-check       # TypeScript type checking

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:migrate       # Run database migrations
npm run db:studio        # Open Prisma Studio

# Pixel Simulation (Testing)
npm run simulate-pixels  # Run pixel simulation with default settings
npm run simulate-pixels -- --clicks 20 --conversion-rate 40  # Custom simulation
npm run simulate-pixels -- --help  # Show simulation options

# Docker
docker-compose up -d     # Start services
docker-compose down      # Stop services
docker-compose logs      # View logs
```

### Development Workflow

1. **Start the development environment**
   ```bash
   docker-compose up -d  # Start PostgreSQL and Redis
   npm run dev          # Start frontend and backend
   ```

2. **Make changes**
   - Edit code in `frontend/`, `backend/`, or `shared/`
   - Hot-reload is enabled for both frontend and backend

3. **Run tests**
   ```bash
   npm run test         # Run all tests
   npm run lint         # Check code quality
   ```

4. **Database changes**
   ```bash
   # After modifying schema.prisma
   npm run db:generate  # Update Prisma client
   npm run db:push     # Apply changes to database
   ```

## ✅ Validation Status

### Current Build & Test Results

| Component | Status | Details |
|-----------|---------|---------|
| 🏗️ **Build Process** | ✅ **PASSING** | All packages compile successfully |
| 🧪 **Unit Tests** | ⚠️ **PARTIAL** | 26/26 backend & shared tests pass, frontend tests need import.meta fix |
| 🎨 **Code Quality** | ✅ **PASSING** | ESLint: 0 errors, 15 warnings (acceptable) |
| 🔍 **Type Safety** | ✅ **PASSING** | TypeScript compilation successful |
| 🐳 **Docker Services** | ✅ **READY** | PostgreSQL, Redis, management UIs configured |
| 🔧 **Development Env** | ✅ **FUNCTIONAL** | Hot reload, build process, monorepo setup working |

### Detailed Validation Results

- **✅ Level 1 (Syntax & Style)**: ESLint and TypeScript compilation passing
- **✅ Level 2 (Unit Tests)**: Backend (12/12) and Shared (14/14) tests passing  
- **✅ Level 3 (Integration)**: Docker services running, database migrations successful
- **✅ Level 4 (Workflow)**: Build process, development scripts, package structure validated

### Next Priority Fixes

1. **Frontend Test Configuration**: Fix import.meta Jest compatibility
2. **Integration Test Coverage**: Add API endpoint testing with test database
3. **Production Readiness**: Security headers, rate limiting, input validation

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL="postgresql://survai_user:survai_password@localhost:5432/survai_dev"

# Redis
REDIS_URL="redis://localhost:6379"

# Application
BACKEND_PORT=8000
FRONTEND_PORT=3000
NODE_ENV=development

# AI Integration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=1000
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2

# Authentication (Required for Admin Features)
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here

# Default admin user (for development)
ADMIN_EMAIL=admin@survai.com
ADMIN_PASSWORD=admin123
```

### Docker Services

The development environment includes:

- **PostgreSQL** (localhost:5432) - Main database
- **Redis** (localhost:6379) - Caching and sessions
- **pgweb** (localhost:8085) - Database management UI
- **Redis Commander** (localhost:8081) - Redis management UI

## 🧪 Testing

### Test Structure

```
tests/
├── backend/           # Backend API tests
├── frontend/          # React component tests
├── shared/           # Shared types tests
└── visual/           # Visual regression tests
    ├── auth-helpers.ts    # Authentication helpers
    ├── visual-setup.ts    # Test environment setup
    ├── visual.spec.ts     # Comprehensive visual tests
    ├── simple-visual.spec.ts  # Simplified visual tests
    └── showcase.spec.ts   # Visual testing showcase
```

### Running Tests

```bash
# All tests
npm run test

# Specific test suites
npm run test:backend
npm run test:frontend
npm run test:shared

# Visual regression tests
npm run test:visual              # Run visual tests
npm run test:visual:update       # Update visual baselines
npm run test:visual:ui           # Open Playwright UI

# Watch mode
npm run test:watch

# Coverage reports
npm run test:coverage
```

### Test Examples

**Backend API Test:**
```typescript
describe('Health Endpoint', () => {
  it('should return healthy status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200)
    
    expect(response.body.success).toBe(true)
    expect(response.body.data.status).toBe('healthy')
  })
})
```

**Frontend Component Test:**
```typescript
describe('App Component', () => {
  it('should render without crashing', () => {
    render(<App />)
    expect(screen.getByText('SurvAI MVP')).toBeInTheDocument()
  })
})
```

**Visual Regression Test:**
```typescript
describe('Visual Regression Testing', () => {
  it('should capture homepage consistently', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Compare with baseline screenshot (0.1% threshold)
    await expect(page).toHaveScreenshot('homepage.png')
  })
})
```

## 🔐 Authentication System

### Overview

SurvAI implements a secure authentication system designed for proprietary use with the following features:

- **JWT-based authentication** with HTTP-only cookies for secure token storage
- **Single-role access control** with ADMIN role for all authenticated users
- **Password hashing** using bcrypt with 12 salt rounds
- **Session management** with automatic cleanup and expiration
- **Authentication middleware** for route protection

### Authentication Flow

1. **User Registration**: Create new admin users with email and password
2. **User Login**: Authenticate with credentials and receive JWT token
3. **Protected Routes**: Access admin features with valid authentication
4. **Session Management**: Automatic token refresh and cleanup

### Authentication Endpoints

#### Register User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "securepassword123",
  "name": "Admin User"
}
```

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "securepassword123"
}
```

#### Logout
```bash
POST /api/auth/logout
```

#### Get Current User
```bash
GET /api/auth/me
```

### Frontend Authentication

The frontend uses React Context for authentication state management:

```typescript
import { useAuth } from '@/hooks/useAuth'

function MyComponent() {
  const { user, login, logout, isAuthenticated } = useAuth()
  
  if (!isAuthenticated) {
    return <LoginPage />
  }
  
  return <Dashboard user={user} />
}
```

### Route Protection

```typescript
import { withAuth } from '@/hooks/useAuth'

// Protect routes requiring authentication
const AdminPanel = withAuth(AdminComponent)
```

### Development Setup

1. **Create test admin user:**
   ```bash
   npm run create-test-user
   ```

2. **Default credentials** (development only):
   - Email: `admin@survai.com`
   - Password: `admin123`

### Security Features

- **HTTP-only cookies** prevent XSS attacks
- **SameSite cookie policy** prevents CSRF attacks
- **bcrypt password hashing** with 12 salt rounds
- **JWT tokens** with 15-minute expiration
- **Automatic token refresh** on API calls
- **Session cleanup** on logout

## 🤖 AI Integration Service

### Overview

The AI Integration Service provides a unified interface for generating survey questions using multiple AI providers with automatic fallback logic. The service supports OpenAI and Ollama with built-in security, performance tracking, and error handling.

### Key Features

- **Multi-Provider Support**: OpenAI (primary) and Ollama (fallback)
- **Automatic Fallback**: Seamless provider switching on failure
- **Content Sanitization**: XSS prevention for all AI-generated content
- **Performance Tracking**: Metrics collection for each provider
- **Error Handling**: Comprehensive error management and logging
- **Type Safety**: Full TypeScript support with shared types

### Quick Start

```typescript
import { aiService } from '../services/aiService';

// Generate a question with context
const result = await aiService.generateQuestion({
  userIncome: '50000-75000',
  employment: 'full-time',
  surveyType: 'financial-assistance'
});

console.log(result.text);      // Generated question
console.log(result.provider);  // 'openai' or 'ollama'
console.log(result.confidence); // 0.8
```

### Provider Setup

#### OpenAI Configuration
```bash
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=1000
```

#### Ollama Configuration
```bash
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2
```

### Documentation

- **📖 [AI Integration Service Documentation](docs/AI_INTEGRATION_SERVICE.md)** - Complete API reference and usage guide
- **🚀 [AI Deployment Guide](docs/AI_DEPLOYMENT_GUIDE.md)** - Production deployment and scaling guide  
- **⚡ [Question Controller + AI Integration](docs/QUESTION_CONTROLLER_AI_INTEGRATION.md)** - M3_PHASE_03 implementation guide
- **🔧 [Zod Validation Migration Guide](docs/ZOD_VALIDATION_MIGRATION.md)** - TypeScript-first validation upgrade
- **📊 [EPC Comprehensive Guide](docs/EPC_COMPREHENSIVE_GUIDE.md)** - Complete EPC service documentation including architecture and API reference
- **📊 [Dashboard API Reference](docs/DASHBOARD_API_REFERENCE.md)** - Admin dashboard metrics, visualization, and analytics API guide
- **💼 [Offer Management API Reference](docs/OFFER_MANAGEMENT_API_REFERENCE.md)** - Complete offer management CRUD operations API guide
- **💬 [Admin Chat Interface Guide](docs/ADMIN_CHAT_INTERFACE.md)** - Conversational admin panel with slash commands documentation
- **🎯 [Visual Testing Guide](docs/VISUAL_TESTING.md)** - Comprehensive visual regression testing with Playwright guide
- **🔗 [Widget Integration Guide](docs/WIDGET.md)** - Embeddable widget integration for external partners
- **🔗 [Widget API Reference](docs/WIDGET_API_REFERENCE.md)** - Complete API documentation for widget endpoints
- **🔄 [Widget Resilience Guide](docs/WIDGET_RESILIENCE.md)** - Intelligent batching, offline persistence, and network resilience
- **📋 [Features Overview](docs/FEATURES_OVERVIEW.md)** - Comprehensive overview of all SurvAI features

### Architecture

The AI service follows a provider-agnostic architecture:

1. **AIService**: Main service class managing providers
2. **Provider Management**: Handles OpenAI and Ollama clients
3. **Fallback Logic**: Automatic provider switching (OpenAI → Ollama)
4. **Content Sanitization**: XSS prevention using sanitize-html
5. **Performance Metrics**: Request tracking and analytics

## 🎛️ Admin Dashboard

### Overview

The admin dashboard provides comprehensive management and analytics for the SurvAI platform. Access is restricted to authenticated admin users only.

### Features

#### Offer Management
- **Real-time analytics** with auto-refresh every 30 seconds
- **EPC performance tracking** showing earnings per click for each offer
- **Pixel URL management** with copy-to-clipboard functionality
- **Offer configuration** including payouts, click caps, and targeting rules
- **Performance metrics** displaying clicks, conversions, and revenue
- **Detailed offer analytics** with conversion rates and revenue tracking

#### Survey Management (Coming Soon)
- Survey creation and editing interface
- Question builder with AI assistance
- A/B testing capabilities
- Performance optimization tools

#### Analytics Dashboard
- **Real-time EPC calculations** with automatic updates
- **Conversion tracking** with pixel-based attribution
- **Click analytics** with device and geographic data
- **Revenue monitoring** with detailed performance breakdowns
- **Offer ranking** based on EPC performance

### Admin Interface Components

#### OfferManagement Component
Located at `/admin`, provides:
- Tabular view of all offers with key metrics
- Real-time EPC, click, and conversion data
- Pixel URL display and copying
- Detailed offer modal with comprehensive analytics

#### OfferMetrics Component
Detailed analytics view featuring:
- Key performance indicators (EPC, clicks, conversions)
- Offer configuration details
- Targeting information
- URL management (destination and pixel URLs)
- Manual refresh capabilities

### Access Control

- **Authentication required** - All admin routes protected by JWT authentication
- **Admin role enforcement** - Only users with ADMIN role can access
- **Session management** - Automatic token refresh and cleanup
- **Secure routing** - Protected routes redirect to login if unauthenticated

### Usage

1. **Login** with admin credentials at `/login`
2. **Navigate** to admin dashboard at `/admin`
3. **View offers** in the offer management section
4. **Monitor performance** with real-time EPC and conversion data
5. **Copy pixel URLs** for affiliate integration
6. **Analyze metrics** with detailed offer performance views

## 💬 Admin Chat Interface

### Overview

The Admin Chat Interface provides a conversational approach to managing offers and questions directly within the Dashboard. It features slash commands for streamlined administration and real-time command processing with integrated modal support.

### Key Features

#### Slash Commands
- **`/help`** - Display all available commands with usage examples
- **`/list-offers [page] [limit]`** - List offers with pagination in table format
- **`/add-offer <url>`** - Open offer creation modal with pre-filled destination URL
- **`/list-questions [surveyId]`** - List questions for specific survey or all questions
- **`/add-question <surveyId>`** - Open question creation modal for specified survey

#### Interface Features
- **Real-time Processing**: Instant command execution with loading states
- **Chat History**: Persistent session history with keyboard navigation (Up/Down arrows)
- **Authentication Integration**: Enforced admin access using existing auth system
- **Modal Integration**: Seamless connection with existing offer management modals
- **Rich Content**: Table formatting, success/error messages, and interactive responses
- **Minimize/Maximize**: Collapsible sidebar that doesn't interfere with dashboard
- **Error Handling**: Comprehensive error messages and validation feedback

### Quick Start

1. **Access Chat Panel**: The chat interface appears as a fixed sidebar on the admin dashboard
2. **Start with Help**: Type `/help` to see all available commands
3. **List Offers**: Use `/list-offers` to see current offers in table format
4. **Add New Offer**: Use `/add-offer https://example.com` to open creation modal
5. **Navigate History**: Use Up/Down arrow keys to navigate previous commands

### Command Examples

```bash
# Get help and available commands
/help

# List first 10 offers
/list-offers

# List offers with pagination
/list-offers 2 5

# Add new offer with URL
/add-offer https://affiliate-network.com/offer/123

# List all questions
/list-questions

# List questions for specific survey
/list-questions survey-123

# Add question to survey
/add-question survey-456
```

### Technical Architecture

#### Components
- **ChatPanel.tsx**: Main container component with state management
- **ChatInput.tsx**: Input field with slash command detection and keyboard shortcuts
- **ChatMessage.tsx**: Message display with rich formatting and type-based styling
- **ChatHistory.tsx**: Scrollable message history with auto-scroll functionality
- **ChatControls.tsx**: Header controls for minimize/maximize and history management

#### Command Processing
- **useChatCommands.ts**: Custom hook for command parsing and execution
- **Regex-based Parsing**: Simple and reliable command pattern matching
- **API Integration**: Direct integration with existing offer and question services
- **Modal State Management**: Coordinated state between chat and existing modals

#### Authentication & Security
- **Admin Only Access**: Restricted to authenticated admin users
- **Input Validation**: Comprehensive validation for all command arguments
- **Error Boundaries**: Graceful error handling with user feedback
- **Session Management**: Integrated with existing JWT authentication

### Usage Patterns

#### Offer Management Workflow
```typescript
// Quick offer listing
/list-offers

// Add new offer (opens modal)
/add-offer https://new-affiliate-offer.com

// Check updated list
/list-offers 1 5
```

#### Question Management Workflow
```typescript
// View available questions
/list-questions

// Add question to specific survey
/add-question survey-abc-123

// Verify addition
/list-questions survey-abc-123
```

### Performance & UX
- **Fast Response Times**: Commands execute in real-time with loading indicators
- **Keyboard Shortcuts**: Enter to send, Esc to clear, Up/Down for history
- **Auto-scroll**: Chat history automatically scrolls to new messages
- **Responsive Design**: Adapts to different screen sizes and dashboard layouts
- **Memory Efficient**: Maintains reasonable chat history with cleanup

## 🔗 Embeddable Widget

### Overview

The SurvAI embeddable widget allows external partners to integrate SurvAI surveys directly into their websites with a simple script tag. The widget is self-contained, lightweight (< 250kB), and uses Shadow DOM for complete CSS isolation.

### Key Features

- **🚀 Lightweight Bundle**: 7.4kB gzipped UMD bundle with advanced resilience features
- **🛡️ CSS Isolation**: Shadow DOM prevents style conflicts with host pages
- **🎨 Advanced Theming**: CSS Variables-based theming with 11 theme properties and remote configuration support
- **🤝 Partner Attribution**: Comprehensive partner tracking with automatic partner ID propagation
- **🔧 Simple Integration**: Single script tag and mount function with async support
- **🔒 Secure**: Cross-domain CORS support with proper error handling and security filtering
- **📱 Responsive**: Mobile-first design that works on all devices
- **⚡ Performance**: Efficient bundle size with external React dependencies
- **🔄 Remote Configuration**: Centralized configuration management with graceful fallback
- **🔄 Network Resilience**: Intelligent click event batching and offline persistence
- **⚡ Exponential Backoff**: Automatic retry with smart delay progression (2s → 30s max)
- **💾 Data Integrity**: Zero data loss during network outages with localStorage persistence
- **🚀 Production Pipeline**: Automated CDN deployment with versioning, integrity hashes, and size validation

### Quick Integration

```html
<!-- Load React dependencies -->
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

<!-- Load SurvAI Widget -->
<script src="https://cdn.survai.app/widget/1.0.0/survai-widget.js" 
        integrity="sha384-uB+JC2m2xgdhhUPqO+lrgQAt7ljODakP/CgP60RtqF2cL4mpQjlVtjZ6RyL+lbWk" 
        crossorigin="anonymous"></script>

<div id="survai-widget"></div>

<script>
// Mount the widget with enhanced theming and partner attribution
const widget = await SurvAIWidget.mount(document.getElementById('survai-widget'), {
    surveyId: 'your-survey-id',
    apiUrl: 'https://api.survai.com',
    partnerId: 'your-partner-id',
    theme: {
        primaryColor: '#3182ce',
        secondaryColor: '#e2e8f0',
        accentColor: '#38a169',
        backgroundColor: '#ffffff',
        textColor: '#1a202c',
        borderRadius: '8px',
        buttonSize: 'large',
        spacing: 'normal',
        shadows: true,
        transitions: true
    },
    configUrl: 'https://config.yoursite.com/survai-theme.json' // Optional remote config
});
</script>
```

### Widget Features

#### Shadow DOM Isolation
- **Complete CSS isolation** prevents styles from bleeding to/from host page
- **Encapsulated components** with self-contained styling
- **No interference** with host page JavaScript or styles

#### Advanced Theme Customization
- **Comprehensive Color System**: 5 color properties (primary, secondary, accent, background, text) with CSS Variables
- **Typography Control**: Custom font family with consistent theming
- **Layout Options**: Configurable button sizes (small, medium, large) and spacing density (compact, normal, spacious)
- **Visual Effects**: Optional shadows and transitions for enhanced user experience
- **Remote Configuration**: Centralized theme management with CORS-safe loading and security filtering
- **Configuration Precedence**: Inline options override remote config for flexible deployment

#### Error Handling
- **Network resilience** with retry logic and timeout handling
- **Graceful degradation** for API failures
- **User feedback** with clear error messages
- **Fallback content** when surveys are unavailable

#### Session Management & Partner Attribution
- **Automatic session bootstrap** with unique session and click IDs
- **Partner ID propagation** across all API calls for comprehensive attribution
- **Cross-domain tracking** with proper CORS headers
- **Secure communication** with the SurvAI API
- **Session persistence** for multi-question surveys
- **Partner-specific analytics** with detailed attribution reporting

### Development & Testing

The widget includes comprehensive development tools:

- **Test Page**: `/examples/widget-test.html` for manual testing
- **Theme Testing**: `/examples/widget-theme-test.html` with interactive theme customization
- **Remote Config Demo**: `/examples/widget-remote-config.html` for configuration testing
- **Offline Testing**: `/examples/widget-offline-test.html` for resilience and batching testing
- **Theme Variations**: Multiple theme examples with live preview
- **Error Simulation**: Test error handling scenarios
- **Performance Monitoring**: Bundle size and load time tracking

### API Integration

The widget seamlessly integrates with existing SurvAI APIs:

- **Session Bootstrap**: `POST /api/sessions` for session initialization with partner ID support
- **Question Fetching**: `POST /api/questions/:surveyId/next` for survey content with partner attribution
- **Click Tracking**: `POST /api/track/click` for conversion tracking with partner ID propagation
- **Cross-Domain**: Full CORS support for external domain integration
- **Partner Attribution**: Automatic partner ID inclusion in all API calls for comprehensive tracking

### Production Deployment Pipeline

The widget features an automated production deployment pipeline that:

- **🔄 Automatic Deployment**: Triggered by commits containing `WIDGET_RELEASE=true`
- **📦 Bundle Optimization**: Production build with terser minification and tree-shaking
- **📊 Size Validation**: Fails deployment if bundle exceeds 100kB gzipped (currently 7.4kB)
- **🔐 Security**: Generates SHA-384 integrity hashes for all deployments
- **☁️ CDN Distribution**: Uploads to Google Cloud Storage with CloudFlare invalidation
- **🏷️ Version Management**: Creates git tags (`widget-v1.0.0`) for each release
- **📝 Auto-Documentation**: Updates `docs/WIDGET.md` with new CDN URLs and hashes

#### Deployment Process

1. **Increment Version**: Update version in `package.json`
2. **Create Release**: Commit with `WIDGET_RELEASE=true` in commit message
3. **Automatic Build**: GitHub Actions builds, validates, and deploys
4. **CDN Distribution**: Bundle deployed to `https://cdn.survai.app/widget/{version}/`
5. **Documentation Update**: Widget documentation automatically updated

#### GitHub Actions Workflow

The deployment pipeline includes:
- **Bundle Size Validation**: Ensures optimized builds under size limits
- **Integrity Hash Generation**: SHA-384 hashes for security verification
- **CDN Deployment**: Google Cloud Storage upload with public access
- **Cache Invalidation**: CloudFlare cache clearing for immediate updates
- **Git Tagging**: Semantic versioning with deployment metadata
- **Documentation Updates**: Automatic embed snippet updates

### Documentation

Complete integration documentation is available at:
- **📖 [Widget Integration Guide](docs/WIDGET.md)** - Comprehensive setup and usage guide with theming and partner attribution
- **🔗 [Widget API Reference](docs/WIDGET_API_REFERENCE.md)** - Complete API documentation for widget endpoints
- **🧪 [Test Page](examples/widget-test.html)** - Interactive testing and examples
- **🎨 [Theme Demo](examples/widget-theme-test.html)** - Interactive theme customization with live preview
- **🔄 [Remote Config Demo](examples/widget-remote-config.html)** - Remote configuration examples and testing
- **🔄 [Offline Test Page](examples/widget-offline-test.html)** - Resilience and batching testing with network simulation
- **🔧 [Build Configuration](vite.widget.config.ts)** - Widget build setup
- **🚀 [Production Pipeline](.github/workflows/widget-deploy.yml)** - Automated deployment workflow

## 📚 API Documentation

### Health Check

```bash
GET /health
```

Response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "version": "1.0.0",
    "database": "connected"
  }
}
```

### Affiliate Tracking Endpoints

#### Track Click
```bash
POST /api/track/click?partnerId=partner-abc-123
Content-Type: application/json

{
  "sessionId": "session_123",
  "offerId": "offer_456",
  "questionId": "question_789",
  "buttonVariantId": "variant_abc",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

**Enhanced Features:**
- **Input Validation**: Comprehensive Joi schema validation for all parameters
- **Session Validation**: Verifies session exists before processing click
- **Offer Validation**: Ensures offer is active and valid
- **Idempotent Processing**: Prevents duplicate click tracking
- **Partner Attribution**: Partner ID automatically included in click tracking and analytics

#### Conversion Pixel Tracking
```bash
GET /api/track/pixel/:click_id?revenue=25.50
```

Response:
```json
{
  "success": true,
  "data": {
    "converted": true
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Enhanced Features:**
- **Idempotent Conversions**: Prevents double-conversions through atomic transactions
- **Revenue Validation**: Validates revenue parameter format and range
- **Error Handling**: Detailed error messages for validation failures

#### Conversion Postback (Alternative)
```bash
POST /api/track/conversion
Content-Type: application/json

{
  "click_id": "click_123",
  "revenue": 25.50
}
```

### Session Management Endpoints

#### Bootstrap Session (Widget Integration)
```bash
POST /api/sessions?partnerId=partner-abc-123
Content-Type: application/json

{
  "surveyId": "survey_123",
  "metadata": {
    "source": "widget",
    "domain": "partner-site.com"
  }
}
```

Response:
```json
{
  "success": true,
  "data": {
    "sessionId": "session_abc123",
    "clickId": "click_def456",
    "surveyId": "survey_123",
    "metadata": {
      "source": "widget",
      "domain": "partner-site.com"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Enhanced Features:**
- **Partner ID Support**: Automatic partner attribution via query parameter
- **Widget Integration**: Optimized for embeddable widget use cases
- **Session Tracking**: Comprehensive session management with click ID generation

### Survey Endpoints

#### Get Next Question
```bash
POST /api/questions/:surveyId/next?partnerId=partner-abc-123
Content-Type: application/json

{
  "sessionId": "session_456",
  "previousQuestionId": "question_789",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

**Enhanced Features:**
- **Partner Attribution**: Partner ID automatically included in analytics and tracking
- **Survey Flow**: Intelligent question routing based on EPC optimization
- **Session Continuity**: Seamless multi-question survey progression with partner context

#### Generate Question (AI-Powered) - NEW
```bash
POST /api/questions/generate
Content-Type: application/json

{
  "surveyId": "survey_123",
  "useAI": true,
  "text": "Fallback question text",
  "aiContext": {
    "userIncome": "50000-75000",
    "employment": "full-time",
    "surveyType": "financial-planning"
  }
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "question_new_456",
    "text": "What financial goal interests you most?",
    "aiVersions": {
      "generated": true,
      "provider": "openai",
      "confidence": 0.95
    }
  }
}
```

#### Update Question - NEW
```bash
PUT /api/questions/:id
Content-Type: application/json

{
  "text": "Updated question text",
  "description": "Updated description",
  "required": true
}
```

#### Get Survey Questions (EPC Ordered) - NEW
```bash
GET /api/questions/:surveyId
```

Response:
```json
{
  "success": true,
  "data": {
    "question": {
      "id": "question_abc",
      "type": "CTA_OFFER",
      "text": "Which financial service interests you most?",
      "description": "Select the option that best matches your needs"
    },
    "offerButtons": [
      {
        "id": "button_123",
        "text": "Get Your Financial Planning",
        "offerId": "offer_456",
        "style": "primary",
        "order": 1
      }
    ],
    "sessionData": {
      "sessionId": "session_456",
      "clickId": "click_789"
    }
  }
}
```

#### Get Survey Questions (EPC Ordered) Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "question_high_epc",
      "text": "What interests you most?",
      "order": 1,
      "aiVersions": {
        "generated": true,
        "provider": "openai"
      }
    },
    {
      "id": "question_medium_epc", 
      "text": "Choose your preference",
      "order": 2,
      "aiVersions": null
    }
  ]
}
```

### EPC Service Endpoints

#### Calculate Offer EPC
```bash
POST /api/epc/calculate/:offerId
```

Response:
```json
{
  "success": true,
  "data": {
    "epc": 3.75,
    "offerId": "offer_123",
    "windowDays": 7,
    "lastUpdated": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Update Offer EPC
```bash
POST /api/epc/update/:offerId
```

Response:
```json
{
  "success": true,
  "data": {
    "updated": true,
    "offerId": "offer_123",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Analytics Endpoints

#### Get Offer Analytics
```bash
GET /api/analytics/offer/:offerId
```

Response:
```json
{
  "success": true,
  "data": {
    "totalClicks": 1250,
    "conversions": 87,
    "conversionRate": 6.96,
    "totalRevenue": 2175.50,
    "epc": 1.74
  }
}
```

### API Structure

All API responses follow this structure:

```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
}
```

## 🚢 Deployment

### Build for Production

```bash
# Build all packages
npm run build

# Test production build
npm run preview
```

### Environment Setup

1. **Database**: Set up PostgreSQL instance
2. **Cache**: Set up Redis instance
3. **Environment**: Configure production environment variables
4. **Build**: Run build process
5. **Deploy**: Deploy built assets

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm run test`
5. Run linting: `npm run lint`
6. Commit changes: `git commit -m 'Add amazing feature'`
7. Push to branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Code Style

- **TypeScript**: All code must be written in TypeScript
- **ESLint**: Follow the configured ESLint rules
- **Prettier**: Code is automatically formatted with Prettier
- **Testing**: All new features must include tests

### Commit Convention

```
type(scope): description

# Examples:
feat(frontend): add survey builder component
fix(backend): resolve health check database connection
docs(readme): update installation instructions
test(api): add integration tests for offers endpoint
```

## 🐛 Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Kill process using port 3000 or 8000
lsof -ti:3000 | xargs kill -9
lsof -ti:8000 | xargs kill -9
```

**Database connection issues:**
```bash
# Restart Docker services
docker-compose down
docker-compose up -d

# Check service status
docker-compose ps
```

**Node modules issues:**
```bash
# Clean install
npm run clean
npm install
```

**TypeScript errors:**
```bash
# Regenerate Prisma client
npm run db:generate

# Check TypeScript configuration
npm run type-check
```

### Logs and Debugging

```bash
# View application logs
npm run dev  # Shows both frontend and backend logs

# View Docker service logs
docker-compose logs postgres
docker-compose logs redis

# Backend logs location
backend/logs/

# Enable debug mode
DEBUG=survai:* npm run dev
```

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Documentation**: [Wiki](https://github.com/your-repo/wiki)
- **Email**: support@survai.com

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎉 Acknowledgments

- **React Team** for the amazing frontend framework
- **Prisma Team** for the excellent ORM
- **Vite Team** for the fast build tool
- **TypeScript Team** for type safety
- **Contributors** who help improve this project

---

**Built with ❤️ by the SurvAI Team**