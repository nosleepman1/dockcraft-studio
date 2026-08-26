import { DockerService } from '../types/docker';

export interface CatalogItem extends Omit<DockerService, 'id'> {
  catalogId: string;
}

export const SERVICE_CATALOG: CatalogItem[] = [
  // ==================== DATABASES ====================
  {
    catalogId: 'postgres',
    name: 'postgres',
    displayName: 'PostgreSQL',
    category: 'database',
    image: 'postgres',
    tag: '16-alpine',
    icon: 'Database',
    color: '#336791',
    description: 'Powerful, open source object-relational database system',
    isCustomBuild: false,
    ports: [{ id: 'p1', hostPort: 5432, containerPort: 5432, protocol: 'tcp', description: 'Postgres DB Port' }],
    expose: [5432],
    networks: ['app-network'],
    env: [
      { id: 'e1', key: 'POSTGRES_DB', value: 'app_db', description: 'Default database name' },
      { id: 'e2', key: 'POSTGRES_USER', value: 'postgres', description: 'Admin username' },
      { id: 'e3', key: 'POSTGRES_PASSWORD', value: 'postgres_secure_pass_123', isSecret: true, description: 'Superuser password' },
      { id: 'e4', key: 'PGDATA', value: '/var/lib/postgresql/data/pgdata', description: 'Data directory' }
    ],
    volumes: [
      { id: 'v1', hostPath: 'postgres_data', containerPath: '/var/lib/postgresql/data', type: 'volume', description: 'Persistent database storage' }
    ],
    healthCheck: {
      enabled: true,
      test: 'pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB',
      interval: '10s',
      timeout: '5s',
      retries: 5,
      startPeriod: '10s'
    },
    dependsOn: [],
    restart: 'unless-stopped',
  },
  {
    catalogId: 'mysql',
    name: 'mysql',
    displayName: 'MySQL',
    category: 'database',
    image: 'mysql',
    tag: '8.4',
    icon: 'Database',
    color: '#00758F',
    description: 'Fast, reliable and widely used relational database management system',
    isCustomBuild: false,
    ports: [{ id: 'p1', hostPort: 3306, containerPort: 3306, protocol: 'tcp' }],
    expose: [3306],
    networks: ['app-network'],
    env: [
      { id: 'e1', key: 'MYSQL_DATABASE', value: 'app_db' },
      { id: 'e2', key: 'MYSQL_USER', value: 'app_user' },
      { id: 'e3', key: 'MYSQL_PASSWORD', value: 'app_pass_secret', isSecret: true },
      { id: 'e4', key: 'MYSQL_ROOT_PASSWORD', value: 'root_pass_secret', isSecret: true }
    ],
    volumes: [
      { id: 'v1', hostPath: 'mysql_data', containerPath: '/var/lib/mysql', type: 'volume' }
    ],
    healthCheck: {
      enabled: true,
      test: 'mysqladmin ping -h 127.0.0.1 -u $$MYSQL_USER --password=$$MYSQL_PASSWORD',
      interval: '10s',
      timeout: '5s',
      retries: 5,
      startPeriod: '20s'
    },
    dependsOn: [],
    restart: 'unless-stopped',
  },
  {
    catalogId: 'mongodb',
    name: 'mongodb',
    displayName: 'MongoDB',
    category: 'database',
    image: 'mongo',
    tag: '7.0',
    icon: 'Leaf',
    color: '#13AA52',
    description: 'Leading document-based NoSQL database designed for modern apps',
    isCustomBuild: false,
    ports: [{ id: 'p1', hostPort: 27017, containerPort: 27017, protocol: 'tcp' }],
    expose: [27017],
    networks: ['app-network'],
    env: [
      { id: 'e1', key: 'MONGO_INITDB_ROOT_USERNAME', value: 'admin' },
      { id: 'e2', key: 'MONGO_INITDB_ROOT_PASSWORD', value: 'admin_secret_pass', isSecret: true },
      { id: 'e3', key: 'MONGO_INITDB_DATABASE', value: 'app_db' }
    ],
    volumes: [
      { id: 'v1', hostPath: 'mongo_data', containerPath: '/data/db', type: 'volume' }
    ],
    healthCheck: {
      enabled: true,
      test: 'mongosh --eval "db.adminCommand(\'ping\')"',
      interval: '10s',
      timeout: '5s',
      retries: 5,
      startPeriod: '15s'
    },
    dependsOn: [],
    restart: 'unless-stopped',
  },
  {
    catalogId: 'redis',
    name: 'redis',
    displayName: 'Redis',
    category: 'database',
    image: 'redis',
    tag: '7.2-alpine',
    icon: 'Layers',
    color: '#DC382D',
    description: 'In-memory data structure store used as a database, cache, and message broker',
    isCustomBuild: false,
    ports: [{ id: 'p1', hostPort: 6379, containerPort: 6379, protocol: 'tcp' }],
    expose: [6379],
    networks: ['app-network'],
    env: [],
    command: 'redis-server --save 60 1 --loglevel warning --requirepass redis_secure_pass',
    volumes: [
      { id: 'v1', hostPath: 'redis_data', containerPath: '/data', type: 'volume' }
    ],
    healthCheck: {
      enabled: true,
      test: 'redis-cli -a redis_secure_pass ping',
      interval: '5s',
      timeout: '3s',
      retries: 5
    },
    dependsOn: [],
    restart: 'unless-stopped',
  },
  {
    catalogId: 'clickhouse',
    name: 'clickhouse',
    displayName: 'ClickHouse',
    category: 'database',
    image: 'clickhouse/clickhouse-server',
    tag: '24-alpine',
    icon: 'BarChart3',
    color: '#FFCC01',
    description: 'Fast open-source column-oriented DBMS for real-time analytical reporting',
    isCustomBuild: false,
    ports: [
      { id: 'p1', hostPort: 8123, containerPort: 8123, protocol: 'tcp', description: 'HTTP Interface' },
      { id: 'p2', hostPort: 9000, containerPort: 9000, protocol: 'tcp', description: 'Native Client' }
    ],
    expose: [8123, 9000],
    networks: ['app-network'],
    env: [
      { id: 'e1', key: 'CLICKHOUSE_DB', value: 'analytics' },
      { id: 'e2', key: 'CLICKHOUSE_USER', value: 'default' },
      { id: 'e3', key: 'CLICKHOUSE_PASSWORD', value: 'clickhouse_pass_123', isSecret: true }
    ],
    volumes: [
      { id: 'v1', hostPath: 'clickhouse_data', containerPath: '/var/lib/clickhouse', type: 'volume' }
    ],
    dependsOn: [],
    restart: 'unless-stopped',
  },

  // ==================== BACKENDS & APIS ====================
  {
    catalogId: 'node-backend',
    name: 'api_node',
    displayName: 'Node.js / Express API',
    category: 'backend',
    icon: 'Server',
    color: '#68A063',
    description: 'Fast, lightweight JavaScript/TypeScript backend server with multi-stage build',
    isCustomBuild: true,
    buildContext: './backend',
    dockerfilePath: './backend/Dockerfile',
    dockerfileType: 'nodejs',
    ports: [{ id: 'p1', hostPort: 4000, containerPort: 4000, protocol: 'tcp' }],
    expose: [4000],
    networks: ['app-network'],
    env: [
      { id: 'e1', key: 'NODE_ENV', value: 'production' },
      { id: 'e2', key: 'PORT', value: '4000' },
      { id: 'e3', key: 'JWT_SECRET', value: 'super_secret_jwt_key_98765', isSecret: true }
    ],
    volumes: [
      { id: 'v1', hostPath: './backend/src', containerPath: '/app/src', type: 'bind', description: 'Hot-reload mount in dev' }
    ],
    dependsOn: [],
    restart: 'unless-stopped',
  },
  {
    catalogId: 'python-fastapi',
    name: 'api_fastapi',
    displayName: 'Python FastAPI',
    category: 'backend',
    icon: 'Zap',
    color: '#009688',
    description: 'High performance async Python web framework with OpenAPI documentation',
    isCustomBuild: true,
    buildContext: './backend',
    dockerfilePath: './backend/Dockerfile',
    dockerfileType: 'python-fastapi',
    ports: [{ id: 'p1', hostPort: 8000, containerPort: 8000, protocol: 'tcp' }],
    expose: [8000],
    networks: ['app-network'],
    env: [
      { id: 'e1', key: 'ENVIRONMENT', value: 'production' },
      { id: 'e2', key: 'PORT', value: '8000' },
      { id: 'e3', key: 'SECRET_KEY', value: 'fastapi_ultra_secure_secret_token_123', isSecret: true }
    ],
    volumes: [
      { id: 'v1', hostPath: './backend/app', containerPath: '/app/app', type: 'bind' }
    ],
    dependsOn: [],
    restart: 'unless-stopped',
  },
  {
    catalogId: 'go-gin',
    name: 'api_go',
    displayName: 'Go Gin REST Service',
    category: 'backend',
    icon: 'Cpu',
    color: '#00ADD8',
    description: 'Ultra-fast, statically compiled Go microservice with tiny Alpine image',
    isCustomBuild: true,
    buildContext: './backend',
    dockerfilePath: './backend/Dockerfile',
    dockerfileType: 'go',
    ports: [{ id: 'p1', hostPort: 8080, containerPort: 8080, protocol: 'tcp' }],
    expose: [8080],
    networks: ['app-network'],
    env: [
      { id: 'e1', key: 'GIN_MODE', value: 'release' },
      { id: 'e2', key: 'PORT', value: '8080' }
    ],
    volumes: [],
    dependsOn: [],
    restart: 'unless-stopped',
  },
  {
    catalogId: 'rust-axum',
    name: 'api_rust',
    displayName: 'Rust Axum API',
    category: 'backend',
    icon: 'Shield',
    color: '#DEA584',
    description: 'Blazing fast, memory-safe Rust API microservice with distroless build',
    isCustomBuild: true,
    buildContext: './backend',
    dockerfilePath: './backend/Dockerfile',
    dockerfileType: 'rust',
    ports: [{ id: 'p1', hostPort: 3001, containerPort: 3001, protocol: 'tcp' }],
    expose: [3001],
    networks: ['app-network'],
    env: [
      { id: 'e1', key: 'RUST_LOG', value: 'info' },
      { id: 'e2', key: 'SERVER_PORT', value: '3001' }
    ],
    volumes: [],
    dependsOn: [],
    restart: 'unless-stopped',
  },

  {
    catalogId: 'laravel',
    name: 'api_laravel',
    displayName: 'Laravel 11 (PHP 8.3)',
    category: 'backend',
    icon: 'Flame',
    color: '#FF2D20',
    description: 'The PHP Framework for Web Artisans with OPcache and Redis extension',
    isCustomBuild: true,
    buildContext: './backend',
    dockerfilePath: './backend/Dockerfile',
    dockerfileType: 'laravel',
    ports: [{ id: 'p1', hostPort: 9000, containerPort: 9000, protocol: 'tcp' }],
    expose: [9000],
    networks: ['app-network'],
    env: [
      { id: 'e1', key: 'APP_ENV', value: 'production' },
      { id: 'e2', key: 'APP_KEY', value: 'base64:s9rY8QxW5T2FvN9mP8kL7jH6gF5dE4cA3bZ2yX1wV0=', isSecret: true },
      { id: 'e3', key: 'APP_DEBUG', value: 'false' },
      { id: 'e4', key: 'DB_CONNECTION', value: 'pgsql' }
    ],
    volumes: [
      { id: 'v1', hostPath: './backend/storage', containerPath: '/var/www/html/storage', type: 'bind' }
    ],
    dependsOn: [],
    restart: 'unless-stopped',
  },
  {
    catalogId: 'springboot',
    name: 'api_spring',
    displayName: 'Spring Boot 3 (Java 21)',
    category: 'backend',
    icon: 'Layers',
    color: '#6DB33F',
    description: 'Enterprise Java 21 LTS backend framework with Spring Data, Security & Actuator',
    isCustomBuild: true,
    buildContext: './backend',
    dockerfilePath: './backend/Dockerfile',
    dockerfileType: 'springboot',
    ports: [{ id: 'p1', hostPort: 8080, containerPort: 8080, protocol: 'tcp' }],
    expose: [8080],
    networks: ['app-network'],
    env: [
      { id: 'e1', key: 'SPRING_PROFILES_ACTIVE', value: 'prod' },
      { id: 'e2', key: 'SERVER_PORT', value: '8080' }
    ],
    volumes: [],
    dependsOn: [],
    restart: 'unless-stopped',
  },
  {
    catalogId: 'nestjs',
    name: 'api_nest',
    displayName: 'NestJS TypeScript API',
    category: 'backend',
    icon: 'Server',
    color: '#E0234E',
    description: 'Progressive Node.js framework for building efficient, reliable and scalable server-side apps',
    isCustomBuild: true,
    buildContext: './backend',
    dockerfilePath: './backend/Dockerfile',
    dockerfileType: 'nestjs',
    ports: [{ id: 'p1', hostPort: 3000, containerPort: 3000, protocol: 'tcp' }],
    expose: [3000],
    networks: ['app-network'],
    env: [
      { id: 'e1', key: 'NODE_ENV', value: 'production' },
      { id: 'e2', key: 'PORT', value: '3000' }
    ],
    volumes: [],
    dependsOn: [],
    restart: 'unless-stopped',
  },
  {
    catalogId: 'django',
    name: 'api_django',
    displayName: 'Django 5 (Python)',
    category: 'backend',
    icon: 'Shield',
    color: '#092E20',
    description: 'High-level Python web framework with Gunicorn and PostgreSQL integration',
    isCustomBuild: true,
    buildContext: './backend',
    dockerfilePath: './backend/Dockerfile',
    dockerfileType: 'django',
    ports: [{ id: 'p1', hostPort: 8000, containerPort: 8000, protocol: 'tcp' }],
    expose: [8000],
    networks: ['app-network'],
    env: [
      { id: 'e1', key: 'DJANGO_SETTINGS_MODULE', value: 'core.settings' },
      { id: 'e2', key: 'SECRET_KEY', value: 'django_insecure_prod_key_78654', isSecret: true }
    ],
    volumes: [],
    dependsOn: [],
    restart: 'unless-stopped',
  },

  // ==================== FRONTENDS ====================
  {
    catalogId: 'nextjs',
    name: 'frontend_nextjs',
    displayName: 'Next.js App',
    category: 'frontend',
    icon: 'Globe',
    color: '#FFFFFF',
    description: 'Modern React Framework with Server Components and SSR',
    isCustomBuild: true,
    buildContext: './frontend',
    dockerfilePath: './frontend/Dockerfile',
    dockerfileType: 'nextjs',
    ports: [{ id: 'p1', hostPort: 3000, containerPort: 3000, protocol: 'tcp' }],
    expose: [3000],
    networks: ['app-network'],
    env: [
      { id: 'e1', key: 'NODE_ENV', value: 'production' },
      { id: 'e2', key: 'PORT', value: '3000' }
    ],
    volumes: [],
    dependsOn: [],
    restart: 'unless-stopped',
  },
  {
    catalogId: 'react-vite',
    name: 'frontend_react',
    displayName: 'React / Vite SPA',
    category: 'frontend',
    icon: 'Code',
    color: '#61DAFB',
    description: 'Blazing fast single-page app served with optimized Nginx web server',
    isCustomBuild: true,
    buildContext: './frontend',
    dockerfilePath: './frontend/Dockerfile',
    dockerfileType: 'react-vite',
    ports: [{ id: 'p1', hostPort: 5173, containerPort: 80, protocol: 'tcp' }],
    expose: [80],
    networks: ['app-network'],
    env: [],
    volumes: [],
    dependsOn: [],
    restart: 'unless-stopped',
  },
  {
    catalogId: 'angular',
    name: 'frontend_angular',
    displayName: 'Angular 18 SPA',
    category: 'frontend',
    icon: 'Compass',
    color: '#DD0031',
    description: 'Enterprise TypeScript Frontend framework with standalone components and Nginx runner',
    isCustomBuild: true,
    buildContext: './frontend',
    dockerfilePath: './frontend/Dockerfile',
    dockerfileType: 'angular',
    ports: [{ id: 'p1', hostPort: 4200, containerPort: 80, protocol: 'tcp' }],
    expose: [80],
    networks: ['app-network'],
    env: [],
    volumes: [],
    dependsOn: [],
    restart: 'unless-stopped',
  },
  {
    catalogId: 'vuejs',
    name: 'frontend_vue',
    displayName: 'Vue 3 + Vite',
    category: 'frontend',
    icon: 'Zap',
    color: '#42B883',
    description: 'Progressive JavaScript framework with Composition API and Nginx container',
    isCustomBuild: true,
    buildContext: './frontend',
    dockerfilePath: './frontend/Dockerfile',
    dockerfileType: 'vuejs',
    ports: [{ id: 'p1', hostPort: 5174, containerPort: 80, protocol: 'tcp' }],
    expose: [80],
    networks: ['app-network'],
    env: [],
    volumes: [],
    dependsOn: [],
    restart: 'unless-stopped',
  },

  // ==================== GATEWAYS & WEB SERVERS ====================
  {
    catalogId: 'nginx',
    name: 'nginx_proxy',
    displayName: 'Nginx Reverse Proxy',
    category: 'gateway',
    image: 'nginx',
    tag: 'alpine',
    icon: 'Network',
    color: '#009639',
    description: 'High-performance reverse proxy, load balancer and static file server',
    isCustomBuild: false,
    ports: [
      { id: 'p1', hostPort: 80, containerPort: 80, protocol: 'tcp', description: 'HTTP' },
      { id: 'p2', hostPort: 443, containerPort: 443, protocol: 'tcp', description: 'HTTPS' }
    ],
    expose: [80, 443],
    networks: ['app-network'],
    env: [],
    volumes: [
      { id: 'v1', hostPath: './nginx/nginx.conf', containerPath: '/etc/nginx/nginx.conf', type: 'bind', readOnly: true, description: 'Proxy rules' },
      { id: 'v2', hostPath: './nginx/ssl', containerPath: '/etc/nginx/ssl', type: 'bind', readOnly: true, description: 'SSL certificates' }
    ],
    dependsOn: [],
    restart: 'unless-stopped',
  },
  {
    catalogId: 'traefik',
    name: 'traefik',
    displayName: 'Traefik Edge Router',
    category: 'gateway',
    image: 'traefik',
    tag: 'v3.1',
    icon: 'Compass',
    color: '#24A1C1',
    description: 'Modern HTTP reverse proxy and load balancer with automatic Let\'s Encrypt SSL',
    isCustomBuild: false,
    ports: [
      { id: 'p1', hostPort: 80, containerPort: 80, protocol: 'tcp' },
      { id: 'p2', hostPort: 443, containerPort: 443, protocol: 'tcp' },
      { id: 'p3', hostPort: 8080, containerPort: 8080, protocol: 'tcp', description: 'Traefik Dashboard' }
    ],
    expose: [80, 443, 8080],
    networks: ['app-network'],
    env: [],
    command: '--api.insecure=true --providers.docker=true --entrypoints.web.address=:80',
    volumes: [
      { id: 'v1', hostPath: '/var/run/docker.sock', containerPath: '/var/run/docker.sock', type: 'bind', readOnly: true }
    ],
    dependsOn: [],
    restart: 'unless-stopped',
  },

  // ==================== QUEUES & EVENT BROKERS ====================
  {
    catalogId: 'rabbitmq',
    name: 'rabbitmq',
    displayName: 'RabbitMQ',
    category: 'queue',
    image: 'rabbitmq',
    tag: '3.13-management-alpine',
    icon: 'Radio',
    color: '#FF6600',
    description: 'Reliable and mature message broker with interactive web management UI',
    isCustomBuild: false,
    ports: [
      { id: 'p1', hostPort: 5672, containerPort: 5672, protocol: 'tcp', description: 'AMQP Protocol' },
      { id: 'p2', hostPort: 15672, containerPort: 15672, protocol: 'tcp', description: 'Management Dashboard' }
    ],
    expose: [5672, 15672],
    networks: ['app-network'],
    env: [
      { id: 'e1', key: 'RABBITMQ_DEFAULT_USER', value: 'rabbit_admin' },
      { id: 'e2', key: 'RABBITMQ_DEFAULT_PASS', value: 'rabbit_pass_secure', isSecret: true }
    ],
    volumes: [
      { id: 'v1', hostPath: 'rabbitmq_data', containerPath: '/var/lib/rabbitmq', type: 'volume' }
    ],
    dependsOn: [],
    restart: 'unless-stopped',
  },
  {
    catalogId: 'kafka',
    name: 'kafka',
    displayName: 'Apache Kafka (KRaft)',
    category: 'queue',
    image: 'confluentinc/cp-kafka',
    tag: '7.6.1',
    icon: 'GitPullRequest',
    color: '#231F20',
    description: 'Distributed event streaming platform running in KRaft mode (no Zookeeper needed)',
    isCustomBuild: false,
    ports: [{ id: 'p1', hostPort: 9092, containerPort: 9092, protocol: 'tcp' }],
    expose: [9092],
    networks: ['app-network'],
    env: [
      { id: 'e1', key: 'KAFKA_NODE_ID', value: '1' },
      { id: 'e2', key: 'KAFKA_PROCESS_ROLES', value: 'broker,controller' },
      { id: 'e3', key: 'KAFKA_LISTENERS', value: 'PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093' },
      { id: 'e4', key: 'KAFKA_ADVERTISED_LISTENERS', value: 'PLAINTEXT://kafka:9092' }
    ],
    volumes: [
      { id: 'v1', hostPath: 'kafka_data', containerPath: '/var/lib/kafka/data', type: 'volume' }
    ],
    dependsOn: [],
    restart: 'unless-stopped',
  },

  // ==================== TOOLS & STORAGE ====================
  {
    catalogId: 'minio',
    name: 'minio_s3',
    displayName: 'MinIO (S3 Object Storage)',
    category: 'tool',
    image: 'minio/minio',
    tag: 'latest',
    icon: 'HardDrive',
    color: '#C72C48',
    description: 'High-performance S3 compatible object storage with console web UI',
    isCustomBuild: false,
    ports: [
      { id: 'p1', hostPort: 9000, containerPort: 9000, protocol: 'tcp', description: 'S3 API' },
      { id: 'p2', hostPort: 9001, containerPort: 9001, protocol: 'tcp', description: 'MinIO Console' }
    ],
    expose: [9000, 9001],
    networks: ['app-network'],
    command: 'server /data --console-address ":9001"',
    env: [
      { id: 'e1', key: 'MINIO_ROOT_USER', value: 'minioadmin' },
      { id: 'e2', key: 'MINIO_ROOT_PASSWORD', value: 'minio_secure_pass_123', isSecret: true }
    ],
    volumes: [
      { id: 'v1', hostPath: 'minio_data', containerPath: '/data', type: 'volume' }
    ],
    dependsOn: [],
    restart: 'unless-stopped',
  },
  {
    catalogId: 'meilisearch',
    name: 'meilisearch',
    displayName: 'Meilisearch',
    category: 'tool',
    image: 'getmeili/meilisearch',
    tag: 'v1.7',
    icon: 'Search',
    color: '#FF4F64',
    description: 'Lightning fast, typo-tolerant search engine API',
    isCustomBuild: false,
    ports: [{ id: 'p1', hostPort: 7700, containerPort: 7700, protocol: 'tcp' }],
    expose: [7700],
    networks: ['app-network'],
    env: [
      { id: 'e1', key: 'MEILI_MASTER_KEY', value: 'meili_master_key_12345678', isSecret: true },
      { id: 'e2', key: 'MEILI_ENV', value: 'production' }
    ],
    volumes: [
      { id: 'v1', hostPath: 'meili_data', containerPath: '/meili_data', type: 'volume' }
    ],
    dependsOn: [],
    restart: 'unless-stopped',
  },
  {
    catalogId: 'mailpit',
    name: 'mailpit',
    displayName: 'Mailpit (Email Testing)',
    category: 'tool',
    image: 'axllent/mailpit',
    tag: 'latest',
    icon: 'Mail',
    color: '#22C55E',
    description: 'Zero-config local SMTP server & webmail viewer for testing emails',
    isCustomBuild: false,
    ports: [
      { id: 'p1', hostPort: 1025, containerPort: 1025, protocol: 'tcp', description: 'SMTP port' },
      { id: 'p2', hostPort: 8025, containerPort: 8025, protocol: 'tcp', description: 'Webmail UI' }
    ],
    expose: [1025, 8025],
    networks: ['app-network'],
    env: [],
    volumes: [],
    dependsOn: [],
    restart: 'unless-stopped',
  },
  {
    catalogId: 'pgadmin',
    name: 'pgadmin',
    displayName: 'pgAdmin 4',
    category: 'tool',
    image: 'dpage/pgadmin4',
    tag: '8.5',
    icon: 'LayoutGrid',
    color: '#326690',
    description: 'Web management and administration tool for PostgreSQL databases',
    isCustomBuild: false,
    ports: [{ id: 'p1', hostPort: 5050, containerPort: 80, protocol: 'tcp' }],
    expose: [80],
    networks: ['app-network'],
    env: [
      { id: 'e1', key: 'PGADMIN_DEFAULT_EMAIL', value: 'admin@dockcraft.local' },
      { id: 'e2', key: 'PGADMIN_DEFAULT_PASSWORD', value: 'admin_pgpass_123', isSecret: true }
    ],
    volumes: [
      { id: 'v1', hostPath: 'pgadmin_data', containerPath: '/var/lib/pgadmin', type: 'volume' }
    ],
    dependsOn: [],
    restart: 'unless-stopped',
  },

  // ==================== AI & LOCAL LLMs ====================
  {
    catalogId: 'ollama',
    name: 'ollama_ai',
    displayName: 'Ollama (Local LLM)',
    category: 'ai',
    image: 'ollama/ollama',
    tag: 'latest',
    icon: 'Sparkles',
    color: '#A855F7',
    description: 'Run large language models (Llama 3, Mistral, Gemma) locally on CPU or GPU',
    isCustomBuild: false,
    ports: [{ id: 'p1', hostPort: 11434, containerPort: 11434, protocol: 'tcp' }],
    expose: [11434],
    networks: ['app-network'],
    env: [
      { id: 'e1', key: 'OLLAMA_KEEP_ALIVE', value: '24h' }
    ],
    volumes: [
      { id: 'v1', hostPath: 'ollama_models', containerPath: '/root/.ollama', type: 'volume', description: 'Cached AI models' }
    ],
    dependsOn: [],
    restart: 'unless-stopped',
  },
  {
    catalogId: 'qdrant',
    name: 'qdrant_db',
    displayName: 'Qdrant (Vector DB)',
    category: 'ai',
    image: 'qdrant/qdrant',
    tag: 'v1.9.0',
    icon: 'Cpu',
    color: '#DC2626',
    description: 'Vector Similarity Search Engine & Database for AI embeddings',
    isCustomBuild: false,
    ports: [
      { id: 'p1', hostPort: 6333, containerPort: 6333, protocol: 'tcp', description: 'REST API' },
      { id: 'p2', hostPort: 6334, containerPort: 6334, protocol: 'tcp', description: 'gRPC API' }
    ],
    expose: [6333, 6334],
    networks: ['app-network'],
    env: [],
    volumes: [
      { id: 'v1', hostPath: 'qdrant_storage', containerPath: '/qdrant/storage', type: 'volume' }
    ],
    dependsOn: [],
    restart: 'unless-stopped',
  },

  // ==================== CUSTOM CONTAINER ====================
  {
    catalogId: 'custom-service',
    name: 'custom_service',
    displayName: 'Custom Container',
    category: 'custom',
    image: 'alpine',
    tag: 'latest',
    icon: 'Box',
    color: '#64748B',
    description: 'Generic Docker container ready for your custom image or local build',
    isCustomBuild: false,
    ports: [{ id: 'p1', hostPort: 8080, containerPort: 8080, protocol: 'tcp' }],
    expose: [8080],
    networks: ['app-network'],
    env: [],
    volumes: [],
    dependsOn: [],
    restart: 'unless-stopped',
  }
];
