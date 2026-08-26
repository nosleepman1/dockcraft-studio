import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  FileCode, 
  FileText, 
  Terminal, 
  Server,
  Layers,
  ChevronRight,
  Folder,
  File,
  Code2,
  Sparkles,
  Search,
  ExternalLink
} from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-docker';
import 'prismjs/components/prism-nginx';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-powershell';
import 'prismjs/components/prism-markdown';

import { useDockerStore } from '../../store/useDockerStore';
import { generateDockerComposeYaml } from '../../engine/composeGenerator';
import { generateDockerfileForService } from '../../engine/dockerfileGenerator';
import { generateNginxConfig } from '../../engine/nginxGenerator';
import { generateEnvFiles } from '../../engine/envGenerator';
import { generateStartScriptSh, generateStartScriptPs1, generateReadmeMd } from '../../engine/scriptGenerator';
import { exportProjectZip } from '../../engine/zipExporter';
import { toast } from '../ui/Toast';

interface VirtualFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  icon: React.ElementType;
  iconColor: string;
  badge?: string;
}

export const CodePreviewModal: React.FC = () => {
  const { 
    services, 
    activeModal, 
    setActiveModal, 
    projectName 
  } = useDockerStore();

  const [selectedFileId, setSelectedFileId] = useState<string>('compose');
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Generate all files
  const files: VirtualFile[] = useMemo(() => {
    const list: VirtualFile[] = [];

    // 1. docker-compose.yml
    list.push({
      id: 'compose',
      name: 'docker-compose.yml',
      path: '/docker-compose.yml',
      content: generateDockerComposeYaml(services),
      language: 'yaml',
      icon: Layers,
      iconColor: '#3B82F6',
      badge: 'Main Stack'
    });

    // 2. Dockerfiles for custom services
    services.filter(s => s.isCustomBuild).forEach(s => {
      const generated = generateDockerfileForService(s);
      list.push({
        id: `dockerfile_${s.id}`,
        name: `Dockerfile (${s.name})`,
        path: `/${s.name}/Dockerfile`,
        content: generated.dockerfileContent,
        language: 'docker',
        icon: Server,
        iconColor: '#6366F1',
        badge: s.dockerfileType || 'Runtime'
      });
    });

    // 3. nginx.conf
    const hasGateway = services.some(s => s.category === 'gateway' || s.image?.includes('nginx'));
    const hasFrontAndBack = services.some(s => s.category === 'backend') && services.some(f => f.category === 'frontend');
    if (hasGateway || hasFrontAndBack) {
      list.push({
        id: 'nginx',
        name: 'nginx.conf',
        path: '/nginx/nginx.conf',
        content: generateNginxConfig(services),
        language: 'nginx',
        icon: FileCode,
        iconColor: '#10B981',
        badge: 'Reverse Proxy'
      });
    }

    // 4. .env and .env.example
    const { envContent, envExampleContent } = generateEnvFiles(services);
    list.push({
      id: 'env',
      name: '.env',
      path: '/.env',
      content: envContent,
      language: 'bash',
      icon: FileText,
      iconColor: '#F59E0B',
      badge: 'Secrets'
    });

    list.push({
      id: 'env_example',
      name: '.env.example',
      path: '/.env.example',
      content: envExampleContent,
      language: 'bash',
      icon: FileText,
      iconColor: '#94A3B8',
      badge: 'Template'
    });

    // 5. Scripts (start.sh & start.ps1)
    list.push({
      id: 'start_sh',
      name: 'start.sh',
      path: '/start.sh',
      content: generateStartScriptSh(services),
      language: 'bash',
      icon: Terminal,
      iconColor: '#00D1B2',
      badge: 'Bash Runner'
    });

    list.push({
      id: 'start_ps1',
      name: 'start.ps1',
      path: '/start.ps1',
      content: generateStartScriptPs1(services),
      language: 'powershell',
      icon: Terminal,
      iconColor: '#38BDF8',
      badge: 'PowerShell'
    });

    // 6. README.md
    list.push({
      id: 'readme',
      name: 'README.md',
      path: '/README.md',
      content: generateReadmeMd(services),
      language: 'markdown',
      icon: FileText,
      iconColor: '#EC4899',
      badge: 'Docs'
    });

    return list;
  }, [services]);

  const activeFile = files.find(f => f.id === selectedFileId) || files[0];

  useEffect(() => {
    Prism.highlightAll();
  }, [selectedFileId, activeFile]);

  if (activeModal !== 'preview') return null;

  const handleCopy = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    toast.success('Copied to Clipboard', activeFile.name);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingle = () => {
    if (!activeFile) return;
    const blob = new Blob([activeFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFile.name.includes('/') ? activeFile.name.split('/').pop()! : activeFile.name.replace(/\s\(.*\)/, '');
    link.click();
    URL.revokeObjectURL(url);
    toast.info('File Downloaded', activeFile.name);
  };

  const lineCount = activeFile ? activeFile.content.split('\n').length : 0;
  const charCount = activeFile ? activeFile.content.length : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-theme-card border border-theme-border rounded-2xl w-full max-w-6xl h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Editor Chrome Topbar */}
        <div className="px-5 py-3 border-b border-theme-border flex items-center justify-between bg-theme-header">
          
          {/* Breadcrumb Path */}
          <div className="flex items-center space-x-2 text-xs font-mono text-theme-muted min-w-0">
            <div className="w-5 h-5 rounded-md bg-theme-accent/20 text-theme-accent flex items-center justify-center">
              <Code2 className="w-3.5 h-3.5" />
            </div>
            <span className="text-theme-text font-bold">{projectName}</span>
            <ChevronRight className="w-3.5 h-3.5 text-theme-muted/60 shrink-0" />
            <span className="text-theme-accent truncate">{activeFile.path}</span>
            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 bg-theme-hover border border-theme-border rounded text-theme-muted">
              {activeFile.language}
            </span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-theme-hover hover:bg-theme-card text-theme-text rounded-lg text-xs font-medium border border-theme-border transition-colors shadow-sm"
              title="Copy current file content"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownloadSingle}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-theme-hover hover:bg-theme-card text-theme-text rounded-lg text-xs font-medium border border-theme-border transition-colors shadow-sm"
              title="Download this single file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save File</span>
            </button>

            <button
              onClick={() => exportProjectZip(services, projectName)}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-theme-accent text-white rounded-lg text-xs font-bold shadow-md hover:opacity-90 transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download ZIP</span>
            </button>

            <div className="h-4 w-px bg-theme-border mx-1" />

            <button
              onClick={() => setActiveModal(null)}
              className="p-1.5 text-theme-muted hover:text-theme-text hover:bg-theme-hover rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Workspace Body: Left File Tree + Right Code Editor */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          
          {/* File Explorer Sidebar */}
          <div className="w-60 bg-theme-sidebar border-r border-theme-border flex flex-col shrink-0">
            <div className="p-3 border-b border-theme-border text-[11px] font-bold text-theme-muted uppercase tracking-wider flex items-center justify-between">
              <span>Stack Files ({files.length})</span>
              <Sparkles className="w-3 h-3 text-theme-accent" />
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {files.map((file) => {
                const Icon = file.icon;
                const isSelected = selectedFileId === file.id;

                return (
                  <button
                    key={file.id}
                    onClick={() => {
                      setSelectedFileId(file.id);
                      setCopied(false);
                    }}
                    className={`w-full p-2 rounded-xl text-left flex items-center justify-between transition-all text-xs font-mono ${
                      isSelected
                        ? 'bg-theme-accent/15 text-theme-text font-semibold border border-theme-accent/40 shadow-sm'
                        : 'text-theme-muted hover:text-theme-text hover:bg-theme-hover/70'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: file.iconColor }} />
                      <span className="truncate">{file.name}</span>
                    </div>
                    {file.badge && (
                      <span className="text-[9px] px-1.5 py-0.2 bg-theme-bg border border-theme-border/60 rounded text-theme-muted shrink-0 ml-1">
                        {file.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Code Display Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-theme-bg overflow-hidden">
            
            {/* Editor Status Bar */}
            <div className="px-4 py-1.5 border-b border-theme-border/60 bg-theme-card/50 flex items-center justify-between text-[11px] font-mono text-theme-muted">
              <div className="flex items-center space-x-4">
                <span>{lineCount} lines</span>
                <span>{(charCount / 1024).toFixed(1)} KB</span>
                <span>UTF-8</span>
              </div>
              <span className="text-theme-accent font-semibold">{activeFile.name}</span>
            </div>

            {/* Code Body with Line Numbers */}
            <div className="flex-1 overflow-auto custom-scrollbar flex">
              {/* Line Numbers Gutter */}
              <div className="py-4 pl-4 pr-3 select-none text-right font-mono text-xs text-theme-muted/40 border-r border-theme-border/40 bg-theme-sidebar/30 shrink-0 leading-[1.65]">
                {Array.from({ length: lineCount }).map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>

              {/* Code Content */}
              <div className="flex-1 p-4 font-mono text-xs select-text overflow-x-auto">
                <pre className="!bg-transparent !p-0 !m-0 !overflow-visible leading-[1.65]">
                  <code className={`language-${activeFile.language}`}>
                    {activeFile.content}
                  </code>
                </pre>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
