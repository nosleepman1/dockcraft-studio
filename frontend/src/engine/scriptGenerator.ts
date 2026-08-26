import { DockerService } from '../types/docker';

export function generateStartScriptSh(services: DockerService[]): string {
  let endpointsEcho = '';
  services.forEach(s => {
    if (s.ports && s.ports.length > 0) {
      endpointsEcho += `echo -e "\\033[36m  > ${s.displayName.padEnd(20)} : \\033[32mhttp://localhost:${s.ports[0].hostPort}\\033[0m"\n`;
    }
  });

  return `#!/usr/bin/env bash
set -e

CYAN="\\033[36m"
GREEN="\\033[32m"
YELLOW="\\033[33m"
RED="\\033[31m"
RESET="\\033[0m"

echo -e "\${CYAN}====================================================\${RESET}"
echo -e "\${CYAN}  🚀 Starting DockCraft Infrastructure Stack...\${RESET}"
echo -e "\${CYAN}====================================================\${RESET}"

if ! command -v docker &> /dev/null; then
    echo -e "\${RED}❌ Error: Docker is not installed or not in PATH.\${RESET}"
    exit 1
fi

if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo -e "\${YELLOW}⚠️ Copying .env.example to .env...\${RESET}"
        cp .env.example .env
    fi
fi

echo -e "\${GREEN}📦 Starting containers...\${RESET}"
docker compose up -d --build

echo -e "\n\${GREEN}✅ Stack is up and running!\${RESET}"
echo -e "\${CYAN}----------------------------------------------------\${RESET}"
echo -e "\${CYAN}📍 Active Service Endpoints:\${RESET}"
${endpointsEcho}
echo -e "\${CYAN}----------------------------------------------------\${RESET}"
`;
}

export function generateStartScriptPs1(services: DockerService[]): string {
  let endpointsEcho = '';
  services.forEach(s => {
    if (s.ports && s.ports.length > 0) {
      endpointsEcho += `Write-Host "  > ${s.displayName.padEnd(20)} : http://localhost:${s.ports[0].hostPort}" -ForegroundColor Green\n`;
    }
  });

  return `# DockCraft Stack Startup Script (Windows PowerShell)
$ErrorActionPreference = "Stop"

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "  🚀 Starting DockCraft Infrastructure Stack..." -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: Docker is not installed or running." -ForegroundColor Red
    Exit 1
}

if (-not (Test-Path .env) -and (Test-Path .env.example)) {
    Write-Host "⚠️ Copying .env.example to .env..." -ForegroundColor Yellow
    Copy-Item .env.example .env
}

Write-Host "📦 Starting containers..." -ForegroundColor Green
docker compose up -d --build

Write-Host ""
Write-Host "✅ Stack is up and running!" -ForegroundColor Green
Write-Host "----------------------------------------------------" -ForegroundColor Cyan
Write-Host "📍 Active Service Endpoints:" -ForegroundColor Cyan
${endpointsEcho}
Write-Host "----------------------------------------------------" -ForegroundColor Cyan
`;
}

export function generateReadmeMd(services: DockerService[]): string {
  let portsTable = `| Service | Container Name | Host Port | Internal Port | Category |\n| :--- | :--- | :--- | :--- | :--- |\n`;
  services.forEach(s => {
    const port = s.ports[0] ? `${s.ports[0].hostPort}` : 'N/A';
    const intPort = s.ports[0] ? `${s.ports[0].containerPort}` : 'N/A';
    portsTable += `| ${s.displayName} | \`${s.name}\` | \`${port}\` | \`${intPort}\` | ${s.category} |\n`;
  });

  return `# 🚀 DockCraft Infrastructure Stack

## 📋 Architecture Services

${portsTable}

## ⚡ Quick Start

### 1. Requirements
* Docker Desktop or Docker Engine + Docker Compose V2.

### 2. Launch
On Linux / macOS:
\`\`\`bash
chmod +x start.sh
./start.sh
\`\`\`

On Windows (PowerShell):
\`\`\`powershell
.\\start.ps1
\`\`\`

Or manually:
\`\`\`bash
cp .env.example .env
docker compose up -d --build
\`\`\`
`;
}
