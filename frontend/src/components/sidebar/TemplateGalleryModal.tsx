import React from 'react';
import { 
  X, 
  Layers, 
  Sparkles, 
  ArrowRight, 
  Database, 
  Server, 
  Network, 
  Code 
} from 'lucide-react';
import { useDockerStore } from '../../store/useDockerStore';
import { ARCHITECTURE_TEMPLATES } from '../../catalog/templates';

const ICON_MAP: Record<string, React.ElementType> = {
  Layers,
  Sparkles,
  Code,
  Network,
  Database,
  Server,
};

export const TemplateGalleryModal: React.FC = () => {
  const { activeModal, setActiveModal, loadTemplate } = useDockerStore();

  if (activeModal !== 'templates') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-theme-card border border-theme-border rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-theme-border flex items-center justify-between bg-theme-header">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-theme-accent/20 text-theme-accent border border-theme-accent/30 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-theme-text">Architecture Starter Stacks</h2>
              <p className="text-xs text-theme-muted">Tested fullstack architectures with automatic network & env wiring</p>
            </div>
          </div>

          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 text-theme-muted hover:text-theme-text hover:bg-theme-hover rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4 custom-scrollbar">
          {ARCHITECTURE_TEMPLATES.map(tpl => {
            const Icon = ICON_MAP[tpl.icon] || Layers;

            return (
              <div
                key={tpl.id}
                className="p-5 rounded-xl bg-theme-bg/80 border border-theme-border hover:border-theme-accent/50 hover:bg-theme-hover transition-all flex flex-col justify-between group shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-theme-accent/10 text-theme-accent flex items-center justify-center border border-theme-accent/20">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-semibold text-theme-accent uppercase tracking-wider">
                        {tpl.category}
                      </span>
                    </div>
                    <span className="text-xs text-theme-muted font-mono">
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
                        className="px-2 py-0.5 bg-theme-card text-theme-text rounded text-[10px] font-medium border border-theme-border"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-theme-border flex items-center justify-between">
                  <span className="text-[11px] text-theme-muted">Auto-wired networking & envs</span>
                  <button
                    onClick={() => loadTemplate(tpl.id)}
                    className="px-3.5 py-1.5 bg-theme-accent text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-md"
                  >
                    <span>Load Stack</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
