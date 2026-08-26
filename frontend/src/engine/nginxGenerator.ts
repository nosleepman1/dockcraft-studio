import { DockerService } from '../types/docker';

export function generateNginxConfig(services: DockerService[]): string {
  const backendServices = services.filter(s => s.category === 'backend' || s.category === 'custom');
  const frontendServices = services.filter(s => s.category === 'frontend');
  const aiServices = services.filter(s => s.category === 'ai');

  let upstreams = '';
  let locationBlocks = '';

  backendServices.forEach((b, idx) => {
    const port = b.ports[0]?.containerPort || 8000;
    const upstreamName = `upstream_${b.name}`;
    upstreams += `    upstream ${upstreamName} {\n        server ${b.name}:${port};\n        keepalive 32;\n    }\n\n`;

    const routePrefix = idx === 0 ? '/api/' : `/${b.name}/`;
    locationBlocks += `        # API Route for ${b.displayName}\n        location ${routePrefix} {\n            proxy_pass http://${upstreamName}/;\n            proxy_http_version 1.1;\n            proxy_set_header Upgrade \\$http_upgrade;\n            proxy_set_header Connection 'upgrade';\n            proxy_set_header Host \\$host;\n            proxy_set_header X-Real-IP \\$remote_addr;\n            proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;\n            proxy_set_header X-Forwarded-Proto \\$scheme;\n            proxy_read_timeout 90s;\n        }\n\n`;
  });

  aiServices.forEach(ai => {
    const port = ai.ports[0]?.containerPort || (ai.name.includes('ollama') ? 11434 : 6333);
    const upstreamName = `upstream_${ai.name}`;
    upstreams += `    upstream ${upstreamName} {\n        server ${ai.name}:${port};\n    }\n\n`;

    locationBlocks += `        # AI Engine Route for ${ai.displayName}\n        location /ai/ {\n            proxy_pass http://${upstreamName}/;\n            proxy_http_version 1.1;\n            proxy_set_header Host \\$host;\n            proxy_read_timeout 300s;\n        }\n\n`;
  });

  if (frontendServices.length > 0) {
    const primaryFrontend = frontendServices[0];
    const fePort = primaryFrontend.ports[0]?.containerPort || 3000;
    upstreams += `    upstream upstream_frontend {\n        server ${primaryFrontend.name}:${fePort};\n        keepalive 32;\n    }\n\n`;

    locationBlocks += `        # Frontend Web App Route\n        location / {\n            proxy_pass http://upstream_frontend;\n            proxy_http_version 1.1;\n            proxy_set_header Upgrade \\$http_upgrade;\n            proxy_set_header Connection "upgrade";\n            proxy_set_header Host \\$host;\n            proxy_set_header X-Real-IP \\$remote_addr;\n            proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;\n            proxy_set_header X-Forwarded-Proto \\$scheme;\n        }\n\n`;
  } else {
    locationBlocks += `        location / {\n            default_type text/plain;\n            return 200 "DockCraft Gateway is running!\\n";\n        }\n\n`;
  }

  return `# ==========================================
# DockCraft Nginx Gateway Configuration
# ==========================================

events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    access_log /var/log/nginx/access.log;
    error_log  /var/log/nginx/error.log warn;

    sendfile        on;
    keepalive_timeout 65;
    client_max_body_size 50M;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;

${upstreams}
    server {
        listen 80;
        server_name localhost;

        location /healthz {
            access_log off;
            default_type text/plain;
            return 200 "OK";
        }

${locationBlocks}
    }
}
`;
}
