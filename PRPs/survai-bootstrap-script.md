name: "SurvAI Bootstrap Script - M5_PHASE_05 Implementation"
description: |

## Purpose
Create a comprehensive bootstrap script that sets up the entire SurvAI stack for fresh developer or CI environments with a single command. This PRP provides complete context for implementing scripts/init.sh with proper environment setup, Docker orchestration, database migrations, and health checks.

## Core Principles
1. **One-Command Setup**: Single `./scripts/init.sh` command sets up entire development environment
2. **Fail-Fast Validation**: Check prerequisites before proceeding with setup
3. **Health-Check Integration**: Use Docker native health checks for service readiness
4. **Cross-Platform Support**: Works on macOS and Linux, graceful degradation on Windows
5. **Progressive Enhancement**: Start services, wait for health, then migrate/seed

---

## Goal
Build a robust bootstrap script (`scripts/init.sh`) that transforms a fresh SurvAI codebase into a fully operational development environment with:
- Docker services running (PostgreSQL, Redis, pgweb, redis-commander)
- Environment variables configured with generated secrets
- Database migrations applied and initial data seeded
- Health checks passing for all services
- Smoke tests confirming API accessibility
- Documentation updated with quick-start instructions

## Why
- **Developer Experience**: Reduces onboarding from hours to minutes
- **CI/CD Integration**: Enables automated testing and deployment pipelines
- **Consistency**: Ensures all developers work with identical environments
- **Documentation**: Provides single source of truth for setup procedures
- **Troubleshooting**: Reduces environment-related issues through standardization

## What
A comprehensive bootstrap script that:
1. Validates prerequisites (Docker, Node.js, npm)
2. Copies and populates `.env` file with generated secrets
3. Starts Docker Compose services with health checks
4. Waits for PostgreSQL and Redis to be ready
5. Applies Prisma migrations and seeds initial data
6. Performs smoke tests on backend health endpoint
7. Displays colorized success/failure messages
8. Updates README.md and DEPLOYMENT.md with usage instructions

### Success Criteria
- [ ] `bash scripts/init.sh` completes without errors on fresh codebase
- [ ] All Docker services (`postgres`, `redis`, `pgweb`, `redis-commander`) are running
- [ ] `.env` file exists with non-placeholder JWT_SECRET and generated values
- [ ] Database migrations applied and seed data populated
- [ ] Health check endpoint `http://localhost:8000/health` returns 200 OK
- [ ] Script provides clear feedback with colorized output
- [ ] Works on both macOS and Linux (Ubuntu 20.04+)
- [ ] README.md contains accurate quick-start instructions
- [ ] DEPLOYMENT.md updated with bootstrap script documentation

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- url: https://github.com/peter-evans/docker-compose-healthcheck
  why: Modern Docker Compose health check patterns and best practices
  
- url: https://laurent-bel.medium.com/waiting-for-postgresql-to-start-in-docker-compose-c72271b3c74a
  why: PostgreSQL health check implementation with pg_isready
  
- url: https://www.denhox.com/posts/forget-wait-for-it-use-docker-compose-healthcheck-and-depends-on-instead/
  why: Native Docker health checks vs external wait scripts
  
- url: https://medium.com/@gigi.shalamberidze2022/implementing-secure-authentication-authorization-in-express-js-with-jwt-typescript-and-prisma-087c90596889
  why: JWT secret generation and environment configuration patterns
  
- file: /home/ado/SurvAI.3.0/docker-compose.yml
  why: Service definitions, health checks, and port configurations
  
- file: /home/ado/SurvAI.3.0/.env.example
  why: Complete environment variable template and placeholder patterns
  
- file: /home/ado/SurvAI.3.0/package.json
  why: Workspace structure and npm scripts for build/test/dev
  
- file: /home/ado/SurvAI.3.0/backend/package.json
  why: Backend-specific scripts including db:migrate, db:seed, db:deploy
  
- file: /home/ado/SurvAI.3.0/backend/src/app.ts
  why: Health endpoint implementation and expected response format
  
- file: /home/ado/SurvAI.3.0/PLANNING.md
  why: Project architecture, tech stack, and development conventions
  
- file: /home/ado/SurvAI.3.0/README.md
  why: Current setup instructions and documentation patterns
  
- docfile: /home/ado/SurvAI.3.0/docs/README.md
  why: Documentation structure and deployment guides
```

### Current Codebase Structure
```bash
SurvAI.3.0/
├── docker-compose.yml          # Services: postgres, redis, pgweb, redis-commander
├── .env.example               # Environment template with placeholders
├── package.json               # Root workspace configuration
├── scripts/                   # Existing utility scripts
│   ├── placeholder-audit.mjs  # Placeholder detection
│   └── update-widget-doc.mjs  # Documentation updates
├── backend/
│   ├── package.json           # Backend npm scripts (db:migrate, db:seed, etc.)
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── migrations/        # Migration files
│   └── src/
│       ├── app.ts             # Express app with /health endpoint
│       ├── server.ts          # Server startup
│       └── scripts/           # Existing utility scripts
├── frontend/
│   └── package.json           # Frontend build scripts
├── shared/
│   └── package.json           # Shared types and utilities
└── docs/                      # Documentation files
```

### Desired Codebase Structure (After Implementation)
```bash
SurvAI.3.0/
├── scripts/
│   ├── init.sh                # NEW: Main bootstrap script
│   ├── placeholder-audit.mjs  # Existing
│   └── update-widget-doc.mjs  # Existing
├── .env                       # NEW: Generated environment file
├── README.md                  # UPDATED: Quick-start section
├── docs/
│   └── DEPLOYMENT.md          # UPDATED: Bootstrap documentation
└── [existing structure unchanged]
```

### Known Gotchas & Library Quirks
```bash
# CRITICAL: Docker Compose v2 vs v1 command differences
# Modern: docker compose (space) vs legacy: docker-compose (hyphen)
# Detection: Check if docker compose version works, fallback to docker-compose

# CRITICAL: PostgreSQL health check timing
# pg_isready doesn't guarantee migrations can run immediately
# Always use depends_on with condition: service_healthy

# CRITICAL: Node.js workspace commands
# Use npm run <command> --workspace=<name> for workspace-specific commands
# Backend migrations: npm run db:migrate --workspace=backend

# CRITICAL: JWT Secret Generation
# Use openssl rand -hex 32 or node -e "console.log(crypto.randomBytes(32).toString('hex'))"
# Never use predictable patterns or short secrets

# CRITICAL: Environment variable validation
# Backend validates required vars on startup (validateEnv.ts)
# Missing vars cause immediate crash with helpful error messages

# CRITICAL: Port conflicts
# Default ports: Backend 8000, Frontend 3000, Postgres 5432, Redis 6379
# Check for conflicts before starting services

# CRITICAL: Cross-platform compatibility
# Use /bin/bash shebang, avoid Linux-specific commands
# Use command -v instead of which for command detection
```

## Implementation Blueprint

### Data Models and Structure
The bootstrap script primarily works with:
```bash
# Environment Configuration Structure
.env file format:
DATABASE_URL="postgresql://user:pass@localhost:5432/db"
JWT_SECRET="<generated-32-byte-hex>"
SESSION_SECRET="<generated-32-byte-hex>"
REDIS_URL="redis://localhost:6379"
BACKEND_PORT=8000
FRONTEND_PORT=3000
NODE_ENV=development

# Docker Service Health States
postgres: healthy | unhealthy | starting
redis: healthy | unhealthy | starting
pgweb: running (depends on postgres healthy)
redis-commander: running (depends on redis healthy)

# Health Check Response Format (from backend/src/app.ts)
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "version": "1.0.0",
    "database": "connected",
    "checks": {
      "database": true,
      "environment": "development",
      "uptime": 123.45,
      "memory": {...}
    }
  }
}
```

### List of Tasks to Complete (In Order)

```yaml
Task 1: Create scripts/init.sh foundation
CREATE scripts/init.sh:
  - ADD shebang #!/bin/bash and set -euo pipefail
  - ADD colorized output functions (red, green, yellow, blue)
  - ADD prerequisite checking (Docker, Node.js, npm)
  - ADD usage instructions and help flag support
  - ENSURE executable permissions (chmod +x)

Task 2: Environment file generation
MODIFY scripts/init.sh:
  - ADD function to copy .env.example to .env if not exists
  - ADD JWT_SECRET generation using Node.js crypto.randomBytes
  - ADD SESSION_SECRET generation using Node.js crypto.randomBytes
  - ADD OLLAMA_URL default if not present
  - ADD validation of required environment variables
  - PRESERVE existing .env if already present (prompt user)

Task 3: Docker service orchestration
MODIFY scripts/init.sh:
  - ADD Docker Compose command detection (docker compose vs docker-compose)
  - ADD function to start Docker services with docker-compose up -d
  - ADD health check waiting loop using docker inspect
  - ADD service status reporting with colored output
  - ADD error handling for Docker daemon not running

Task 4: Database setup and migrations
MODIFY scripts/init.sh:
  - ADD PostgreSQL readiness check using pg_isready approach
  - ADD Prisma migration deployment using npm run db:deploy --workspace=backend
  - ADD database seeding using npm run db:seed --workspace=backend
  - ADD migration status reporting
  - ADD error handling for migration failures

Task 5: Health and smoke tests
MODIFY scripts/init.sh:
  - ADD backend health check using curl to http://localhost:8000/health
  - ADD response validation for 200 status and "healthy" status
  - ADD port availability checks before starting services
  - ADD comprehensive success/failure reporting
  - ADD cleanup function for failed initialization

Task 6: Documentation updates
MODIFY README.md:
  - ADD "Quick Start" section with ./scripts/init.sh instructions
  - ADD prerequisites section (Docker, Node.js 18+, npm)
  - ADD troubleshooting section for common issues
  - PRESERVE existing documentation structure

MODIFY docs/DEPLOYMENT.md:
  - ADD bootstrap script documentation
  - ADD environment configuration details
  - ADD Docker service descriptions
  - ADD health check endpoint documentation
```

### Per Task Pseudocode

```bash
# Task 1: Foundation Script Structure
#!/bin/bash
set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Color output functions
red() { echo -e "\033[31m$1\033[0m"; }
green() { echo -e "\033[32m$1\033[0m"; }
yellow() { echo -e "\033[33m$1\033[0m"; }
blue() { echo -e "\033[34m$1\033[0m"; }

# Prerequisites check
check_prerequisites() {
    command -v docker >/dev/null 2>&1 || { red "Docker not found"; exit 1; }
    command -v node >/dev/null 2>&1 || { red "Node.js not found"; exit 1; }
    command -v npm >/dev/null 2>&1 || { red "npm not found"; exit 1; }
}

# Task 2: Environment Setup
setup_environment() {
    if [[ ! -f .env ]]; then
        cp .env.example .env
        # Generate 32-byte hex secrets
        JWT_SECRET=$(node -e "console.log(crypto.randomBytes(32).toString('hex'))")
        SESSION_SECRET=$(node -e "console.log(crypto.randomBytes(32).toString('hex'))")
        
        # Replace placeholders in .env
        sed -i.bak "s/your_jwt_secret_here_change_in_production/$JWT_SECRET/g" .env
        sed -i.bak "s/your_session_secret_here_change_in_production/$SESSION_SECRET/g" .env
        
        # Set OLLAMA_URL default if not present
        if ! grep -q "OLLAMA_BASE_URL=http://localhost:11434" .env; then
            sed -i.bak "s|OLLAMA_BASE_URL=.*|OLLAMA_BASE_URL=http://localhost:11434|g" .env
        fi
    fi
}

# Task 3: Docker Services
start_docker_services() {
    # Detect Docker Compose command
    if command -v docker compose >/dev/null 2>&1; then
        DOCKER_COMPOSE="docker compose"
    elif command -v docker-compose >/dev/null 2>&1; then
        DOCKER_COMPOSE="docker-compose"
    else
        red "Docker Compose not found"
        exit 1
    fi
    
    blue "Starting Docker services..."
    $DOCKER_COMPOSE up -d
    
    # Wait for health checks
    wait_for_service "postgres"
    wait_for_service "redis"
}

wait_for_service() {
    local service=$1
    local max_attempts=30
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if docker inspect --format='{{.State.Health.Status}}' "$(docker-compose ps -q $service)" | grep -q "healthy"; then
            green "$service is healthy"
            return 0
        fi
        echo "Waiting for $service to be healthy... ($((attempt + 1))/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    red "$service failed to become healthy"
    exit 1
}

# Task 4: Database Setup
setup_database() {
    blue "Running database migrations..."
    npm run db:deploy --workspace=backend
    
    blue "Seeding database with initial data..."
    npm run db:seed --workspace=backend
}

# Task 5: Health Checks
run_smoke_tests() {
    blue "Running smoke tests..."
    
    # Wait for backend to be ready
    sleep 5
    
    # Test health endpoint
    if curl -s -f "http://localhost:8000/health" | grep -q '"status":"healthy"'; then
        green "Backend health check passed"
    else
        red "Backend health check failed"
        exit 1
    fi
}
```

### Integration Points
```yaml
DOCKER_COMPOSE:
  - services: postgres, redis, pgweb, redis-commander
  - health_checks: Built-in PostgreSQL and Redis health checks
  - depends_on: pgweb depends on postgres:healthy, redis-commander depends on redis:healthy

ENVIRONMENT:
  - source: .env.example (template)
  - target: .env (generated)
  - secrets: JWT_SECRET, SESSION_SECRET (32-byte hex)
  - defaults: OLLAMA_BASE_URL, NODE_ENV=development

BACKEND_INTEGRATION:
  - migrations: npm run db:deploy --workspace=backend
  - seeding: npm run db:seed --workspace=backend
  - health: GET http://localhost:8000/health
  - validation: backend/src/utils/validateEnv.ts

DOCUMENTATION:
  - README.md: Add Quick Start section
  - docs/DEPLOYMENT.md: Add bootstrap script documentation
  - inline: Script comments and help text
```

## Validation Loop

### Level 1: Script Syntax & Execution
```bash
# Validate bash syntax
bash -n scripts/init.sh

# Check for common issues
shellcheck scripts/init.sh

# Make executable
chmod +x scripts/init.sh

# Expected: No syntax errors, shellcheck passes
```

### Level 2: Component Testing
```bash
# Test on fresh environment (no .env, no running containers)
rm -f .env
docker-compose down -v

# Run bootstrap script
./scripts/init.sh

# Verify outcomes step by step:
# 1. .env file created with generated secrets
test -f .env && grep -q "JWT_SECRET=" .env

# 2. Docker services running
docker ps | grep -q survai_postgres
docker ps | grep -q survai_redis

# 3. Health checks passing
curl -s http://localhost:8000/health | grep -q '"status":"healthy"'

# 4. Database migrated
npm run db:migrate --workspace=backend status

# Expected: All checks pass, services accessible
```

### Level 3: Integration Testing
```bash
# Full environment test
docker-compose down -v
rm -f .env
./scripts/init.sh

# Test development workflow
npm run dev

# Test backend API
curl -s http://localhost:8000/health

# Test frontend access
curl -s http://localhost:3000

# Test database connectivity
npm run db:studio --workspace=backend

# Expected: Complete development environment functional
```

### Level 4: Cross-Platform Testing
```bash
# Test on macOS
./scripts/init.sh

# Test on Ubuntu Linux
./scripts/init.sh

# Test error conditions
# - Docker not running
# - Port conflicts
# - Missing dependencies
# - Database connection failures

# Expected: Graceful error handling, informative messages
```

## Final Validation Checklist
- [ ] Script executes without errors: `./scripts/init.sh`
- [ ] All Docker services healthy: `docker ps`
- [ ] Environment configured: `cat .env | grep JWT_SECRET`
- [ ] Database migrated: `npm run db:migrate --workspace=backend status`
- [ ] Health endpoint accessible: `curl http://localhost:8000/health`
- [ ] README updated with quick-start: `git diff README.md`
- [ ] Cross-platform compatible: Test on macOS and Linux
- [ ] Error handling works: Test with Docker stopped
- [ ] Documentation accurate: Verify all commands work
- [ ] Cleanup function works: Test interruption handling

---

## Anti-Patterns to Avoid
- ❌ Don't use wait-for-it scripts when Docker health checks exist
- ❌ Don't hardcode secrets or use predictable patterns
- ❌ Don't ignore health check failures and proceed anyway
- ❌ Don't use Linux-specific commands that break on macOS
- ❌ Don't overwrite existing .env files without user confirmation
- ❌ Don't start services without checking for port conflicts
- ❌ Don't proceed with migrations if database isn't ready
- ❌ Don't skip validation of generated environment variables

## Success Confidence Score: 9/10

This PRP provides comprehensive context for one-pass implementation success:
- ✅ Complete codebase analysis with existing patterns
- ✅ External research on modern Docker health check patterns
- ✅ Detailed pseudocode with critical implementation details
- ✅ Progressive validation loop from syntax to integration
- ✅ Cross-platform considerations and error handling
- ✅ Documentation update requirements
- ✅ Anti-patterns and common pitfalls identified

The only uncertainty is cross-platform testing availability, but the implementation includes detection logic for different Docker Compose commands and portable bash patterns.