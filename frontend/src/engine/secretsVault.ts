import { DockerService, EnvVariable } from '../types/docker';

/**
 * Generates a cryptographically strong random string
 */
export function generateRandomSecret(length: number = 32, format: 'hex' | 'base64' | 'alphanumeric' = 'hex'): string {
  const byteCount = Math.ceil(length);
  const randomBytes = new Uint8Array(byteCount);
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomBytes);
  } else {
    for (let i = 0; i < byteCount; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
  }

  if (format === 'hex') {
    return Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, length);
  }

  if (format === 'base64') {
    const binString = Array.from(randomBytes, (byte) => String.fromCharCode(byte)).join('');
    return btoa(binString).replace(/[/+=]/g, '').slice(0, length);
  }

  // Alphanumeric with symbols
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
  return Array.from(randomBytes).map(b => chars[b % chars.length]).join('').slice(0, length);
}

export function generateJWTSecret(): string {
  return generateRandomSecret(64, 'hex');
}

export function generateDatabasePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!#%*+';
  const randomBytes = new Uint8Array(24);
  crypto.getRandomValues(randomBytes);
  return Array.from(randomBytes).map(b => chars[b % chars.length]).join('');
}

export function generateApiKey(prefix: string = 'dc'): string {
  return `${prefix}_live_${generateRandomSecret(32, 'hex')}`;
}

export function isSensitiveKey(keyName: string): boolean {
  const upper = keyName.toUpperCase();
  return (
    upper.includes('SECRET') ||
    upper.includes('PASSWORD') ||
    upper.includes('PASS') ||
    upper.includes('KEY') ||
    upper.includes('TOKEN') ||
    upper.includes('AUTH') ||
    upper.includes('CREDENTIAL') ||
    upper.includes('PRIVATE')
  );
}

/**
 * Hardens all environment variables in a single service
 */
export function hardenServiceEnvs(service: DockerService): DockerService {
  const updatedEnvs: EnvVariable[] = service.env.map((env) => {
    if (isSensitiveKey(env.key)) {
      let newValue = env.value;
      if (env.key.includes('JWT') || env.key.includes('SECRET_KEY')) {
        newValue = generateJWTSecret();
      } else if (env.key.includes('PASSWORD') || env.key.includes('PASS')) {
        newValue = generateDatabasePassword();
      } else if (env.key.includes('KEY') || env.key.includes('TOKEN')) {
        newValue = generateApiKey('app');
      } else {
        newValue = generateRandomSecret(32, 'hex');
      }

      return {
        ...env,
        value: newValue,
        isSecret: true,
      };
    }
    return env;
  });

  return {
    ...service,
    env: updatedEnvs,
  };
}

/**
 * Hardens all services across the entire canvas while maintaining relational synchronization
 * (e.g. ensures POSTGRES_PASSWORD in db matches the password in backend DATABASE_URL)
 */
export function hardenAllStackSecrets(services: DockerService[]): { services: DockerService[]; count: number } {
  let count = 0;
  const dbPasswords: Record<string, string> = {};

  // 1. Generate secrets for all databases first
  const dbServices = services.map(s => {
    if (s.category === 'database') {
      const hardened = hardenServiceEnvs(s);
      hardened.env.forEach(e => {
        if (e.key.includes('PASSWORD')) {
          dbPasswords[s.name] = e.value;
          count++;
        }
      });
      return hardened;
    }
    return s;
  });

  // 2. Update APIs and backends with matching connection strings
  const updatedServices = dbServices.map(s => {
    if (s.category !== 'database') {
      const hardened = hardenServiceEnvs(s);
      
      // Update any DATABASE_URL containing matching DB name
      hardened.env = hardened.env.map(e => {
        if (e.key.includes('DATABASE_URL')) {
          for (const [dbName, dbPass] of Object.entries(dbPasswords)) {
            if (e.value.includes(dbName)) {
              const regex = /(:\/\/[^:]+:)[^@]+(@.*)/;
              if (regex.test(e.value)) {
                e.value = e.value.replace(regex, `$1${dbPass}$2`);
              }
            }
          }
        }
        if (isSensitiveKey(e.key) && s.category !== 'database') {
          count++;
        }
        return e;
      });

      return hardened;
    }
    return s;
  });

  return { services: updatedServices, count };
}
