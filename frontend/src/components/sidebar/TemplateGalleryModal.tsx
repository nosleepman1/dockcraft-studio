import React, { useState } from 'react';
import { 
  X, 
  Layers, 
  Sparkles, 
  ArrowRight, 
  Database, 
  Server, 
  Network, 
  Code,
  Search,
  Flame,
  Zap,
  Shield,
  Cpu,
  Plus
} from 'lucide-react';
import { useDockerStore } from '../../store/useDockerStore';
import { ARCHITECTURE_TEMPLATES } from '../../catalog/templates';
import { toast } from '../ui/Toast';

const ICON_MAP: Record<string, React.ElementType> = {
  Layers,
  Sparkles,
  Code,
  Network,
  Database,
  Server,
  Flame,
  Zap,
  Shield,
  Cpu,
};

export const TemplateGalleryModal: React.FC = () => {
  const { activeModal, setActiveModal, loadTemplate, createNewProject } = useDockerStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  if (activeModal !== 'templates') return null;

  const categories = ['All', 'Fullstack Web', 'Enterprise Java', 'High Performance', 'Microservices', 'AI & Data'];

  const filteredTemplates = ARCHITECTURE_TEMPLATES.filter(tpl => {
    const matchesSearch = 
      tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || tpl.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleApplyToCanvas = (tplId: string, tplName: string) => {
    loadTemplate(tplId);
    toast.success('Template Loaded', tplName);
  };

  const handleCreateNewProject = (tplId: string, tplName: string) => {
    createNewProject(tplName, tplId);
    setActiveModal(null);
    toast.success('Project Created from Template', tplName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-theme-card border border-theme-border rounded-2xl w-full max-w-5xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-theme-border flex items-center justify-between bg-theme-header">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-theme-text">Architecture Starter Stacks</h2>
              <p className="text-xs text-theme-muted">Battle-tested production stacks with auto-wired ports, environment variables & networks</p>
            </div>
          </div>

          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 text-theme-muted hover:text-theme-text hover:bg-theme-hover rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="p-4 border-b border-theme-border bg-theme-bg/60 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-muted" />
              <input
                type="text"
                placeholder="Search templates by framework, database or tag (e.g. Laravel, Spring Boot, React, NestJS, Postgres, Redis)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-4 py-2 bg-theme-card border border-theme-border rounded-xl text-xs font-mono text-theme-text focus:outline-none focus:border-theme-accent shadow-inner"
              />
            </div>
            <span className="text-xs text-theme-muted font-mono shrink-0">
              {filteredTemplates.length} Stack{filteredTemplates.length > 1 ? 's' : ''} available
            </span>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-theme-accent text-white shadow-sm'
                    : 'bg-theme-card hover:bg-theme-hover text-theme-muted hover:text-theme-text border border-theme-border'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4 custom-scrollbar">
          {filteredTemplates.map(tpl => {
            const Icon = ICON_MAP[tpl.icon] || Layers;

            return (
              <div
                key={tpl.id}
                className="p-5 rounded-2xl bg-theme-bg/80 border border-theme-border hover:border-theme-accent/50 hover:bg-theme-hover/60 transition-all flex flex-col justify-between group shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-xl bg-theme-accent/15 text-theme-accent flex items-center justify-center border border-theme-accent/30 shadow-sm">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-semibold text-theme-accent uppercase tracking-wider">
                        {tpl.category}
                      </span>
                    </div>
                    <span className="text-[11px] text-theme-muted font-mono px-2 py-0.5 rounded bg-theme-card border border-theme-border">
                      {tpl.services.length} Containers
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-theme-text group-hover:text-theme-accent transition-colors">
                    {tpl.name}
                  </h3>
                  <p className="text-xs text-theme-muted mt-2 leading-relaxed">
                    {tpl.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {tpl.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-theme-card text-theme-text rounded-md text-[10px] font-mono border border-theme-border/60"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-theme-border flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleApplyToCanvas(tpl.id, tpl.name)}
                    className="px-3 py-1.5 bg-theme-card hover:bg-theme-hover text-theme-text border border-theme-border rounded-xl text-xs font-semibold transition-colors"
                  >
                    Replace Canvas
                  </button>

                  <button
                    onClick={() => handleCreateNewProject(tpl.id, tpl.name)}
                    className="px-4 py-1.5 bg-theme-accent text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md hover:opacity-90 transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create as Project</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredTemplates.length === 0 && (
            <div className="col-span-full text-center py-16 text-theme-muted text-xs border border-dashed border-theme-border rounded-2xl">
              No template found matching "{searchQuery}". Try searching for another framework or database.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
