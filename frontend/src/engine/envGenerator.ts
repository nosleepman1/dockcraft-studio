import { DockerService } from '../types/docker';

export interface EnvGenerationResult {
  envContent: string;
  envExampleContent: string;
}

export function generateEnvFiles(services: DockerService[]): EnvGenerationResult {
  let env = `# ==========================================\n# DockCraft Environment Variables Configuration\n# ==========================================\n\n`;
  let example = `# ==========================================\n# DockCraft Environment Variables Template (.env.example)\n# ==========================================\n\n`;

  services.forEach(service => {
    if (service.env && service.env.length > 0) {
      env += `\n# [${service.displayName.toUpperCase()}]\n`;
      example += `\n# [${service.displayName.toUpperCase()}]\n`;

      service.env.forEach(v => {
        const comment = v.description ? ` # ${v.description}` : '';
        env += `${v.key}=${v.value}${comment}\n`;

        if (v.isSecret) {
          example += `${v.key}=your_${v.key.toLowerCase()}_here${comment}\n`;
        } else {
          example += `${v.key}=${v.value}${comment}\n`;
        }
      });
    }
  });

  return {
    envContent: env,
    envExampleContent: example,
  };
}
