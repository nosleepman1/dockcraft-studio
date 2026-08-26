import { describe, it, expect } from 'vitest';
import { generateProductionBundle } from '../engine/productionBundleGenerator';
import { DockerService } from '../types/docker';

describe('Zero-Code Production Deployment Pack Generator', () => {
  const mockServices: DockerService[] = [
    {
      id: 'svc_frontend',
      name: 'frontend_web',
      displayName: 'React Frontend',
      category: 'frontend',
      isCustomBuild: true,
      dockerfileType: 'react-vite',
      ports: [{ id: 'p1', hostPort: 80, containerPort: 80, protocol: 'tcp' }],
      expose: [80],
      networks: ['app-network'],
      env: [],
      volumes: [],
      dependsOn: [],
      restart: 'unless-stopped',
      icon: 'Globe',
      color: '#00D1B2',
      description: 'React SPA',
    },
    {
      id: 'svc_backend',
      name: 'api_server',
      displayName: 'Go Microservice',
      category: 'backend',
      isCustomBuild: true,
      dockerfileType: 'go',
      ports: [{ id: 'p2', hostPort: 8080, containerPort: 8080, protocol: 'tcp' }],
      expose: [8080],
      networks: ['app-network'],
      env: [{ id: 'e1', key: 'DATABASE_URL', value: 'postgresql://postgres:pass@db_postgres:5432/app_db' }],
      volumes: [],
      dependsOn: [],
      restart: 'unless-stopped',
      icon: 'Server',
      color: '#00ADD8',
      description: 'Go REST API',
    },
    {
      id: 'svc_db',
      name: 'db_postgres',
      displayName: 'PostgreSQL',
      category: 'database',
      image: 'postgres',
      tag: '16-alpine',
      isCustomBuild: false,
      ports: [{ id: 'p3', hostPort: 5432, containerPort: 5432, protocol: 'tcp' }],
      expose: [5432],
      networks: ['app-network'],
      env: [{ id: 'e2', key: 'POSTGRES_PASSWORD', value: 'my_secret_pass', isSecret: true }],
      volumes: [{ id: 'v1', hostPath: 'postgres_data', containerPath: '/var/lib/postgresql/data', type: 'volume' }],
      dependsOn: [],
      restart: 'unless-stopped',
      icon: 'Database',
      color: '#336791',
      description: 'Postgres DB',
    }
  ];

  it('generates all required production deployment artifacts', () => {
    const bundle = generateProductionBundle(mockServices, 'my-prod-project', {
      domainName: 'myapp.com',
      enableSSL: true,
      sslEmail: 'ops@myapp.com',
      enableCICD: true,
      enableDBBackupCron: true,
    });

    expect(bundle.files.length).toBe(7);
    expect(bundle.composeProdYaml).toContain('version: "3.8"');
    expect(bundle.composeProdYaml).toContain('prod_nginx_gateway');
    expect(bundle.composeProdYaml).toContain('prod_certbot');
    expect(bundle.composeProdYaml).toContain('restart: always');
    expect(bundle.composeProdYaml).toContain('public_net');
    expect(bundle.composeProdYaml).toContain('internal_net');
    expect(bundle.composeProdYaml).toContain('json-file');

    expect(bundle.nginxProdConf).toContain('ssl_certificate');
    expect(bundle.nginxProdConf).toContain('gzip on;');
    expect(bundle.nginxProdConf).toContain('limit_req_zone');
    expect(bundle.nginxProdConf).toContain('Strict-Transport-Security');

    expect(bundle.githubActionsYaml).toContain('appleboy/ssh-action');
    expect(bundle.deploySh).toContain('#!/bin/bash');
    expect(bundle.deployPs1).toContain('docker compose -f docker-compose.prod.yml up');
    expect(bundle.makefile).toContain('backup-db:');
  });
});
