# AI Integration Service Deployment Guide

## Overview

This guide covers the deployment and operational aspects of the AI Integration Service in production environments. It includes provider setup, configuration management, monitoring, and troubleshooting procedures.

## Prerequisites

### System Requirements
- Node.js 18+ with npm/yarn
- PostgreSQL 14+ (for application data)
- Redis (optional, for caching)
- Docker (optional, for containerized deployment)

### Network Requirements
- Outbound HTTPS access to OpenAI API (api.openai.com)
- Local network access to Ollama server (if using Ollama)
- Inbound access on application port (default: 8000)

## Provider Setup

### OpenAI Production Setup

#### 1. API Key Management
```bash
# Production environment variables
OPENAI_API_KEY=sk-prod-your-production-key-here
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=1000
```

#### 2. Rate Limiting Configuration
OpenAI has different rate limits based on your subscription:
- **Free Tier**: 3 requests/minute
- **Pay-as-you-go**: 3,500 requests/minute (gpt-4)
- **Enterprise**: Custom limits

#### 3. Cost Optimization
```bash
# Use cheaper models for development
OPENAI_MODEL=gpt-3.5-turbo  # Development
OPENAI_MODEL=gpt-4          # Production

# Optimize token usage
OPENAI_MAX_TOKENS=500       # Reduced for cost savings
```

### Ollama Production Setup

#### 1. Server Installation
```bash
# Install Ollama on Ubuntu/Debian
curl -fsSL https://ollama.com/install.sh | sh

# Start Ollama service
sudo systemctl enable ollama
sudo systemctl start ollama
```

#### 2. Model Management
```bash
# Pull recommended models
ollama pull llama2          # General purpose
ollama pull codellama       # Code-focused
ollama pull mistral         # Lightweight alternative

# List available models
ollama list
```

#### 3. Configuration
```bash
# Production Ollama configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2

# For Docker deployment
OLLAMA_BASE_URL=http://ollama:11434
```

#### 4. Hardware Requirements
- **Minimum**: 8GB RAM, 4 CPU cores
- **Recommended**: 16GB RAM, 8 CPU cores
- **Optimal**: 32GB RAM, 16 CPU cores, GPU support

## Environment Configuration

### Production Environment Variables

```bash
# AI Integration Service Configuration
NODE_ENV=production

# OpenAI Configuration
OPENAI_API_KEY=sk-prod-your-key-here
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=1000

# Ollama Configuration  
OLLAMA_BASE_URL=http://ollama-server:11434
OLLAMA_MODEL=llama2

# Database Configuration
DATABASE_URL=postgresql://user:password@postgres:5432/survai_prod

# Logging Configuration
LOG_LEVEL=info

# Security Configuration
JWT_SECRET=your-production-jwt-secret-here
CORS_ORIGINS=https://your-domain.com,https://app.your-domain.com
```

### Configuration Validation

The service validates configuration on startup:

```typescript
// Environment validation includes:
- OPENAI_API_KEY (optional but recommended)
- OLLAMA_BASE_URL (optional, defaults to localhost:11434)
- Database connectivity
- JWT secret for production
```

## Deployment Options

### Option 1: Traditional Server Deployment

#### 1. Server Setup
```bash
# Install Node.js and dependencies
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and build application
git clone <repository-url>
cd survai
npm install
npm run build
```

#### 2. Process Management
```bash
# Using PM2 for process management
npm install -g pm2

# Start application
pm2 start npm --name "survai-backend" -- run start:prod
pm2 start npm --name "survai-frontend" -- run start:prod

# Configure PM2 startup
pm2 startup
pm2 save
```

### Option 2: Docker Deployment

#### 1. Docker Compose Configuration
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  backend:
    build: 
      context: .
      dockerfile: backend/Dockerfile
    environment:
      - NODE_ENV=production
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - OLLAMA_BASE_URL=http://ollama:11434
      - DATABASE_URL=postgresql://survai:password@postgres:5432/survai_prod
    depends_on:
      - postgres
      - ollama
    ports:
      - "8000:8000"

  ollama:
    image: ollama/ollama:latest
    volumes:
      - ollama_data:/root/.ollama
    environment:
      - OLLAMA_HOST=0.0.0.0
    ports:
      - "11434:11434"

  postgres:
    image: postgres:14
    environment:
      - POSTGRES_DB=survai_prod
      - POSTGRES_USER=survai
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  ollama_data:
  postgres_data:
```

#### 2. Deployment Commands
```bash
# Deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Initialize Ollama models
docker exec -it survai_ollama_1 ollama pull llama2

# Check service health
docker-compose ps
```

### Option 3: Kubernetes Deployment

#### 1. Kubernetes Manifests
```yaml
# k8s/ai-service-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: survai-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: survai-backend
  template:
    metadata:
      labels:
        app: survai-backend
    spec:
      containers:
      - name: backend
        image: survai/backend:latest
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: ai-secrets
              key: openai-api-key
        - name: OLLAMA_BASE_URL
          value: "http://ollama-service:11434"
        ports:
        - containerPort: 8000
```

#### 2. Secrets Management
```bash
# Create secrets
kubectl create secret generic ai-secrets \
  --from-literal=openai-api-key=sk-your-key-here \
  --from-literal=jwt-secret=your-jwt-secret

# Apply deployments
kubectl apply -f k8s/
```

## Monitoring and Observability

### Health Checks

The service provides health check endpoints:

```typescript
// Health check endpoints
GET /health           - Basic health check
GET /health/ai        - AI service health
GET /health/providers - Provider status
```

### Metrics Collection

#### Application Metrics
```typescript
// Built-in metrics from aiService.getMetrics()
{
  "openai": {
    "requestCount": 1500,
    "successCount": 1450,
    "errorCount": 50,
    "avgResponseTime": 850,
    "lastUsed": "2024-01-08T10:30:00Z"
  },
  "ollama": {
    "requestCount": 200,
    "successCount": 195,
    "errorCount": 5,
    "avgResponseTime": 1200,
    "lastUsed": "2024-01-08T10:25:00Z"
  }
}
```

#### Prometheus Integration
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'survai-backend'
    static_configs:
      - targets: ['survai-backend:8000']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

### Logging Configuration

#### Structured Logging
```typescript
// Production logging configuration
{
  "level": "info",
  "format": "json",
  "timestamp": true,
  "fields": {
    "service": "survai-ai-service",
    "version": "1.0.0",
    "environment": "production"
  }
}
```

#### Log Aggregation
```bash
# Using ELK Stack
# Logstash configuration for AI service logs
input {
  beats {
    port => 5044
  }
}

filter {
  if [service] == "survai-ai-service" {
    json {
      source => "message"
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "survai-ai-logs-%{+YYYY.MM.dd}"
  }
}
```

## Security Considerations

### API Key Security
```bash
# Never log API keys
export OPENAI_API_KEY=sk-your-key-here

# Use secrets management
# AWS Secrets Manager
aws secretsmanager get-secret-value --secret-id openai-api-key

# HashiCorp Vault
vault kv get secret/openai-api-key
```

### Network Security
```bash
# Firewall configuration
# Allow only necessary ports
ufw allow 8000/tcp          # Application port
ufw allow 11434/tcp         # Ollama (internal only)
ufw deny 11434/tcp --from any --to any  # Block external access
```

### Content Security
```typescript
// Content sanitization is automatic
// Additional security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});
```

## Performance Optimization

### Caching Strategy
```typescript
// Redis caching for similar contexts
const cacheKey = `ai-question:${JSON.stringify(context)}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const result = await aiService.generateQuestion(context);
await redis.setex(cacheKey, 3600, JSON.stringify(result)); // 1 hour cache
```

### Connection Pooling
```typescript
// HTTP connection pooling for better performance
const agent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
  timeout: 30000
});
```

### Load Balancing
```nginx
# Nginx load balancer configuration
upstream survai_backend {
    server backend1:8000;
    server backend2:8000;
    server backend3:8000;
}

server {
    location /api/ {
        proxy_pass http://survai_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Backup and Recovery

### Data Backup
```bash
# Database backup
pg_dump survai_prod > survai_backup_$(date +%Y%m%d).sql

# Ollama models backup
tar -czf ollama_models_backup.tar.gz ~/.ollama/models/
```

### Disaster Recovery
```bash
# Database restoration
psql survai_prod < survai_backup_20240108.sql

# Ollama models restoration
tar -xzf ollama_models_backup.tar.gz -C ~/.ollama/
ollama serve
```

## Scaling Considerations

### Horizontal Scaling
```yaml
# Kubernetes HPA configuration
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: survai-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: survai-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Vertical Scaling
```yaml
# Resource limits and requests
resources:
  limits:
    cpu: 2000m
    memory: 4Gi
  requests:
    cpu: 1000m
    memory: 2Gi
```

## Troubleshooting

### Common Issues

#### 1. OpenAI Rate Limits
```bash
# Symptoms: HTTP 429 errors
# Solution: Implement exponential backoff

# Check rate limit headers
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models
```

#### 2. Ollama Connection Issues
```bash
# Check Ollama service status
systemctl status ollama

# Test connectivity
curl http://localhost:11434/api/version

# Check model availability
ollama list
```

#### 3. Memory Issues
```bash
# Monitor memory usage
docker stats
top -p $(pgrep node)

# Check for memory leaks
node --inspect app.js
```

### Debug Procedures

#### 1. Enable Debug Logging
```bash
LOG_LEVEL=debug npm start
```

#### 2. Test Provider Connectivity
```bash
# Test OpenAI
curl -X POST https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4", "messages": [{"role": "user", "content": "test"}]}'

# Test Ollama
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model": "llama2", "prompt": "test"}'
```

#### 3. Health Check Validation
```bash
# Check service health
curl http://localhost:8000/health/ai

# Expected response
{
  "status": "healthy",
  "providers": {
    "openai": "available",
    "ollama": "available"
  },
  "timestamp": "2024-01-08T10:30:00Z"
}
```

## Support and Maintenance

### Regular Maintenance Tasks
1. **Monthly**: Review and optimize provider usage patterns
2. **Weekly**: Check error rates and performance metrics
3. **Daily**: Monitor system health and resource usage

### Version Updates
```bash
# Update dependencies
npm audit fix
npm update

# Update Ollama models
ollama pull llama2:latest
```

### Contact Information
For production issues or questions:
- Create GitHub issue with deployment details
- Include logs and error messages
- Specify environment and configuration details

This deployment guide ensures reliable, secure, and scalable operation of the AI Integration Service in production environments.