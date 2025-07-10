# 🔧 SurvAI Troubleshooting Guide

Complete troubleshooting guide for the SurvAI MVP development environment.

## 📋 Table of Contents

- [🚨 Critical Issues](#-critical-issues)
- [🔄 Complete Reset Procedures](#-complete-reset-procedures)
- [🐳 Docker Issues](#-docker-issues)
- [🗄️ Database Issues](#️-database-issues)
- [📦 Node.js & Dependencies](#-nodejs--dependencies)
- [🔧 Environment Configuration](#-environment-configuration)
- [🌐 Network & Port Issues](#-network--port-issues)
- [🔍 Health Check Failures](#-health-check-failures)
- [📝 Logs & Debugging](#-logs--debugging)
- [⚡ Performance Issues](#-performance-issues)

## 🚨 Critical Issues

### Backend "Network Error" or "ERR_CONNECTION_REFUSED"

**Most Common Cause:** Prisma client not generated properly

**Quick Fix:**
```bash
cd backend
npm run db:generate
cd ..
npm run dev
```

**Root Cause Analysis:**
1. The Prisma schema output path was misconfigured
2. Backend code tries to import from root node_modules instead of backend
3. Environment variables not loaded correctly

**Complete Fix:**
```bash
# 1. Stop all processes
pkill -f "tsx.*server.ts"
pkill -f "npm.*dev"

# 2. Regenerate Prisma client
cd backend
npm run db:generate

# 3. Check .env file format
cd ..
cat .env | head -10  # Look for malformed lines

# 4. Restart development servers
npm run dev
```

### Frontend Can't Connect to Backend

**Symptoms:**
- Health check failed: AxiosError
- Network Error in browser console
- ERR_CONNECTION_REFUSED

**Solution:**
```bash
# Check backend is actually running
curl http://localhost:8000/health

# If not running, check for port conflicts
lsof -i :8000

# Kill conflicting processes
kill $(lsof -ti:8000)

# Restart backend
npm run dev:backend
```

## 🔄 Complete Reset Procedures

### Nuclear Option: Complete Fresh Setup

When everything is broken and you need to start completely fresh:

```bash
# 1. Stop all processes
./scripts/init.sh --cleanup --force

# 2. Remove all containers and volumes
docker-compose down -v
docker system prune -af

# 3. Remove all node modules
rm -rf node_modules */node_modules
rm -rf backend/dist frontend/dist

# 4. Remove environment files
rm .env .env.backup

# 5. Fresh installation
./scripts/init.sh --force --cleanup --verbose

# 6. Start development servers
npm run dev
```

### Partial Reset: Keep Docker but Reset Code

```bash
# 1. Stop development servers only
pkill -f "npm.*dev"
pkill -f "tsx.*server"

# 2. Clean node modules
rm -rf node_modules */node_modules

# 3. Fresh install
npm install

# 4. Regenerate Prisma client
npm run db:generate --workspace=backend

# 5. Restart
npm run dev
```

## 🐳 Docker Issues

### Docker Services Won't Start

```bash
# Check Docker daemon
docker info

# If daemon not running
sudo systemctl start docker    # Linux
# or restart Docker Desktop     # Windows/Mac

# Clean up conflicting containers
docker-compose down -v
docker container prune -f
docker volume prune -f

# Restart services
docker-compose up -d
```

### Port Conflicts with Docker

```bash
# Find what's using required ports
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :8081  # Redis Commander
lsof -i :8085  # pgweb

# Kill conflicting processes
kill $(lsof -ti:5432)
kill $(lsof -ti:6379)

# Or change ports in docker-compose.yml
```

### Docker Compose Health Check Failures

```bash
# Check container logs
docker-compose logs postgres
docker-compose logs redis

# Check health status
docker-compose ps

# Restart unhealthy services
docker-compose restart postgres
docker-compose restart redis
```

## 🗄️ Database Issues

### Prisma Client Not Generated

**Error:** `@prisma/client did not initialize yet`

**Solution:**
```bash
# From project root
cd backend
npm run db:generate

# Verify client exists
ls -la node_modules/.prisma/client/

# If still failing, check schema output path
cat prisma/schema.prisma | grep output
```

### Database Migration Failures

```bash
# Reset database completely
docker-compose down -v
docker-compose up -d

# Wait for database to be ready
sleep 10

# Push schema (destructive)
npm run db:push --workspace=backend --accept-data-loss

# Regenerate client
npm run db:generate --workspace=backend

# Seed database
npm run db:seed --workspace=backend
```

### Database Connection Issues

```bash
# Test direct connection
docker exec -it survai_postgres psql -U survai_user -d survai_dev

# Check connection string
grep DATABASE_URL .env

# Verify PostgreSQL is accepting connections
docker-compose logs postgres | grep "ready to accept connections"
```

### Schema Sync Issues

```bash
# Check schema differences
npm run db:diff --workspace=backend

# Apply schema changes
npm run db:push --workspace=backend

# If migration files exist but aren't applied
npm run db:deploy --workspace=backend
```

## 📦 Node.js & Dependencies

### npm install Failures

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Fresh install
npm install

# Install workspace dependencies
npm install --workspaces
```

### TypeScript Compilation Errors

```bash
# Check TypeScript configuration
npm run type-check

# Build all packages in order
npm run build:shared
npm run build:backend
npm run build:frontend

# Check for circular dependencies
npx madge --circular --extensions ts,tsx src/
```

### Module Resolution Issues

```bash
# Check workspace configuration
npm ls --workspaces

# Verify shared types are built
ls -la shared/dist/

# Rebuild shared package
npm run build --workspace=shared
```

## 🔧 Environment Configuration

### .env File Issues

**Check for common problems:**
```bash
# Look for malformed lines
cat .env | grep -E "(=.*=|^[^#].*[^=]$)"

# Check for missing required variables
grep -E "(DATABASE_URL|JWT_SECRET|SESSION_SECRET)" .env

# Regenerate with secure secrets
rm .env
./scripts/init.sh --force
```

**Validate environment loading:**
```bash
# Test environment loading
node -e "
require('dotenv').config();
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Missing');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Missing');
console.log('BACKEND_PORT:', process.env.BACKEND_PORT);
"
```

### Secret Generation Issues

```bash
# Manual secret generation
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Update .env manually or regenerate
./scripts/init.sh --force
```

## 🌐 Network & Port Issues

### Port Already in Use

```bash
# Check what's using ports
lsof -i :3000  # Frontend
lsof -i :8000  # Backend
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# Kill specific processes
kill $(lsof -ti:8000)

# Or kill all Node.js processes (be careful!)
pkill -f node
```

### CORS Issues

**Symptoms:**
- Frontend can't connect to backend
- CORS errors in browser console

**Check CORS configuration:**
```bash
# Test CORS headers
curl -I -H "Origin: http://localhost:3000" http://localhost:8000/health

# Check backend CORS configuration
grep -r "cors" backend/src/
```

### Network Connectivity

```bash
# Test backend connectivity
curl http://localhost:8000/health

# Test with different origin
curl -H "Origin: http://localhost:3000" http://localhost:8000/health

# Check if services are binding to correct interfaces
netstat -tlnp | grep -E "(3000|8000|5432|6379)"
```

## 🔍 Health Check Failures

### Backend Health Check

```bash
# Manual health check
curl -v http://localhost:8000/health

# Check backend logs
npm run dev:backend 2>&1 | head -20

# Test database connectivity
node -e "
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect().then(() => console.log('DB OK')).catch(console.error);
"
```

### Frontend Health Check

```bash
# Check frontend is running
curl -I http://localhost:3000

# Check browser network tab for errors
# Look for failed API calls to backend

# Test direct API call from frontend network
# Should show CORS headers if configured correctly
```

## 📝 Logs & Debugging

### Backend Logs

```bash
# Real-time backend logs
npm run dev:backend

# Check exception logs
tail -f backend/logs/exceptions.log

# Docker container logs
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Frontend Logs

```bash
# Console logs in browser developer tools
# Network tab for failed requests
# Look for 404s, 500s, or CORS errors

# Vite build logs
npm run dev:frontend
```

### Docker Logs

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs postgres
docker-compose logs redis

# Follow logs
docker-compose logs -f postgres
```

### Debug Mode

```bash
# Enable verbose backend logging
DEBUG=survai:* npm run dev:backend

# Enable Prisma query logging
# In .env, ensure Prisma log level includes 'query'

# Enable verbose initialization
./scripts/init.sh --verbose
```

## ⚡ Performance Issues

### Slow Startup

```bash
# Check which step is slow
./scripts/init.sh --verbose

# Check Docker resource usage
docker stats

# Check database initialization time
time docker-compose up -d postgres
```

### High Memory Usage

```bash
# Check Node.js processes
ps aux | grep node

# Check Docker container usage
docker stats

# Monitor during development
top -p $(pgrep -f "node")
```

### Build Performance

```bash
# Check TypeScript compilation
time npm run type-check

# Check bundle sizes
npm run build
ls -lah dist/

# Profile webpack/vite build
npm run build -- --verbose
```

## 🛟 Emergency Recovery

### When Everything is Broken

1. **Stop everything:**
   ```bash
   pkill -f node
   docker-compose down -v
   ```

2. **Clean slate:**
   ```bash
   rm -rf node_modules */node_modules
   rm .env
   docker system prune -af
   ```

3. **Fresh start:**
   ```bash
   ./scripts/init.sh --force --cleanup --verbose
   ```

4. **Verify step by step:**
   ```bash
   # Check Docker services
   docker-compose ps
   
   # Check backend
   curl http://localhost:8000/health
   
   # Check frontend
   curl -I http://localhost:3000
   ```

### Getting Help

- **Check logs first:** Most issues show clear error messages
- **Use verbose mode:** `./scripts/init.sh --verbose`
- **Test individual components:** Don't assume the issue is where you think it is
- **Document your fix:** Add to this troubleshooting guide for others

---

**Remember:** The most common issue is Prisma client not being generated properly. When in doubt, run `npm run db:generate --workspace=backend` first.