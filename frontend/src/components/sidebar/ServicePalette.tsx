import React, { useState } from 'react';
import { 
  Search, 
  Database, 
  Server, 
  Globe, 
  Network, 
  Radio, 
  HardDrive, 
  Sparkles, 
  Box, 
  Plus,
  ChevronLeft,
  ChevronRight,
  Layers,
  Globe2
} from 'lucide-react';
import { SERVICE_CATALOG } from '../../catalog/serviceCatalog';
import { useDockerStore } from '../../store/useDockerStore';
import { ServiceCategory } from '../../types/docker';
import { toast } from '../ui/Toast';

const CATEGORY_TABS: { id: ServiceCategory | 'all'; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'All', icon: Layers },
  { id: 'database', label: 'Data', icon: Database },
  { id: 'backend', label: 'APIs', icon: Server },
  { id: 'frontend', label: 'Web', icon: Globe },
  { id: 'gateway', label: 'Proxy', icon: Network },
  { id: 'queue', label: 'Queues', icon: Radio },
  { id: 'ai', label: 'AI', icon: Sparkles },
  { id: 'tool', label: 'Tools', icon: HardDrive },
];

export const ServicePalette: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'all'>('all');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { addServiceFromCatalog, setActiveModal } = useDockerStore();

  const filteredServices = SERVICE_CATALOG.filter(service => {
    const matchesSearch = 
      service.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (service.image && service.image.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const onDragStart = (event: React.DragEvent, catalogId: string) => {
    event.dataTransfer.setData('application/dockcraft-service', catalogId);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleAdd = (service: typeof SERVICE_CATALOG[0]) => {
    addServiceFromCatalog(service);
    toast.success(`Added ${service.displayName}`, 'Node placed on canvas');
  };

  if (isCollapsed) {
    return (
      <div className="w-10 bg-theme-sidebar border-r border-theme-border flex flex-col items-center py-3 space-y-4 shrink-0 transition-all select-none">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-1.5 text-theme-muted hover:text-theme-text hover:bg-theme-hover rounded-lg transition-colors"
          title="Expand Service Catalog"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="text-[10px] font-mono font-semibold tracking-widest text-theme-muted uppercase rotate-90 whitespace-nowrap mt-10">
          CATALOG
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 bg-theme-sidebar border-r border-theme-border flex flex-col h-full shrink-0 transition-all z-10 select-none">
      {/* Header */}
      <div className="p-3 border-b border-theme-border flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-theme-text uppercase tracking-wider">
            Components
          </span>
          <span className="px-1.5 py-0.2 bg-theme-hover text-theme-muted rounded text-[10px] font-mono">
            {SERVICE_CATALOG.length}
          </span>
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 text-theme-muted hover:text-theme-text hover:bg-theme-hover rounded-lg transition-colors"
          title="Collapse"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-2.5 border-b border-theme-border space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-theme-muted" />
          <input
            type="text"
            placeholder="Search container..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2 py-1 bg-theme-bg border border-theme-border rounded-lg text-xs font-mono text-theme-text placeholder-theme-muted focus:outline-none focus:border-theme-accent transition-colors"
          />
        </div>

        <button
          onClick={() => setActiveModal('dockerhub')}
          className="w-full py-1 px-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/25 rounded-lg text-[11px] font-semibold flex items-center justify-center space-x-1.5 transition-colors"
        >
          <Globe2 className="w-3 h-3" />
          <span>Search Docker Hub</span>
        </button>
      </div>

      {/* Categories Tabs */}
      <div className="flex items-center px-2 py-1.5 gap-1 overflow-x-auto border-b border-theme-border no-scrollbar">
        {CATEGORY_TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap flex items-center space-x-1 transition-colors ${
                isActive
                  ? 'bg-theme-accent text-white font-semibold shadow-sm'
                  : 'text-theme-muted hover:text-theme-text hover:bg-theme-hover'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Compact Service List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
        {filteredServices.map(service => {
          return (
            <div
              key={service.catalogId}
              draggable
              onDragStart={(e) => onDragStart(e, service.catalogId)}
              className="group relative p-2.5 rounded-xl bg-theme-card/80 border border-theme-border/70 hover:border-theme-accent/50 hover:bg-theme-hover transition-all cursor-grab active:cursor-grabbing shadow-sm flex items-center justify-between"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 shadow-inner"
                  style={{ backgroundColor: `${service.color}20`, color: service.color }}
                >
                  <Box className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-theme-text truncate leading-tight">
                    {service.displayName}
                  </h4>
                  <span className="text-[10px] text-theme-muted font-mono block truncate">
                    {service.isCustomBuild ? 'Dockerfile' : `${service.image}:${service.tag || 'latest'}`}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleAdd(service)}
                title="Add to canvas"
                className="p-1 rounded-lg bg-theme-hover group-hover:bg-theme-accent text-theme-muted group-hover:text-white transition-colors shrink-0 ml-2"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
