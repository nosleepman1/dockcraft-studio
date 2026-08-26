import { describe, it, expect } from 'vitest';
import { 
  generateRandomSecret, 
  generateJWTSecret, 
  generateDatabasePassword, 
  isSensitiveKey, 
  hardenAllStackSecrets 
} from '../engine/secretsVault';
import { DockerService } from '../types/docker';

describe('Secrets Vault Engine', () => {
  it('generates high entropy random secrets', () => {
    const s1 = generateRandomSecret(32, 'hex');
    const s2 = generateRandomSecret(32, 'hex');
    expect(s1).toHaveLength(32);
    expect(s2).toHaveLength(32);
    expect(s1).not.toBe(s2);
  });

  it('generates valid 64-char JWT secrets', () => {
    const jwt = generateJWTSecret();
    expect(jwt).toHaveLength(64);
  });

  it('detects sensitive variable keys correctly', () => {
    expect(isSensitiveKey('POSTGRES_PASSWORD')).toBe(true);
    expect(isSensitiveKey('JWT_SECRET')).toBe(true);
    expect(isSensitiveKey('STRIPE_API_KEY')).toBe(true);
    expect(isSensitiveKey('PORT')).toBe(false);
    expect(isSensitiveKey('NODE_ENV')).toBe(false);
  });

  it('hardens all stack secrets and syncs connection strings', () => {
    const mockServices: DockerService[] = [
      {
        id: 'svc_db',
        name: 'db_postgres',
        displayName: 'Postgres',
        category: 'database',
        ports: [],
        expose: [],
        networks: [],
        volumes: [],
        dependsOn: [],
        restart: 'unless-stopped',
        isCustomBuild: false,
        icon: 'Database',
        color: '#336791',
        description: 'Postgres',
        env: [
          { id: 'e1', key: 'POSTGRES_PASSWORD', value: 'default_insecure_pass', isSecret: true }
        ]
      },
      {
        id: 'svc_api',
        name: 'api_server',
        displayName: 'API',
        category: 'backend',
        ports: [],
        expose: [],
        networks: [],
        volumes: [],
        dependsOn: [],
        restart: 'unless-stopped',
        isCustomBuild: true,
        icon: 'Server',
        color: '#009688',
        description: 'API',
        env: [
          { id: 'e2', key: 'DATABASE_URL', value: 'postgresql://postgres:default_insecure_pass@db_postgres:5432/app_db' },
          { id: 'e3', key: 'JWT_SECRET', value: 'old_secret' }
        ]
      }
    ];

    const result = hardenAllStackSecrets(mockServices);
    expect(result.count).toBeGreaterThan(0);

    const dbPass = result.services[0].env.find(e => e.key === 'POSTGRES_PASSWORD')?.value;
    const apiUrl = result.services[1].env.find(e => e.key === 'DATABASE_URL')?.value;
    const jwt = result.services[1].env.find(e => e.key === 'JWT_SECRET')?.value;

    expect(dbPass).not.toBe('default_insecure_pass');
    expect(jwt).not.toBe('old_secret');
    expect(apiUrl).toContain(dbPass);
  });
});
