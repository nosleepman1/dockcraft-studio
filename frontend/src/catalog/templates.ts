import { ArchitectureTemplate, DockerService } from '../types/docker';
import { SERVICE_CATALOG } from './serviceCatalog';

const getCatalog = (id: string): DockerService => {
  const item = SERVICE_CATALOG.find(c => c.catalogId === id);
  if (!item) throw new Error(`Catalog item ${id} not found`);
  const clone = JSON.parse(JSON.stringify(item));
  clone.id = `svc_${id}_${Math.random().toString(36).substr(2, 6)}`;
  return clone;
};

export const ARCHITECTURE_TEMPLATES: ArchitectureTemplate[] = [
  // 1. React + Laravel + PostgreSQL + Redis + Nginx
  {
    id: 'react-laravel-postgres',
    name: 'React + Laravel 11 (PostgreSQL + Redis + Nginx)',
    description: 'Enterprise PHP/TS stack with React Vite SPA, Laravel 11 backend with PHP 8.3-FPM, PostgreSQL, Redis cache/queues, and unified Nginx gateway.',
    category: 'Fullstack Web',
    tags: ['React', 'Laravel', 'PHP', 'PostgreSQL', 'Redis', 'Nginx'],
    icon: 'Flame',
    services: [
      { ...getCatalog('nginx'), id: 'svc_nginx', name: 'edge_gateway', ports: [{ id: 'p1', hostPort: 80, containerPort: 80, protocol: 'tcp' }] },
      { ...getCatalog('react-vite'), id: 'svc_react', name: 'client_frontend', ports: [{ id: 'p2', hostPort: 5173, containerPort: 80, protocol: 'tcp' }] },
      { ...getCatalog('laravel'), id: 'svc_laravel', name: 'api_laravel', ports: [{ id: 'p3', hostPort: 9000, containerPort: 9000, protocol: 'tcp' }] },
      { ...getCatalog('postgres'), id: 'svc_db', name: 'db_postgres', ports: [{ id: 'p4', hostPort: 5432, containerPort: 5432, protocol: 'tcp' }] },
      { ...getCatalog('redis'), id: 'svc_redis', name: 'cache_redis', ports: [{ id: 'p5', hostPort: 6379, containerPort: 6379, protocol: 'tcp' }] },
    ],
    connections: [
      { sourceId: 'svc_nginx', targetId: 'svc_react', type: 'proxy' },
      { sourceId: 'svc_nginx', targetId: 'svc_laravel', type: 'proxy' },
      { sourceId: 'svc_laravel', targetId: 'svc_db', type: 'database' },
      { sourceId: 'svc_laravel', targetId: 'svc_redis', type: 'database' },
    ]
  },

  // 2. Angular + Spring Boot + PostgreSQL + Redis
  {
    id: 'angular-springboot-postgres',
    name: 'Angular 18 + Spring Boot 3 (Java 21 + PostgreSQL + Redis)',
    description: 'Enterprise production Java stack with Angular 18 standalone components frontend, Spring Boot 3 Java 21 LTS REST API, PostgreSQL database, and Redis cache.',
    category: 'Enterprise Java',
    tags: ['Angular', 'Spring Boot', 'Java', 'PostgreSQL', 'Redis'],
    icon: 'Layers',
    services: [
      { ...getCatalog('angular'), id: 'svc_angular', name: 'frontend_angular', ports: [{ id: 'p1', hostPort: 4200, containerPort: 80, protocol: 'tcp' }] },
      { ...getCatalog('springboot'), id: 'svc_spring', name: 'api_springboot', ports: [{ id: 'p2', hostPort: 8080, containerPort: 8080, protocol: 'tcp' }] },
      { ...getCatalog('postgres'), id: 'svc_db', name: 'db_postgres', ports: [{ id: 'p3', hostPort: 5432, containerPort: 5432, protocol: 'tcp' }] },
      { ...getCatalog('redis'), id: 'svc_redis', name: 'cache_redis', ports: [{ id: 'p4', hostPort: 6379, containerPort: 6379, protocol: 'tcp' }] },
    ],
    connections: [
      { sourceId: 'svc_angular', targetId: 'svc_spring', type: 'api' },
      { sourceId: 'svc_spring', targetId: 'svc_db', type: 'database' },
      { sourceId: 'svc_spring', targetId: 'svc_redis', type: 'database' },
    ]
  },

  // 3. NestJS + Angular + PostgreSQL + Redis
  {
    id: 'nest-angular-postgres',
    name: 'NestJS + Angular 18 (TypeScript Fullstack + PostgreSQL + Redis)',
    description: 'Full end-to-end TypeScript architecture with Angular 18 client, NestJS modular enterprise API, TypeORM/Prisma with PostgreSQL, and Redis caching.',
    category: 'Fullstack Web',
    tags: ['NestJS', 'Angular', 'TypeScript', 'PostgreSQL', 'Redis'],
    icon: 'Server',
    services: [
      { ...getCatalog('angular'), id: 'svc_angular', name: 'client_angular', ports: [{ id: 'p1', hostPort: 4200, containerPort: 80, protocol: 'tcp' }] },
      { ...getCatalog('nestjs'), id: 'svc_nest', name: 'api_nest', ports: [{ id: 'p2', hostPort: 3000, containerPort: 3000, protocol: 'tcp' }] },
      { ...getCatalog('postgres'), id: 'svc_db', name: 'db_postgres', ports: [{ id: 'p3', hostPort: 5432, containerPort: 5432, protocol: 'tcp' }] },
      { ...getCatalog('redis'), id: 'svc_redis', name: 'cache_redis', ports: [{ id: 'p4', hostPort: 6379, containerPort: 6379, protocol: 'tcp' }] },
    ],
    connections: [
      { sourceId: 'svc_angular', targetId: 'svc_nest', type: 'api' },
      { sourceId: 'svc_nest', targetId: 'svc_db', type: 'database' },
      { sourceId: 'svc_nest', targetId: 'svc_redis', type: 'database' },
    ]
  },

  // 4. NestJS + React + PostgreSQL + Redis
  {
    id: 'nest-react-postgres',
    name: 'NestJS + React (Vite SPA + PostgreSQL + Redis)',
    description: 'High-velocity TypeScript stack with React Vite SPA, robust NestJS backend API, PostgreSQL relational database, and Redis cache.',
    category: 'Fullstack Web',
    tags: ['NestJS', 'React', 'TypeScript', 'PostgreSQL', 'Redis'],
    icon: 'Code',
    services: [
      { ...getCatalog('react-vite'), id: 'svc_react', name: 'client_react', ports: [{ id: 'p1', hostPort: 5173, containerPort: 80, protocol: 'tcp' }] },
      { ...getCatalog('nestjs'), id: 'svc_nest', name: 'api_nest', ports: [{ id: 'p2', hostPort: 3000, containerPort: 3000, protocol: 'tcp' }] },
      { ...getCatalog('postgres'), id: 'svc_db', name: 'db_postgres', ports: [{ id: 'p3', hostPort: 5432, containerPort: 5432, protocol: 'tcp' }] },
      { ...getCatalog('redis'), id: 'svc_redis', name: 'cache_redis', ports: [{ id: 'p4', hostPort: 6379, containerPort: 6379, protocol: 'tcp' }] },
    ],
    connections: [
      { sourceId: 'svc_react', targetId: 'svc_nest', type: 'api' },
      { sourceId: 'svc_nest', targetId: 'svc_db', type: 'database' },
      { sourceId: 'svc_nest', targetId: 'svc_redis', type: 'database' },
    ]
  },

  // 5. Next.js + FastAPI + PostgreSQL + Redis
  {
    id: 'next-fastapi-postgres',
    name: 'Next.js + Python FastAPI (PostgreSQL + Redis)',
    description: 'Modern AI-ready stack with Next.js App Router frontend, high-speed Python FastAPI backend, PostgreSQL database, and Redis cache.',
    category: 'Fullstack Web',
    tags: ['Next.js', 'FastAPI', 'Python', 'PostgreSQL', 'Redis'],
    icon: 'Zap',
    services: [
      { ...getCatalog('nextjs'), id: 'svc_next', name: 'web_frontend', ports: [{ id: 'p1', hostPort: 3000, containerPort: 3000, protocol: 'tcp' }] },
      { ...getCatalog('python-fastapi'), id: 'svc_api', name: 'api_fastapi', ports: [{ id: 'p2', hostPort: 8000, containerPort: 8000, protocol: 'tcp' }] },
      { ...getCatalog('postgres'), id: 'svc_db', name: 'db_postgres', ports: [{ id: 'p3', hostPort: 5432, containerPort: 5432, protocol: 'tcp' }] },
      { ...getCatalog('redis'), id: 'svc_redis', name: 'cache_redis', ports: [{ id: 'p4', hostPort: 6379, containerPort: 6379, protocol: 'tcp' }] },
    ],
    connections: [
      { sourceId: 'svc_next', targetId: 'svc_api', type: 'api' },
      { sourceId: 'svc_api', targetId: 'svc_db', type: 'database' },
      { sourceId: 'svc_api', targetId: 'svc_redis', type: 'database' },
    ]
  },

  // 6. Vue 3 + Django + PostgreSQL + Redis
  {
    id: 'vue-django-postgres',
    name: 'Vue 3 + Django 5 (PostgreSQL + Redis)',
    description: 'Elegant Fullstack stack with Vue 3 / Vite frontend, Django 5 Gunicorn REST API, PostgreSQL database, and Redis cache.',
    category: 'Fullstack Web',
    tags: ['Vue.js', 'Django', 'Python', 'PostgreSQL', 'Redis'],
    icon: 'Shield',
    services: [
      { ...getCatalog('vuejs'), id: 'svc_vue', name: 'client_vue', ports: [{ id: 'p1', hostPort: 5174, containerPort: 80, protocol: 'tcp' }] },
      { ...getCatalog('django'), id: 'svc_django', name: 'api_django', ports: [{ id: 'p2', hostPort: 8000, containerPort: 8000, protocol: 'tcp' }] },
      { ...getCatalog('postgres'), id: 'svc_db', name: 'db_postgres', ports: [{ id: 'p3', hostPort: 5432, containerPort: 5432, protocol: 'tcp' }] },
      { ...getCatalog('redis'), id: 'svc_redis', name: 'cache_redis', ports: [{ id: 'p4', hostPort: 6379, containerPort: 6379, protocol: 'tcp' }] },
    ],
    connections: [
      { sourceId: 'svc_vue', targetId: 'svc_django', type: 'api' },
      { sourceId: 'svc_django', targetId: 'svc_db', type: 'database' },
      { sourceId: 'svc_django', targetId: 'svc_redis', type: 'database' },
    ]
  },

  // 7. Go Gin + React + PostgreSQL + Redis
  {
    id: 'go-react-postgres',
    name: 'Go (Gin) + React Vite (PostgreSQL + Redis)',
    description: 'High-throughput microsecond backend with compiled Go Gin REST API, React Vite frontend, PostgreSQL, and Redis.',
    category: 'High Performance',
    tags: ['Go', 'React', 'PostgreSQL', 'Redis'],
    icon: 'Cpu',
    services: [
      { ...getCatalog('react-vite'), id: 'svc_react', name: 'client_app', ports: [{ id: 'p1', hostPort: 5173, containerPort: 80, protocol: 'tcp' }] },
      { ...getCatalog('go-gin'), id: 'svc_go', name: 'api_go', ports: [{ id: 'p2', hostPort: 8080, containerPort: 8080, protocol: 'tcp' }] },
      { ...getCatalog('postgres'), id: 'svc_db', name: 'db_postgres', ports: [{ id: 'p3', hostPort: 5432, containerPort: 5432, protocol: 'tcp' }] },
      { ...getCatalog('redis'), id: 'svc_redis', name: 'cache_redis', ports: [{ id: 'p4', hostPort: 6379, containerPort: 6379, protocol: 'tcp' }] },
    ],
    connections: [
      { sourceId: 'svc_react', targetId: 'svc_go', type: 'api' },
      { sourceId: 'svc_go', targetId: 'svc_db', type: 'database' },
      { sourceId: 'svc_go', targetId: 'svc_redis', type: 'database' },
    ]
  },

  // 8. MERN Stack
  {
    id: 'mern-stack',
    name: 'MERN Stack (React + Node.js + MongoDB + Redis)',
    description: 'Classic JavaScript / TypeScript fullstack architecture with React Vite frontend, Express API backend, MongoDB NoSQL database, and Redis cache.',
    category: 'Fullstack Web',
    tags: ['React', 'Node.js', 'MongoDB', 'Redis'],
    icon: 'Code',
    services: [
      { ...getCatalog('react-vite'), id: 'svc_react', name: 'client_app', ports: [{ id: 'p1', hostPort: 5173, containerPort: 80, protocol: 'tcp' }] },
      { ...getCatalog('node-backend'), id: 'svc_node', name: 'api_gateway', ports: [{ id: 'p2', hostPort: 4000, containerPort: 4000, protocol: 'tcp' }] },
      { ...getCatalog('mongodb'), id: 'svc_mongo', name: 'db_mongo', ports: [{ id: 'p3', hostPort: 27017, containerPort: 27017, protocol: 'tcp' }] },
      { ...getCatalog('redis'), id: 'svc_redis', name: 'session_cache', ports: [{ id: 'p4', hostPort: 6379, containerPort: 6379, protocol: 'tcp' }] },
    ],
    connections: [
      { sourceId: 'svc_react', targetId: 'svc_node', type: 'api' },
      { sourceId: 'svc_node', targetId: 'svc_mongo', type: 'database' },
      { sourceId: 'svc_node', targetId: 'svc_redis', type: 'database' },
    ]
  },

  // 9. Event-Driven Microservices
  {
    id: 'microservices-rabbitmq',
    name: 'Event-Driven Microservices (Nginx + Go + Node + RabbitMQ + DB)',
    description: 'Enterprise decoupled microservices pattern with unified Nginx reverse proxy, Go Auth service, Node Order service, RabbitMQ message broker and PostgreSQL.',
    category: 'Microservices',
    tags: ['Nginx', 'Go', 'Node.js', 'RabbitMQ', 'PostgreSQL'],
    icon: 'Network',
    services: [
      { ...getCatalog('nginx'), id: 'svc_nginx', name: 'edge_gateway', ports: [{ id: 'p1', hostPort: 80, containerPort: 80, protocol: 'tcp' }] },
      { ...getCatalog('go-gin'), id: 'svc_auth', name: 'auth_service', ports: [{ id: 'p2', hostPort: 8081, containerPort: 8080, protocol: 'tcp' }] },
      { ...getCatalog('node-backend'), id: 'svc_orders', name: 'order_service', ports: [{ id: 'p3', hostPort: 8082, containerPort: 4000, protocol: 'tcp' }] },
      { ...getCatalog('rabbitmq'), id: 'svc_rabbit', name: 'event_bus', ports: [{ id: 'p4', hostPort: 5672, containerPort: 5672, protocol: 'tcp' }, { id: 'p5', hostPort: 15672, containerPort: 15672, protocol: 'tcp' }] },
      { ...getCatalog('postgres'), id: 'svc_db', name: 'main_db', ports: [{ id: 'p6', hostPort: 5432, containerPort: 5432, protocol: 'tcp' }] },
    ],
    connections: [
      { sourceId: 'svc_nginx', targetId: 'svc_auth', type: 'proxy' },
      { sourceId: 'svc_nginx', targetId: 'svc_orders', type: 'proxy' },
      { sourceId: 'svc_auth', targetId: 'svc_db', type: 'database' },
      { sourceId: 'svc_orders', targetId: 'svc_rabbit', type: 'queue' },
      { sourceId: 'svc_orders', targetId: 'svc_db', type: 'database' },
    ]
  },

  // 10. Local AI & RAG Assistant
  {
    id: 'local-ai-rag-stack',
    name: 'Local AI & RAG Assistant (Next.js + FastAPI + Ollama + Qdrant)',
    description: 'Privacy-first local AI application stack. Run open-source LLMs with Ollama, vector search with Qdrant, FastAPI RAG orchestrator and modern Next.js chat UI.',
    category: 'AI & Data',
    tags: ['Ollama', 'Qdrant', 'FastAPI', 'Next.js', 'Local LLM'],
    icon: 'Sparkles',
    services: [
      { ...getCatalog('nextjs'), id: 'svc_ui', name: 'ai_chat_ui', ports: [{ id: 'p1', hostPort: 3000, containerPort: 3000, protocol: 'tcp' }] },
      { ...getCatalog('python-fastapi'), id: 'svc_rag', name: 'rag_orchestrator', ports: [{ id: 'p2', hostPort: 8000, containerPort: 8000, protocol: 'tcp' }] },
      { ...getCatalog('ollama'), id: 'svc_llm', name: 'ollama_inference', ports: [{ id: 'p3', hostPort: 11434, containerPort: 11434, protocol: 'tcp' }] },
      { ...getCatalog('qdrant'), id: 'svc_vector', name: 'vector_store', ports: [{ id: 'p4', hostPort: 6333, containerPort: 6333, protocol: 'tcp' }] },
    ],
    connections: [
      { sourceId: 'svc_ui', targetId: 'svc_rag', type: 'api' },
      { sourceId: 'svc_rag', targetId: 'svc_llm', type: 'ai' },
      { sourceId: 'svc_rag', targetId: 'svc_vector', type: 'ai' },
    ]
  },
];
