import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Plus, 
  Layers, 
  Palette, 
  FileCode, 
  Download, 
  Play, 
  Square, 
  ShieldCheck, 
  LayoutGrid, 
  Trash2, 
  Terminal, 
  Sparkles,
  Command,
  ArrowRight,
  Box,
  FolderSync
} from 'lucide-react';
import { useDockerStore } from '../../store/useDockerStore';
import { SERVICE_CATALOG } from '../../catalog/serviceCatalog';
import { ARCHITECTURE_TEMPLATES } from '../../catalog/templates';
import { THEMES, ThemeMode } from '../../themes/themeConfig';
import { toast } from '../ui/Toast';
import { exportProjectZip } from '../../engine/zipExporter';

interface CommandItem {
  id: string;
  category: 'Service' | 'Template' | 'Theme' | 'Action';
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  iconColor?: string;
  badge?: string;
  action: () => void;
}

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { 
    addServiceFromCatalog, 
    loadTemplate, 
    setTheme, 
    setActiveModal, 
    autoLayout, 
    clearCanvas, 
    deployStackToDocker, 
    stopDockerStack,
    toggleTerminal,
    services,
    projectName
  } = useDockerStore();

  // Keyboard shortcut listener (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build items list
  const allItems: CommandItem[] = [
    {
<<<<<<< HEAD
=======
      id: 'act_scan_repo',
      category: 'Action',
      title: 'Auto-Discovery: Scan Local Repository',
      subtitle: 'Inspect local code manifests (package.json, requirements.txt, composer.json) to reverse-engineer architecture',
      icon: Search,
      iconColor: '#10B981',
      badge: 'U',
      action: () => setActiveModal('scanner')
    },
    {
      id: 'act_harden_secrets',
      category: 'Action',
      title: 'Harden Secrets & Generate Crypto Keys',
      subtitle: 'Replace weak or default secrets with 32/64-byte high-entropy tokens',
      icon: Sparkles,
      iconColor: '#F59E0B',
      action: () => {
        useDockerStore.getState().hardenAllStackSecretsAction();
      }
    },
    {
      id: 'act_dockerhub_search',
      category: 'Action',
      title: 'Search Docker Hub Registry',
      subtitle: 'Discover and add public container images',
      icon: Box,
      iconColor: '#3B82F6',
      action: () => setActiveModal('dockerhub')
    },
    {
>>>>>>> bf34f7e (feat(frontend): implement visual ReactFlow canvas, magnetic glowing handles, bidirectional auto-wiring & live code generators)
      id: 'act_sync_disk',
      category: 'Action',
      title: 'Sync & Inject Directly to Disk',
      subtitle: 'Write docker-compose.yml and Dockerfiles directly into your project folder',
      icon: FolderSync,
      iconColor: '#06B6D4',
      badge: 'Ctrl+W',
      action: () => setActiveModal('workspace_sync')
    },
    {
      id: 'act_export_zip',
      category: 'Action',
      title: 'Export Stack as ZIP Bundle',
      subtitle: 'Downloads full docker-compose, Dockerfiles, and .env files',
      icon: Download,
      iconColor: '#3B82F6',
      badge: 'Enter',
      action: async () => {
        await exportProjectZip(services, projectName);
        toast.success('ZIP Export Ready', 'Project downloaded successfully');
      }
    },
    {
      id: 'act_view_code',
      category: 'Action',
      title: 'View Generated Source Code',
      subtitle: 'Inspect docker-compose.yml, Dockerfiles, and nginx.conf',
      icon: FileCode,
      iconColor: '#00D1B2',
      action: () => setActiveModal('preview')
    },
    {
      id: 'act_deploy_stack',
      category: 'Action',
      title: 'Deploy Stack to Local Docker Engine',
      subtitle: 'Executes docker compose up -d via Go backend',
      icon: Play,
      iconColor: '#10B981',
      action: () => {
        deployStackToDocker();
        toast.info('Deployment Initiated', 'Streaming live container logs...');
      }
    },
    {
      id: 'act_stop_stack',
      category: 'Action',
      title: 'Stop Local Docker Stack',
      subtitle: 'Executes docker compose down',
      icon: Square,
      iconColor: '#EF4444',
      action: () => {
        stopDockerStack();
        toast.warning('Stack Stopping', 'Stopping local containers');
      }
    },
    {
      id: 'act_auto_layout',
      category: 'Action',
      title: 'Auto Layout Canvas',
      subtitle: 'Automatically arranges services in clean architectural columns',
      icon: LayoutGrid,
      iconColor: '#8B5CF6',
      action: () => {
        autoLayout();
        toast.success('Canvas Reorganized', 'Nodes aligned into architectural tiers');
      }
    },
    {
      id: 'act_security_audit',
      category: 'Action',
      title: 'Run Security & Architecture Audit',
      subtitle: 'Check for port conflicts, insecure passwords, and data risks',
      icon: ShieldCheck,
      iconColor: '#10B981',
      action: () => setActiveModal('security')
    },
    {
      id: 'act_toggle_terminal',
      category: 'Action',
      title: 'Toggle Live Docker Terminal Stream',
      subtitle: 'Show / hide the streaming WebSocket console',
      icon: Terminal,
      iconColor: '#00D1B2',
      action: () => toggleTerminal()
    },

    // --- Services Catalog (Add node) ---
    ...SERVICE_CATALOG.map((cat) => ({
      id: `svc_${cat.catalogId}`,
      category: 'Service' as const,
      title: `Add ${cat.displayName}`,
      subtitle: cat.description,
      icon: Box,
      iconColor: cat.color,
      badge: cat.category,
      action: () => {
        addServiceFromCatalog(cat);
        toast.success(`Added ${cat.displayName}`, 'Node placed on architecture canvas');
      }
    })),

    // --- Architecture Templates ---
    ...ARCHITECTURE_TEMPLATES.map((tpl) => ({
      id: `tpl_${tpl.id}`,
      category: 'Template' as const,
      title: `Load Template: ${tpl.name}`,
      subtitle: tpl.description,
      icon: Layers,
      iconColor: '#3B82F6',
      badge: `${tpl.services.length} services`,
      action: () => {
        loadTemplate(tpl.id);
        toast.success('Template Loaded', `Applied stack: ${tpl.name}`);
      }
    })),

    // --- Themes ---
    ...Object.values(THEMES).map((th) => ({
      id: `theme_${th.id}`,
      category: 'Theme' as const,
      title: `Theme: ${th.name}`,
      subtitle: th.description,
      icon: Palette,
      iconColor: th.accentColor,
      badge: th.id === 'oled' ? '#000000' : th.category,
      action: () => {
        setTheme(th.id as ThemeMode);
        toast.info(`Theme Changed`, `Applied theme: ${th.name}`);
      }
    }))
  ];

  // Filter items
  const filteredItems = allItems.filter((item) => {
    const text = `${item.title} ${item.subtitle || ''} ${item.category}`.toLowerCase();
    return text.includes(query.toLowerCase());
  });

  const handleSelect = (item: CommandItem) => {
    item.action();
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-theme-card border border-theme-border rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[60vh]"
      >
        {/* Search Header */}
        <div className="p-3.5 border-b border-theme-border flex items-center gap-3 bg-theme-header">
          <Command className="w-4 h-4 text-theme-accent shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, service name, template, or theme..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none text-xs font-mono text-theme-text placeholder-theme-muted focus:outline-none"
          />
          <span className="text-[10px] font-mono text-theme-muted px-1.5 py-0.5 bg-theme-hover border border-theme-border rounded">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar text-xs">
          {filteredItems.map((item, idx) => {
            const isSelected = selectedIndex === idx;
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-theme-hover text-theme-text border border-theme-accent/30 shadow-sm'
                    : 'text-theme-muted hover:text-theme-text'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${item.iconColor || '#3B82F6'}22`, color: item.iconColor || '#3B82F6' }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-semibold text-theme-text text-xs truncate leading-tight">
                      {item.title}
                    </h5>
                    {item.subtitle && (
                      <p className="text-[10px] text-theme-muted truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 ml-2">
                  {item.badge && (
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 bg-theme-bg border border-theme-border rounded text-theme-muted">
                      {item.badge}
                    </span>
                  )}
                  {isSelected && <ArrowRight className="w-3.5 h-3.5 text-theme-accent" />}
                </div>
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="text-center py-10 text-theme-muted text-xs">
              No matching commands or services found for "{query}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-theme-border bg-theme-header flex items-center justify-between text-[11px] text-theme-muted font-mono">
          <div className="flex items-center space-x-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <span>DockCraft Command Bar</span>
        </div>

      </div>
    </div>
  );
};
