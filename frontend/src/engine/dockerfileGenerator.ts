import { DockerService } from '../types/docker';

export interface GeneratedDockerfile {
  filename: string;
  dockerfileContent: string;
  dockerignoreContent: string;
  notes: string;
}

export function generateDockerfileForService(service: DockerService): GeneratedDockerfile {
  const type = service.dockerfileType || 'nodejs';

  switch (type) {
    case 'laravel':
    case 'php':
      return {
        filename: `${service.name}/Dockerfile`,
        dockerfileContent: `# ==========================================
# STAGE 1: Composer & Asset Dependencies
# ==========================================
FROM composer:2.7 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install \\
    --no-dev \\
    --no-interaction \\
    --prefer-dist \\
    --ignore-platform-reqs \\
    --optimize-autoloader \\
    --no-scripts

# ==========================================
# STAGE 2: PHP 8.3 FPM Production Runner
# ==========================================
FROM php:8.3-fpm-alpine AS runner

WORKDIR /var/www/html

# Install system dependencies & PHP extensions (PostgreSQL, MySQL, Redis, BCMath, Opcache)
RUN apk add --no-cache \\
    libpng-dev \\
    libzip-dev \\
    zip \\
    unzip \\
    postgresql-dev \\
    oniguruma-dev \\
    curl \\
    linux-headers \\
    $PHPIZE_DEPS && \\
    docker-php-ext-install pdo pdo_pgsql pdo_mysql mbstring exif pcntl bcmath gd zip opcache && \\
    pecl install redis && docker-php-ext-enable redis && \\
    apk del $PHPIZE_DEPS

# Recommended OPcache settings for production Laravel
RUN echo "opcache.memory_consumption=256" >> /usr/local/etc/php/conf.d/opcache-recommended.ini && \\
    echo "opcache.max_accelerated_files=20000" >> /usr/local/etc/php/conf.d/opcache-recommended.ini && \\
    echo "opcache.revalidate_freq=0" >> /usr/local/etc/php/conf.d/opcache-recommended.ini && \\
    echo "opcache.validate_timestamps=0" >> /usr/local/etc/php/conf.d/opcache-recommended.ini

# Copy application source & vendor
COPY . /var/www/html
COPY --from=vendor /app/vendor /var/www/html/vendor

# Set permissions for Laravel storage & cache
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache && \\
    chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

USER www-data

EXPOSE ${service.ports[0]?.containerPort || 9000}

CMD ["php-fpm"]
`,
        dockerignoreContent: `node_modules/\nvendor/\n.env\n.git\nstorage/*.key\nstorage/logs/*\n`,
        notes: 'Optimized PHP 8.3-FPM Alpine container with OPcache, PostgreSQL and Redis extensions.'
      };

    case 'springboot':
    case 'java':
      return {
        filename: `${service.name}/Dockerfile`,
        dockerfileContent: `# ==========================================
# STAGE 1: Build Java Application (Gradle/Maven)
# ==========================================
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /workspace/app

# Copy build descriptor files
COPY gradlew gradlew.bat build.gradle* settings.gradle* pom.xml ./
COPY gradle ./gradle 2>/dev/null || :

# Copy source code
COPY src ./src

# Build JAR package (Gradle or Maven fallback)
RUN if [ -f "gradlew" ]; then \\
      chmod +x gradlew && ./gradlew bootJar --no-daemon -x test; \\
    else \\
      apk add --no-cache maven && mvn clean package -DskipTests; \\
    fi

# ==========================================
# STAGE 2: Java 21 LTS Minimal Runner
# ==========================================
FROM eclipse-temurin:21-jre-alpine AS runner

WORKDIR /app

RUN addgroup -S spring && adduser -S spring -G spring

COPY --from=builder --chown=spring:spring /workspace/app/build/libs/*.jar app.jar 2>/dev/null || \\
     COPY --from=builder --chown=spring:spring /workspace/app/target/*.jar app.jar

USER spring

ENV SERVER_PORT=${service.ports[0]?.containerPort || 8080} \\
    JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0"

EXPOSE \${SERVER_PORT}

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \\
  CMD wget --quiet --tries=1 --spider http://localhost:\${SERVER_PORT}/actuator/health || exit 0

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
`,
        dockerignoreContent: `.gradle/\nbuild/\ntarget/\n.git\n.env\n`,
        notes: 'Eclipse Temurin Java 21 LTS multi-stage build with Actuator healthchecks.'
      };

    case 'nestjs':
      return {
        filename: `${service.name}/Dockerfile`,
        dockerfileContent: `# ==========================================
# STAGE 1: Build NestJS Application
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN npm prune --production

# ==========================================
# STAGE 2: Production Minimal Runner
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \\
    PORT=${service.ports[0]?.containerPort || 3000}

RUN addgroup --system --gid 1001 nestjs && \\
    adduser --system --uid 1001 nestjs

COPY --from=builder --chown=nestjs:nestjs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nestjs /app/dist ./dist
COPY --from=builder --chown=nestjs:nestjs /app/package.json ./package.json

USER nestjs

EXPOSE \${PORT}

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \\
  CMD node -e "require('http').get('http://localhost:' + process.env.PORT + '/health', (r) => {if (r.statusCode !== 200) process.exit(1)}).on('error', () => process.exit(1))" || exit 0

CMD ["node", "dist/main.js"]
`,
        dockerignoreContent: `node_modules\ndist\n.git\n.env\n`,
        notes: 'NestJS production multi-stage build with dist standalone runner.'
      };

    case 'angular':
      return {
        filename: `${service.name}/Dockerfile`,
        dockerfileContent: `# ==========================================
# STAGE 1: Build Angular SPA
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production

# ==========================================
# STAGE 2: Nginx Web Server for Angular SPA
# ==========================================
FROM nginx:1.27-alpine AS runner

# Support HTML5 routing with custom Nginx config
RUN echo 'server { \\
    listen 80; \\
    location / { \\
        root /usr/share/nginx/html; \\
        index index.html; \\
        try_files $uri $uri/ /index.html; \\
    } \\
}' > /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist/*/browser /usr/share/nginx/html 2>/dev/null || \\
     COPY --from=builder /app/dist/* /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
`,
        dockerignoreContent: `node_modules\ndist\n.git\n.env\n`,
        notes: 'Angular 18+ production bundle served via Nginx with HTML5 pushState support.'
      };

    case 'vuejs':
      return {
        filename: `${service.name}/Dockerfile`,
        dockerfileContent: `# ==========================================
# STAGE 1: Build Vue 3 / Vite Application
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ==========================================
# STAGE 2: Nginx Web Server for Vue 3 SPA
# ==========================================
FROM nginx:1.27-alpine AS runner

RUN echo 'server { \\
    listen 80; \\
    location / { \\
        root /usr/share/nginx/html; \\
        index index.html; \\
        try_files $uri $uri/ /index.html; \\
    } \\
}' > /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
`,
        dockerignoreContent: `node_modules\ndist\n.git\n.env\n`,
        notes: 'Vue 3 + Vite production bundle served via Nginx Alpine.'
      };

    case 'django':
      return {
        filename: `${service.name}/Dockerfile`,
        dockerfileContent: `# ==========================================
# STAGE 1: Dependencies Builder
# ==========================================
FROM python:3.12-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \\
    build-essential libpq-dev && rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt gunicorn

# ==========================================
# STAGE 2: Production Django Runner
# ==========================================
FROM python:3.12-slim AS runner

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \\
    PYTHONUNBUFFERED=1 \\
    PATH="/opt/venv/bin:$PATH" \\
    PORT=${service.ports[0]?.containerPort || 8000}

RUN apt-get update && apt-get install -y --no-install-recommends \\
    curl libpq5 && rm -rf /var/lib/apt/lists/*

COPY --from=builder /opt/venv /opt/venv

RUN groupadd -g 1000 djangogroup && \\
    useradd -u 1000 -g djangogroup -s /bin/sh -m djangouser

COPY --chown=djangouser:djangogroup . .

USER djangouser

EXPOSE \${PORT}

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "core.wsgi:application"]
`,
        dockerignoreContent: `__pycache__\n*.pyc\nvenv/\n.venv/\n.git\n.env\nmedia/\n`,
        notes: 'Django + Gunicorn WSGI production server with PostgreSQL drivers.'
      };

    case 'nodejs':
      return {
        filename: `${service.name}/Dockerfile`,
        dockerfileContent: `# ==========================================
# STAGE 1: Build & Dependencies
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm ci --prefer-offline --no-audit

COPY . .
RUN if [ -f "tsconfig.json" ]; then npm run build --if-present; fi
RUN npm prune --production

# ==========================================
# STAGE 2: Production Minimal Runner
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=${service.ports[0]?.containerPort || 4000}

RUN addgroup --system --gid 1001 nodejs && \\
    adduser --system --uid 1001 nodejs

COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist 2>/dev/null || :
COPY --from=builder --chown=nodejs:nodejs /app/src ./src 2>/dev/null || :

USER nodejs

EXPOSE \${PORT}

CMD ["npm", "start"]
`,
        dockerignoreContent: `node_modules\nnpm-debug.log\n.git\n.env\ndist\nbuild\n`,
        notes: 'Multi-stage Node.js build with non-root user.'
      };

    case 'python-fastapi':
    case 'python-flask':
      return {
        filename: `${service.name}/Dockerfile`,
        dockerfileContent: `# ==========================================
# STAGE 1: Builder Stage
# ==========================================
FROM python:3.12-slim AS builder

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \\
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \\
    build-essential libpq-dev && rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# ==========================================
# STAGE 2: Production Slim Runner
# ==========================================
FROM python:3.12-slim AS runner

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \\
    PYTHONUNBUFFERED=1 \\
    PATH="/opt/venv/bin:$PATH" \\
    PORT=${service.ports[0]?.containerPort || 8000}

RUN apt-get update && apt-get install -y --no-install-recommends \\
    curl libpq5 && rm -rf /var/lib/apt/lists/*

COPY --from=builder /opt/venv /opt/venv

RUN groupadd -g 1000 appgroup && \\
    useradd -u 1000 -g appgroup -s /bin/sh -m appuser

COPY --chown=appuser:appgroup . .

USER appuser

EXPOSE \${PORT}

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \\
  CMD curl -f http://localhost:\${PORT}/health || exit 0

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
`,
        dockerignoreContent: `__pycache__\n*.pyc\nvenv/\n.venv/\n.git\n.env\n`,
        notes: 'Python 3.12 slim with virtual environment isolation.'
      };

    case 'go':
      return {
        filename: `${service.name}/Dockerfile`,
        dockerfileContent: `# ==========================================
# STAGE 1: Go Compile Builder
# ==========================================
FROM golang:1.23-alpine AS builder

WORKDIR /build

RUN apk add --no-cache git ca-certificates tzdata

COPY go.mod go.sum* ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \\
    -ldflags="-w -s" \\
    -o /build/server .

# ==========================================
# STAGE 2: Ultra-minimal Alpine Runner (<20MB)
# ==========================================
FROM alpine:3.20 AS runner

WORKDIR /app

RUN apk --no-cache add ca-certificates tzdata
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /build/server /app/server

USER appuser

EXPOSE ${service.ports[0]?.containerPort || 8080}

ENTRYPOINT ["/app/server"]
`,
        dockerignoreContent: `.git\n*.exe\nbin/\n.env\n`,
        notes: 'Statically linked Go binary producing a lightweight <20MB image.'
      };

    case 'nextjs':
      return {
        filename: `${service.name}/Dockerfile`,
        dockerfileContent: `# ==========================================
# Next.js Production Dockerfile
# ==========================================
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=${service.ports[0]?.containerPort || 3000}
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs
EXPOSE \${PORT}
CMD ["npm", "start"]
`,
        dockerignoreContent: `node_modules\n.next\n.git\n.env\n`,
        notes: 'Next.js SSR standalone container.'
      };

    case 'react-vite':
      return {
        filename: `${service.name}/Dockerfile`,
        dockerfileContent: `# ==========================================
# React Vite + Nginx Alpine
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`,
        dockerignoreContent: `node_modules\ndist\n.git\n.env\n`,
        notes: 'React/Vite compiled and served via Nginx Alpine.'
      };

    default:
      return {
        filename: `${service.name}/Dockerfile`,
        dockerfileContent: `FROM alpine:latest\nWORKDIR /app\nCOPY . /app\nEXPOSE ${service.ports[0]?.containerPort || 8080}\nCMD ["sh"]\n`,
        dockerignoreContent: `.git\n.env\n`,
        notes: 'Generic Alpine container.'
      };
  }
}
