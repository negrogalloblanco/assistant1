# JARVIS AI Security OS - Production Deployment Guide

**Deployment-ready architecture for scaling from MVP to enterprise**

---

## 🚀 PHASE 1: LOCAL DEVELOPMENT SETUP

### Prerequisites

```bash
# Node.js 18+
node --version

# Clone repo
git clone https://github.com/negrogalloblanco/assistant1.git
cd assistant1

# Install dependencies
npm install

# Install optional AI/reporting packages
npm install pdfkit axios socket.io shodan-client
```

### Environment Variables (`.env.local`)

```bash
# Frontend
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3002

# Backend
PORT=3001
WS_PORT=3002
NODE_ENV=development

# AI & APIs
CLAUDE_API_KEY=sk-ant-xxxxx
GEMINI_API_KEY=AIzaSyxxxxxx
SHODAN_API_KEY=your-shodan-key

# Database
MONGODB_URI=mongodb://localhost:27017/jarvis
DATABASE_URL=postgresql://localhost/jarvis

# Auth
JWT_SECRET=dev-secret-key-change-in-prod
STRIPE_SECRET_KEY=sk_test_xxxxx

# Security
CORS_ORIGIN=http://localhost:3000
```

### Run Locally

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend (if separate)
npm run server

# Terminal 3: WebSocket server
npm run ws-server
```

---

## 🐳 PHASE 2: DOCKER CONTAINERIZATION

### Backend Dockerfile

```dockerfile
# /Dockerfile.backend
FROM node:20-alpine

WORKDIR /app

# Install security essentials
RUN apk add --no-cache ufw dnsutils curl

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose ports
EXPOSE 3001 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Run app
CMD ["node", "index.js"]
```

### Frontend Dockerfile

```dockerfile
# /Dockerfile.frontend
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "3001:3001"
      - "3002:3002"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/jarvis
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/jarvis
    depends_on:
      - mongo
      - postgres
    networks:
      - jarvis-net
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - jarvis-net
    restart: unless-stopped

  mongo:
    image: mongo:7
    volumes:
      - mongo-data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=secure-password
    networks:
      - jarvis-net
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=jarvis
      - POSTGRES_PASSWORD=secure-password
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - jarvis-net
    restart: unless-stopped

volumes:
  mongo-data:
  postgres-data:

networks:
  jarvis-net:
    driver: bridge
```

### Build & Run

```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Scale backend instances
docker-compose up -d --scale backend=3
```

---

## ☁️ PHASE 3: AWS DEPLOYMENT

### Architecture

```
Internet → CloudFront (CDN)
           ↓
         ALB (Application Load Balancer)
           ↓
    ┌──────┴──────┐
    ↓             ↓
  ECS-1        ECS-2 (scaled)
    ↓             ↓
    └──────┬──────┘
           ↓
        RDS (PostgreSQL)
        ↓
    ElastiCache (Redis)
        ↓
    S3 (Reports storage)
```

### 1. Create ECR Repository

```bash
# Create repo for backend
aws ecr create-repository --repository-name jarvis-backend

# Get login token
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Tag and push image
docker build -t jarvis-backend .
docker tag jarvis-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/jarvis-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/jarvis-backend:latest
```

### 2. Create RDS Database

```bash
aws rds create-db-instance \
  --db-instance-identifier jarvis-postgres \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password <strong-password> \
  --allocated-storage 100 \
  --publicly-accessible false \
  --storage-encrypted \
  --backup-retention-period 7
```

### 3. Create ECS Cluster

```bash
# Create cluster
aws ecs create-cluster --cluster-name jarvis-prod

# Register task definition
aws ecs register-task-definition \
  --family jarvis-backend \
  --network-mode awsvpc \
  --requires-compatibilities FARGATE \
  --cpu "512" \
  --memory "1024" \
  --container-definitions '[
    {
      "name": "jarvis-backend",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/jarvis-backend:latest",
      "portMappings": [
        {"containerPort": 3001, "hostPort": 3001, "protocol": "tcp"},
        {"containerPort": 3002, "hostPort": 3002, "protocol": "tcp"}
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "DATABASE_URL", "value": "postgresql://..."}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/jarvis-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]'

# Create service
aws ecs create-service \
  --cluster jarvis-prod \
  --service-name jarvis-backend \
  --task-definition jarvis-backend \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx]}" \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=jarvis-backend,containerPort=3001
```

### 4. CloudFront Distribution

```bash
aws cloudfront create-distribution \
  --origin-domain-name <alb-dns-name> \
  --default-cache-behavior \
  TrustedSigners={Enabled=false,Quantity=0},\
  ViewerProtocolPolicy=redirect-to-https,\
  AllowedMethods={Quantity=7,Items=[GET,HEAD,OPTIONS,PUT,POST,PATCH,DELETE]},\
  CachePolicyId=658327ea-f89d-4fab-a63d-7e88639e58f6
```

---

## ▲ PHASE 4: VERCEL DEPLOYMENT (Frontend)

### Install Vercel CLI

```bash
npm install -g vercel
```

### Deploy

```bash
# Login to Vercel
vercel login

# Configure env
vercel env add REACT_APP_API_URL

# Deploy
vercel deploy --prod
```

### Vercel Configuration (vercel.json)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "REACT_APP_API_URL": "@api_url"
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {"key": "Cache-Control", "value": "no-cache"}
      ]
    }
  ]
}
```

---

## 🔒 PHASE 5: SECURITY HARDENING

### 1. WAF (Web Application Firewall)

```bash
# AWS WAF rules
aws wafv2 create-web-acl \
  --name jarvis-waf \
  --scope CLOUDFRONT \
  --default-action Block={} \
  --rules file://waf-rules.json
```

### 2. SSL/TLS Certificate

```bash
# Request ACM certificate
aws acm request-certificate \
  --domain-name jarvis.io \
  --subject-alternative-names "*.jarvis.io" \
  --validation-method DNS
```

### 3. Security Headers

```javascript
// Express middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
});
```

---

## 📊 PHASE 6: MONITORING & OBSERVABILITY

### CloudWatch Dashboards

```javascript
// Create custom metrics
const cloudwatch = new AWS.CloudWatch();

await cloudwatch.putMetricData({
  Namespace: 'JARVIS',
  MetricData: [
    {
      MetricName: 'ThreatsDetected',
      Value: threatCount,
      Unit: 'Count',
      Timestamp: new Date()
    }
  ]
}).promise();
```

### Structured Logging

```javascript
// Winston logger
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.CloudWatch({
      logGroupName: '/jarvis/api',
      logStreamName: 'prod'
    })
  ]
});

logger.info('Threat detected', {
  threatScore: 85,
  ip: '192.168.1.1',
  timestamp: new Date()
});
```

### Alerts

```bash
# CPU > 70% for 5 minutes
aws cloudwatch put-metric-alarm \
  --alarm-name high-cpu \
  --alarm-description "Alert when CPU exceeds 70%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 70 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:xxx:jarvis-alerts
```

---

## 💾 PHASE 7: BACKUP & DISASTER RECOVERY

### Database Backups

```bash
# RDS automated backups (7 days retention)
aws rds modify-db-instance \
  --db-instance-identifier jarvis-postgres \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00"
```

### Disaster Recovery

```bash
# Cross-region replica
aws rds create-db-instance-read-replica \
  --db-instance-identifier jarvis-postgres-replica \
  --source-db-instance-identifier jarvis-postgres \
  --region us-west-2
```

---

## 🔄 PHASE 8: CI/CD PIPELINE (GitHub Actions)

### `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -t jarvis-backend .
      
      - name: Push to ECR
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_URL
          docker tag jarvis-backend:latest $ECR_URL/jarvis-backend:latest
          docker push $ECR_URL/jarvis-backend:latest
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster jarvis-prod \
            --service jarvis-backend \
            --force-new-deployment
      
      - name: Deploy frontend to Vercel
        run: vercel deploy --prod --token $VERCEL_TOKEN
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

---

## 📈 PHASE 9: SCALING & AUTO-SCALING

### Auto-Scaling Policies

```bash
# Scale ECS tasks based on CPU
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/jarvis-prod/jarvis-backend \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10

aws application-autoscaling put-scaling-policy \
  --policy-name scale-on-cpu \
  --service-namespace ecs \
  --resource-id service/jarvis-prod/jarvis-backend \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    }
  }'
```

---

## ✅ DEPLOYMENT CHECKLIST

- [ ] Environment variables configured
- [ ] Database migrations completed
- [ ] SSL certificates installed
- [ ] WAF rules active
- [ ] Monitoring dashboards set up
- [ ] Backup policies configured
- [ ] CI/CD pipeline tested
- [ ] Load testing completed (1000+ RPS)
- [ ] Security audit passed
- [ ] Documentation complete
- [ ] Team trained on runbooks
- [ ] Incident response plan ready

---

## 🆘 TROUBLESHOOTING

### Issue: ECS tasks failing to start

```bash
# Check logs
aws logs get-log-events \
  --log-group-name /ecs/jarvis-backend \
  --log-stream-name <stream-name>

# Check task definition
aws ecs describe-task-definition --task-definition jarvis-backend
```

### Issue: Database connection timeout

```bash
# Verify security group allows traffic
aws ec2 describe-security-groups --group-ids sg-xxx

# Test connectivity
psql -h <rds-endpoint> -U admin -d jarvis
```

---

**Deployment Status: Ready for Production ✅**
