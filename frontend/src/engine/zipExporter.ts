import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { DockerService } from '../types/docker';
import { generateDockerComposeYaml } from './composeGenerator';
import { generateDockerfileForService } from './dockerfileGenerator';
import { generateNginxConfig } from './nginxGenerator';
import { generateEnvFiles } from './envGenerator';
import { generateStartScriptSh, generateStartScriptPs1, generateReadmeMd } from './scriptGenerator';

export async function exportProjectZip(services: DockerService[], projectName: string = 'dockcraft-stack'): Promise<void> {
  const zip = new JSZip();

  const composeYaml = generateDockerComposeYaml(services);
  zip.file('docker-compose.yml', composeYaml);

  const { envContent, envExampleContent } = generateEnvFiles(services);
  zip.file('.env', envContent);
  zip.file('.env.example', envExampleContent);

  const hasGatewayOrWeb = services.some(s => s.category === 'gateway' || s.image?.includes('nginx'));
  if (hasGatewayOrWeb || services.some(s => s.category === 'backend' && services.some(f => f.category === 'frontend'))) {
    const nginxConf = generateNginxConfig(services);
    zip.file('nginx/nginx.conf', nginxConf);
  }

  services.forEach(service => {
    if (service.isCustomBuild) {
      const generated = generateDockerfileForService(service);
      const folder = service.name;
      zip.file(`${folder}/Dockerfile`, generated.dockerfileContent);
      zip.file(`${folder}/.dockerignore`, generated.dockerignoreContent);
    }
  });

  const startSh = generateStartScriptSh(services);
  const startPs1 = generateStartScriptPs1(services);
  const readmeMd = generateReadmeMd(services);

  zip.file('start.sh', startSh);
  zip.file('start.ps1', startPs1);
  zip.file('README.md', readmeMd);

  const blob = await zip.generateAsync({ type: 'blob' });
  const filename = `${projectName.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}.zip`;
  saveAs(blob, filename);
}
