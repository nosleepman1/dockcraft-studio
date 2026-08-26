import { describe, it, expect } from 'vitest';
import { generateDockerComposeYaml } from '../engine/composeGenerator';
import { DockerService } from '../types/docker';

describe('Compose Generator Engine', () => {
  const mockService: DockerService = {
    id: 'svc_redis',
    name: 'redis_cache',
    displayName: 'Redis',
    category: 'database',
    image: 'redis',
    tag: '7.2-alpine',
    ports: [{ id: 'p1', hostPort: 6379, containerPort: 6379, protocol: 'tcp' }],
    expose: [],
    networks: ['app-network'],
    env: [{ id: 'e1', key: 'REDIS_PASSWORD', value: 'secret', isSecret: true }],
    volumes: [{ id: 'v1', hostPath: 'redis_data', containerPath: '/data', type: 'volume' }],
    dependsOn: [],
    restart: 'unless-stopped',
    isCustomBuild: false,
    icon: 'Layers',
    color: '#DC382D',
    description: 'Redis'
  };

  it('should generate valid docker-compose structure', () => {
    const yaml = generateDockerComposeYaml([mockService]);

    expect(yaml).toContain('services:');
    expect(yaml).toContain('redis_cache:');
    expect(yaml).toContain('image: redis:7.2-alpine');
    expect(yaml).toContain('"6379:6379"');
    expect(yaml).toContain('redis_data:/data');
    expect(yaml).toContain('volumes:\n  redis_data:');
  });
});
