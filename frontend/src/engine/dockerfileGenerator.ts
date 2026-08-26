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
    adduser --system --uid 1001 nodejs user

COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist 2>/dev/null || :
COPY --from=builder --chown=nodejs:nodejs /app/src ./src 2>/dev/null || :

USER nodejs

EXPOSE \${PORT}

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \\
  CMD node -e "require('http').get('http://localhost:' + process.env.PORT + '/health', (r) => {if (r.statusCode !== 200) process.exit(1)}).on('error', () => process.exit(1))" || exit 0

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
