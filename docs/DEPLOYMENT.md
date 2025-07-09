# 🚀 SurvAI Deployment Guide

This guide covers deployment strategies for the SurvAI platform, from local development setup to production deployment.

## 📋 Table of Contents

- [🚀 Quick Development Setup](#-quick-development-setup)
- [🔧 Bootstrap Script](#-bootstrap-script)
- [🐳 Docker Configuration](#-docker-configuration)
- [⚙️ Environment Configuration](#-environment-configuration)
- [🗄️ Database Setup](#-database-setup)
- [🔍 Health Checks](#-health-checks)
- [🛠️ Manual Setup](#-manual-setup)
- [🔧 Troubleshooting](#-troubleshooting)
- [🌐 Production Deployment](#-production-deployment)

## 🚀 Quick Development Setup

### One-Command Bootstrap

The fastest way to get SurvAI running is with our automated bootstrap script:

```bash
git clone <repository-url>
cd SurvAI.3.0
./scripts/init.sh
```

### Prerequisites

- **Docker** and **Docker Compose** (required for services)
- **Node.js** 18.0.0 or higher
- **npm** 8.0.0 or higher
- **Git**
- **curl** (for health checks)

## 🔧 Bootstrap Script

The `scripts/init.sh` script provides a complete development environment setup with a single command.

### What the Bootstrap Script Does

1. **Prerequisites Validation**: Checks for Docker, Node.js, npm, and curl
2. **Port Availability**: Verifies required ports are available (5432, 6379, 8000, 8081, 8085)
3. **Environment Setup**: Copies `.env.example` to `.env` and generates secure secrets
4. **Docker Services**: Starts PostgreSQL, Redis, pgweb, and redis-commander
5. **Health Checks**: Waits for all services to be healthy
6. **Database Setup**: Runs Prisma migrations and seeds initial data
7. **Smoke Tests**: Validates backend API and database connectivity
8. **Summary**: Displays setup summary with all access URLs

### Bootstrap Script Options

```bash
# Standard setup
./scripts/init.sh

# Show help
./scripts/init.sh --help

# Force overwrite existing .env
./scripts/init.sh --force

# Enable verbose logging
./scripts/init.sh --verbose
```

### Bootstrap Script Features

- **Cross-Platform**: Works on macOS and Linux
- **Fail-Fast**: Stops on first error with helpful diagnostics
- **Idempotent**: Can be run multiple times safely
- **Colorized Output**: Easy-to-read status messages
- **Comprehensive Logging**: Detailed progress information
- **Error Recovery**: Helpful troubleshooting information

## 🐳 Docker Configuration

### Services

The `docker-compose.yml` defines the following services:

| Service | Port | Purpose | Health Check |
|---------|------|---------|--------------|
| **postgres** | 5432 | PostgreSQL database | `pg_isready` |
| **redis** | 6379 | Redis cache | `redis-cli ping` |
| **pgweb** | 8085 | Database management UI | HTTP check |
| **redis-commander** | 8081 | Redis management UI | HTTP check |
| **postgres_test** | 5433 | Test database | `pg_isready` |

### Service Dependencies

```yaml
pgweb:
  depends_on:
    postgres:
      condition: service_healthy

redis-commander:
  depends_on:
    redis:
      condition: service_healthy
```

### Docker Commands

```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View service logs
docker-compose logs [service-name]

# Stop all services
docker-compose down

# Remove volumes (clean reset)
docker-compose down -v
```

## ⚙️ Environment Configuration

### Environment Variables

The bootstrap script generates a `.env` file with the following key variables:

```bash
# Database
DATABASE_URL="postgresql://survai_user:survai_password@localhost:5432/survai_dev?schema=public"

# Cache
REDIS_URL="redis://localhost:6379"

# Application Ports
BACKEND_PORT=8000
FRONTEND_PORT=3000

# Security (auto-generated)
JWT_SECRET="<32-byte-hex-string>"
SESSION_SECRET="<32-byte-hex-string>"

# AI Integration
OLLAMA_BASE_URL="http://localhost:11434"
OPENAI_API_KEY="your_openai_api_key_here"

# Environment
NODE_ENV=development
```

### Secret Generation

The bootstrap script generates cryptographically secure secrets:

```bash
# JWT secret (256-bit)
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Session secret (256-bit)
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

### Environment File Handling

- **Backup**: Existing `.env` files are backed up before overwriting
- **Validation**: Generated secrets are validated for proper format
- **Cross-Platform**: Works on both macOS and Linux `sed` variations

## 🗄️ Database Setup

### Migration Process

The bootstrap script handles database setup automatically:

1. **Prisma Client Generation**: `npm run db:generate --workspace=backend`
2. **Migration Deployment**: `npm run db:deploy --workspace=backend`
3. **Database Seeding**: `npm run db:seed --workspace=backend`

### Database Schema

The database includes tables for:
- Users and authentication
- Surveys and questions
- Offers and tracking
- Analytics and metrics
- Widget configurations

### Seed Data

The seeding process creates:
- Sample survey with financial services theme
- Multiple offers with different payouts
- Questions with CTA buttons
- Initial analytics data

### Database Management

```bash
# Run migrations manually
npm run db:migrate --workspace=backend

# Seed database manually
npm run db:seed --workspace=backend

# Open Prisma Studio
npm run db:studio --workspace=backend

# Access pgweb UI
open http://localhost:8085
```

## 🔍 Health Checks

### Backend Health Endpoint

The bootstrap script validates the backend health endpoint:

```bash
# Health check URL
GET http://localhost:8000/health

# Expected response
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

### Service Health Checks

The bootstrap script waits for all services to be healthy:

```bash
# PostgreSQL health check
docker inspect --format='{{.State.Health.Status}}' survai_postgres

# Redis health check
docker inspect --format='{{.State.Health.Status}}' survai_redis

# Service status summary
docker-compose ps
```

## 🛠️ Manual Setup

If you prefer manual setup or need to troubleshoot:

### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Generate secure secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Edit .env with generated values
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
npm install

# Install backend dependencies specifically
npm install --workspace=backend
```

### 3. Start Services

```bash
# Start Docker services
docker-compose up -d

# Wait for services to be ready
docker-compose ps

# Check service health
docker inspect --format='{{.State.Health.Status}}' survai_postgres
docker inspect --format='{{.State.Health.Status}}' survai_redis
```

### 4. Database Setup

```bash
# Generate Prisma client
npm run db:generate --workspace=backend

# Run migrations
npm run db:deploy --workspace=backend

# Seed database
npm run db:seed --workspace=backend
```

### 5. Start Development

```bash
# Start development servers
npm run dev
```

## 🔧 Troubleshooting

### Common Issues

#### Port Conflicts

```bash
# Check port usage
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :8000  # Backend API
lsof -i :8081  # Redis Commander
lsof -i :8085  # pgweb

# Stop conflicting services
docker-compose down
```

#### Docker Issues

```bash
# Check Docker daemon
docker info

# Restart Docker services
docker-compose restart

# View service logs
docker-compose logs postgres
docker-compose logs redis
```

#### Database Connection

```bash
# Test database connection
docker exec -it survai_postgres psql -U survai_user -d survai_dev

# Check database logs
docker logs survai_postgres

# Reset database
npm run db:reset --workspace=backend
```

#### Permission Issues

```bash
# Make script executable
chmod +x scripts/init.sh

# Check script permissions
ls -la scripts/init.sh
```

### Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Docker not found" | Docker not installed | Install Docker |
| "Node.js version X found. Required: 18+" | Old Node.js version | Update Node.js |
| "Port already in use" | Port conflict | Stop conflicting services |
| "Database connection failed" | PostgreSQL not ready | Wait for health check |
| "Health endpoint test failed" | Backend not running | Check backend logs |

### Debugging Tools

```bash
# Verbose bootstrap output
./scripts/init.sh --verbose

# Check all service status
docker-compose ps

# View all logs
docker-compose logs

# Test health endpoint
curl -s http://localhost:8000/health | jq .

# Check environment variables
grep -E "(JWT_SECRET|SESSION_SECRET|DATABASE_URL)" .env
```

## 🌐 Production Deployment

### Environment Preparation

For production deployment, several additional considerations apply:

1. **Environment Variables**: Use production-grade secrets and configuration
2. **Database**: Use managed PostgreSQL service (AWS RDS, etc.)
3. **Cache**: Use managed Redis service (AWS ElastiCache, etc.)
4. **Load Balancing**: Configure load balancer for high availability
5. **SSL/TLS**: Enable HTTPS with proper certificates
6. **Monitoring**: Set up logging and monitoring systems

### Production Checklist

- [ ] Secure environment variables configured
- [ ] Database connection strings updated
- [ ] SSL certificates installed
- [ ] Load balancer configured
- [ ] Monitoring and logging enabled
- [ ] Backup systems in place
- [ ] Health checks configured
- [ ] Security scanning completed

### Additional Resources

- [AI Deployment Guide](AI_DEPLOYMENT_GUIDE.md) - OpenAI and Ollama configuration
- [Widget Production Deployment](WIDGET_PRODUCTION_DEPLOYMENT.md) - Widget deployment pipeline
- [EPC Comprehensive Guide](EPC_COMPREHENSIVE_GUIDE.md) - EPC system deployment

---

## 📞 Support

If you encounter issues with deployment:

1. Check the [Troubleshooting](#-troubleshooting) section above
2. Run `./scripts/init.sh --help` for script options
3. Use `./scripts/init.sh --verbose` for detailed logging
4. Check Docker service logs with `docker-compose logs`
5. Verify all prerequisites are installed and up to date

For additional support, refer to the main [README.md](../README.md) or create an issue in the project repository.