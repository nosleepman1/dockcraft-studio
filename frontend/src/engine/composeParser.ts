import * as yaml from 'js-yaml';
import { DockerService, PortMapping, VolumeMapping, EnvVariable, HealthCheck } from '../types/docker';
import { SERVICE_CATALOG } from '../catalog/serviceCatalog';

export interface ParseComposeResult {
  services: DockerService[];
  connections: { sourceId: string; targetId: string }[];
  errors: string[];
}

export function parseDockerComposeYaml(yamlString: string): ParseComposeResult {
  const errors: string[] = [];
  const services: DockerService[] = [];
  const connections: { sourceId: string; targetId: string }[] = [];

  try {
    const parsed = yaml.load(yamlString) as any;
    if (!parsed || typeof parsed !== 'object') {
      return { services: [], connections: [], errors: ['Invalid YAML structure'] };
    }

    const servicesObj = parsed.services || parsed;
    if (typeof servicesObj !== 'object') {
      return { services: [], connections: [], errors: ['No "services" section found in docker-compose file'] };
    }

    const serviceNameToIdMap = new Map<string, string>();

    Object.keys(servicesObj).forEach(serviceKey => {
      const s = servicesObj[serviceKey];
      if (!s || typeof s !== 'object') return;

      const serviceId = `svc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      serviceNameToIdMap.set(serviceKey, serviceId);

      const imageStr = (s.image || '').toLowerCase();
      let matchedCatalog = SERVICE_CATALOG.find(c => 
        (s.image && c.image && imageStr.startsWith(c.image)) || 
        serviceKey.toLowerCase().includes(c.name)
      );

      let category: DockerService['category'] = 'custom';
      let icon = 'Box';
      let color = '#64748B';

      if (matchedCatalog) {
        category = matchedCatalog.category;
        icon = matchedCatalog.icon;
        color = matchedCatalog.color;
      } else if (imageStr.includes('postgres') || imageStr.includes('mysql') || imageStr.includes('mongo') || imageStr.includes('redis')) {
        category = 'database';
        icon = 'Database';
        color = '#336791';
      } else if (imageStr.includes('nginx') || imageStr.includes('traefik')) {
        category = 'gateway';
        icon = 'Network';
        color = '#009639';
      } else if (imageStr.includes('node') || imageStr.includes('python') || s.build) {
        category = 'backend';
        icon = 'Server';
        color = '#68A063';
      }

      const ports: PortMapping[] = [];
      if (Array.isArray(s.ports)) {
        s.ports.forEach((p: any, idx: number) => {
          const str = String(p);
          const parts = str.split(':');
          if (parts.length === 2) {
            ports.push({
              id: `p_${idx}`,
              hostPort: parts[0],
              containerPort: parts[1].split('/')[0],
              protocol: parts[1].includes('/udp') ? 'udp' : 'tcp'
            });
          }
        });
      }

      const env: EnvVariable[] = [];
      if (Array.isArray(s.environment)) {
        s.environment.forEach((e: any, idx: number) => {
          const str = String(e);
          const eqIdx = str.indexOf('=');
          if (eqIdx >= 0) {
            env.push({
              id: `env_${idx}`,
              key: str.slice(0, eqIdx),
              value: str.slice(eqIdx + 1),
              isSecret: str.toLowerCase().includes('pass') || str.toLowerCase().includes('secret')
            });
          }
        });
      }

      const volumes: VolumeMapping[] = [];
      if (Array.isArray(s.volumes)) {
        s.volumes.forEach((v: any, idx: number) => {
          const parts = String(v).split(':');
          if (parts.length >= 2) {
            volumes.push({
              id: `vol_${idx}`,
              hostPath: parts[0],
              containerPath: parts[1],
              type: parts[0].startsWith('.') || parts[0].startsWith('/') ? 'bind' : 'volume',
              readOnly: parts[2] === 'ro'
            });
          }
        });
      }

      const isBuild = !!s.build;
      const buildContext = typeof s.build === 'string' ? s.build : s.build?.context || (isBuild ? '.' : undefined);

      services.push({
        id: serviceId,
        name: serviceKey,
        displayName: s.container_name || serviceKey,
        category,
        image: s.image ? s.image.split(':')[0] : undefined,
        tag: s.image ? (s.image.split(':')[1] || 'latest') : undefined,
        icon,
        color,
        description: `Imported service: ${serviceKey}`,
        isCustomBuild: isBuild,
        buildContext,
        ports,
        expose: s.expose || [],
        networks: Array.isArray(s.networks) ? s.networks : ['app-network'],
        env,
        volumes,
        dependsOn: [],
        restart: s.restart || 'unless-stopped'
      });
    });

    Object.keys(servicesObj).forEach(serviceKey => {
      const s = servicesObj[serviceKey];
      const sourceId = serviceNameToIdMap.get(serviceKey);
      if (!sourceId || !s.depends_on) return;

      const sourceService = services.find(item => item.id === sourceId);
      if (!sourceService) return;

      if (Array.isArray(s.depends_on)) {
        s.depends_on.forEach((targetKey: string) => {
          const targetId = serviceNameToIdMap.get(targetKey);
          if (targetId) {
            sourceService.dependsOn.push({ serviceId: targetId, condition: 'service_started' });
            connections.push({ sourceId, targetId });
          }
        });
      }
    });

  } catch (err: any) {
    errors.push(`Failed to parse YAML: ${err.message || String(err)}`);
  }

  return { services, connections, errors };
}

export function parseDockerRunCommand(command: string): DockerService | null {
  const cleanCmd = command.replace(/\\/g, '').replace(/\n/g, ' ').trim();
  if (!cleanCmd.startsWith('docker run')) return null;

  const tokens = cleanCmd.split(/\s+/);
  let name = `container_${Date.now().toString(36)}`;
  let image = 'alpine:latest';
  const ports: PortMapping[] = [];
  const env: EnvVariable[] = [];
  const volumes: VolumeMapping[] = [];

  for (let i = 2; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === '--name' && tokens[i + 1]) {
      name = tokens[i + 1];
      i++;
    } else if ((token === '-p' || token === '--publish') && tokens[i + 1]) {
      const parts = tokens[i + 1].split(':');
      ports.push({
        id: `p_${Date.now()}_${i}`,
        hostPort: parts[0],
        containerPort: parts[1] || parts[0],
        protocol: 'tcp'
      });
      i++;
    } else if ((token === '-e' || token === '--env') && tokens[i + 1]) {
      const [k, ...v] = tokens[i + 1].split('=');
      env.push({
        id: `env_${Date.now()}_${i}`,
        key: k,
        value: v.join('='),
        isSecret: k.toLowerCase().includes('secret') || k.toLowerCase().includes('pass')
      });
      i++;
    } else if (!token.startsWith('-') && i === tokens.length - 1) {
      image = token;
    }
  }

  const [imgName, tag] = image.split(':');

  return {
    id: `svc_${Date.now()}`,
    name: name.replace(/[^a-zA-Z0-9_-]/g, '_'),
    displayName: name,
    category: 'custom',
    image: imgName,
    tag: tag || 'latest',
    icon: 'Box',
    color: '#64748B',
    description: `Imported from docker run: ${image}`,
    isCustomBuild: false,
    ports,
    expose: [],
    networks: ['app-network'],
    env,
    volumes,
    dependsOn: [],
    restart: 'unless-stopped'
  };
}
