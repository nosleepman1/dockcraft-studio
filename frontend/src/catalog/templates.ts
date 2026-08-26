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
  {
    id: 'next-fastapi-postgres',
    name: 'Modern Fullstack (Next.js + FastAPI + Postgres + Redis)',
    description: 'Battle-tested modern stack with Next.js App Router frontend, high-speed FastAPI backend, PostgreSQL database, and Redis cache.',
    category: 'Fullstack Web',
    tags: ['Next.js', 'FastAPI', 'PostgreSQL', 'Redis'],
    icon: 'Layers',
    services: [
      { ...getCatalog('nextjs'), id: 'svc_next', name: 'web_frontend', ports: [{ id: 'p1', hostPort: 3000, containerPort: 3000, protocol: 'tcp' }] },
      { ...getCatalog('python-fastapi'), id: 'svc_api', name: 'api_server', ports: [{ id: 'p2', hostPort: 8000, containerPort: 8000, protocol: 'tcp' }] },
      { ...getCatalog('postgres'), id: 'svc_db', name: 'db_postgres', ports: [{ id: 'p3', hostPort: 5432, containerPort: 5432, protocol: 'tcp' }] },
      { ...getCatalog('redis'), id: 'svc_redis', name: 'cache_redis', ports: [{ id: 'p4', hostPort: 6379, containerPort: 6379, protocol: 'tcp' }] },
    ],
    connections: [
      { sourceId: 'svc_next', targetId: 'svc_api', type: 'api' },
      { sourceId: 'svc_api', targetId: 'svc_db', type: 'database' },
      { sourceId: 'svc_api', targetId: 'svc_redis', type: 'database' },
    ]
  },
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
