import { describe, it, expect } from 'vitest';
import { autoWireServices } from '../engine/autoWiring';
import { DockerService } from '../types/docker';

describe('Auto-Wiring Engine', () => {
  const mockBackend: DockerService = {
    id: 'svc_backend',
    name: 'api_server',
    displayName: 'FastAPI Server',
    category: 'backend',
    ports: [{ id: 'p1', hostPort: 8000, containerPort: 8000, protocol: 'tcp' }],
    expose: [],
    networks: ['app-network'],
    env: [],
    volumes: [],
    dependsOn: [],
    isCustomBuild: true,
    restart: 'unless-stopped',
    icon: 'Server',
    color: '#009688',
    description: 'FastAPI app'
  };

  const mockPostgres: DockerService = {
    id: 'svc_postgres',
    name: 'postgres_db',
    displayName: 'PostgreSQL',
    category: 'database',
    image: 'postgres',
    tag: '16-alpine',
    ports: [{ id: 'p2', hostPort: 5432, containerPort: 5432, protocol: 'tcp' }],
    expose: [],
    networks: ['app-network'],
    env: [
      { id: 'e1', key: 'POSTGRES_USER', value: 'dbadmin' },
      { id: 'e2', key: 'POSTGRES_PASSWORD', value: 'secretpass123', isSecret: true },
      { id: 'e3', key: 'POSTGRES_DB', value: 'production_db' },
    ],
    volumes: [],
    dependsOn: [],
    healthCheck: { enabled: true, test: 'pg_isready' },
    isCustomBuild: false,
    restart: 'unless-stopped',
    icon: 'Database',
    color: '#336791',
    description: 'Postgres DB'
  };

  it('should auto-inject DATABASE_URL when connecting Backend to PostgreSQL', () => {
    const result = autoWireServices(mockBackend, mockPostgres);

    expect(result.relationType).toBe('database');
    const dbUrlVar = result.updatedSource.env.find(e => e.key === 'DATABASE_URL');
    expect(dbUrlVar).toBeDefined();
    expect(dbUrlVar?.value).toBe('postgresql://dbadmin:secretpass123@postgres_db:5432/production_db');

    // Should add depends_on with condition service_healthy
    expect(result.updatedSource.dependsOn).toEqual([
      { serviceId: 'svc_postgres', condition: 'service_healthy' }
    ]);
  });

<<<<<<< HEAD
=======
  it('should auto-wire even when dragging in reverse from PostgreSQL to Backend', () => {
    const result = autoWireServices(mockPostgres, mockBackend);

    expect(result.relationType).toBe('database');
    const dbUrlVar = result.updatedTarget.env.find(e => e.key === 'DATABASE_URL');
    expect(dbUrlVar).toBeDefined();
    expect(dbUrlVar?.value).toBe('postgresql://dbadmin:secretpass123@postgres_db:5432/production_db');
    expect(result.updatedTarget.dependsOn).toEqual([
      { serviceId: 'svc_postgres', condition: 'service_healthy' }
    ]);
  });

>>>>>>> bf34f7e (feat(frontend): implement visual ReactFlow canvas, magnetic glowing handles, bidirectional auto-wiring & live code generators)
  it('should auto-configure Frontend API URL when connecting Frontend to Backend', () => {
    const mockFrontend: DockerService = {
      id: 'svc_fe',
      name: 'web_app',
      displayName: 'Next.js Frontend',
      category: 'frontend',
      ports: [{ id: 'p3', hostPort: 3000, containerPort: 3000 }],
      expose: [],
      networks: ['app-network'],
      env: [],
      volumes: [],
      dependsOn: [],
      isCustomBuild: true,
      restart: 'unless-stopped',
      icon: 'Globe',
      color: '#FFFFFF',
      description: 'Next app'
    };

    const result = autoWireServices(mockFrontend, mockBackend);

    expect(result.relationType).toBe('api');
    const apiUrl = result.updatedSource.env.find(e => e.key === 'VITE_API_URL');
    expect(apiUrl?.value).toBe('http://localhost:8000');
  });
});
