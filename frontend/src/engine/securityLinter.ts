import { DockerService, SecurityIssue } from '../types/docker';

export function runSecurityAndArchitectureAudit(services: DockerService[]): SecurityIssue[] {
  const issues: SecurityIssue[] = [];

  // 1. Port Collisions
  const portToServices = new Map<number | string, string[]>();
  services.forEach(s => {
    s.ports.forEach(p => {
      if (p.hostPort) {
        const existing = portToServices.get(p.hostPort) || [];
        existing.push(s.displayName);
        portToServices.set(p.hostPort, existing);
      }
    });
  });

  portToServices.forEach((serviceNames, port) => {
    if (serviceNames.length > 1) {
      issues.push({
        id: `port_collision_${port}`,
        level: 'critical',
        title: `Host Port Conflict on Port ${port}`,
        message: `Services [${serviceNames.join(', ')}] are both trying to bind to host port ${port}.`,
        fixSuggestion: `Change the host port of one service (e.g. use ${Number(port) + 1}).`
      });
    }
  });

  // 2. Missing Volume on Databases
  services.forEach(s => {
    if (s.category === 'database' && s.name !== 'redis') {
      const hasVolume = s.volumes && s.volumes.some(v => v.type === 'volume' || v.containerPath.includes('data') || v.containerPath.includes('db'));
      if (!hasVolume) {
        issues.push({
          id: `missing_db_volume_${s.id}`,
          serviceId: s.id,
          level: 'warning',
          title: `No Persistent Volume on ${s.displayName}`,
          message: `${s.displayName} has no persistent Docker volume configured. All data will be destroyed if the container is recreated.`,
          fixSuggestion: `Add a persistent volume mapping (e.g. \`${s.name}_data:/var/lib/${s.name}/data\`).`,
          autoFixable: true
        });
      }
    }
  });

  // 3. Insecure Passwords
  const insecurePasswords = ['admin', 'root', 'password', '123456', 'postgres', 'secret', 'pass'];
  services.forEach(s => {
    s.env.forEach(e => {
      if (e.isSecret || e.key.toLowerCase().includes('password') || e.key.toLowerCase().includes('secret')) {
        if (insecurePasswords.includes(e.value.toLowerCase().trim())) {
          issues.push({
            id: `insecure_pwd_${s.id}_${e.key}`,
            serviceId: s.id,
            level: 'warning',
            title: `Weak Password for ${e.key} in ${s.displayName}`,
            message: `The value for "${e.key}" is set to a common default password ("${e.value}").`,
            fixSuggestion: `Generate a strong randomized token.`
          });
        }
      }
    });
  });

  // 4. depends_on healthcheck check
  services.forEach(s => {
    s.dependsOn.forEach(dep => {
      if (dep.condition === 'service_healthy') {
        const target = services.find(targetS => targetS.id === dep.serviceId);
        if (target && (!target.healthCheck || !target.healthCheck.enabled)) {
          issues.push({
            id: `missing_healthcheck_dep_${s.id}_${target.id}`,
            serviceId: s.id,
            level: 'warning',
            title: `Missing Healthcheck on Dependency: ${target.displayName}`,
            message: `${s.displayName} waits for "${target.displayName}" with condition: service_healthy, but ${target.displayName} has no healthcheck.`,
            fixSuggestion: `Enable healthcheck on ${target.displayName}.`
          });
        }
      }
    });
  });

  if (issues.filter(i => i.level === 'critical' || i.level === 'warning').length === 0 && services.length > 0) {
    issues.push({
      id: 'stack_healthy',
      level: 'success',
      title: 'Infrastructure Verified & Clean',
      message: `All ${services.length} services pass security checks.`
    });
  }

  return issues;
}
