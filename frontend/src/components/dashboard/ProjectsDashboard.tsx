import React, { useState } from 'react';
import { 
  Plus, 
  FolderOpen, 
  Search, 
  Layers, 
  HardDrive, 
  Clock, 
  Trash2, 
  Copy, 
  Download, 
  ArrowRight, 
  Sparkles,
  Server,
  FolderSync,
  Box,
  CheckCircle2,
  Play
} from 'lucide-react';
import { useDockerStore } from '../../store/useDockerStore';
import { ARCHITECTURE_TEMPLATES } from '../../catalog/templates';
import { exportProjectZip } from '../../engine/zipExporter';
import { toast } from '../ui/Toast';

export const ProjectsDashboard: React.FC = () => {
  const { 
    savedProjects, 
    currentProjectId, 
    switchProject, 
    deleteProject, 
    duplicateProject, 
    createNewProject, 
    loadTemplate, 
    closeDashboard,
    setActiveModal,
    projectName
  } = useDockerStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');

  const filteredProjects = savedProjects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim()) return;
    const newId = createNewProject(newProjectTitle.trim());
    setNewProjectTitle('');
    setIsCreating(false);
    toast.success('Project Created', newProjectTitle);
    closeDashboard();
  };

  const handleCreateFromTemplate = (templateId: string) => {
    const tpl = ARCHITECTURE_TEMPLATES.find(t => t.id === templateId);
    if (!tpl) return;
    createNewProject(tpl.name, templateId);
    toast.success('Project Created from Template', tpl.name);
    closeDashboard();
  };

  return (
    <div className="fixed inset-0 z-40 bg-theme-bg text-theme-text flex flex-col overflow-y-auto custom-scrollbar select-none animate-fadeIn">
      
      {/* Top Banner */}
      <header className="h-16 border-b border-theme-border/80 px-8 flex items-center justify-between bg-theme-header/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-md">
            <Box className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight text-theme-text">DockCraft Workspace</h1>
            <p className="text-[11px] text-theme-muted">Manage your Docker & Cloud Architectures</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-1.5 bg-theme-accent text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md hover:opacity-90 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Architecture</span>
          </button>

          <button
            onClick={() => {
              closeDashboard();
            }}
            className="px-4 py-1.5 bg-theme-hover text-theme-text border border-theme-border rounded-xl text-xs font-semibold hover:bg-theme-card transition-colors"
          >
            Back to Canvas
          </button>
        </div>
      </header>

      {/* Main Hub Content */}
      <div className="max-w-6xl w-full mx-auto p-8 space-y-8">
        
        {/* Quick Action Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Create Blank */}
          <div 
            onClick={() => setIsCreating(true)}
            className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-blue-500/30 hover:border-blue-500/60 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-theme-text group-hover:text-blue-400 transition-colors">
                New Blank Architecture
              </h3>
              <p className="text-xs text-theme-muted mt-1 leading-relaxed">
                Design custom microservices, databases, and APIs from scratch.
              </p>
            </div>
            <span className="text-[11px] text-blue-400 font-semibold flex items-center gap-1 mt-4">
              Create Stack <ArrowRight className="w-3 h-3" />
            </span>
          </div>

          {/* Open Local Folder */}
          <div 
            onClick={() => {
              closeDashboard();
              setActiveModal('directory_picker');
            }}
            className="p-5 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-teal-500/5 border border-cyan-500/30 hover:border-cyan-500/60 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <FolderSync className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-theme-text group-hover:text-cyan-400 transition-colors">
                Sync Local Folder
              </h3>
              <p className="text-xs text-theme-muted mt-1 leading-relaxed">
                Connect a project directory on your PC to inject Dockerfiles directly.
              </p>
            </div>
            <span className="text-[11px] text-cyan-400 font-semibold flex items-center gap-1 mt-4">
              Browse Machine <ArrowRight className="w-3 h-3" />
            </span>
          </div>

          {/* Starter Template */}
          <div 
            onClick={() => {
              closeDashboard();
              setActiveModal('templates');
            }}
            className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/30 hover:border-purple-500/60 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-theme-text group-hover:text-purple-400 transition-colors">
                Starter Stacks
              </h3>
              <p className="text-xs text-theme-muted mt-1 leading-relaxed">
                Fullstack, MERN, AI/RAG, and Event-driven microservices templates.
              </p>
            </div>
            <span className="text-[11px] text-purple-400 font-semibold flex items-center gap-1 mt-4">
              Browse Stacks <ArrowRight className="w-3 h-3" />
            </span>
          </div>

        </div>

        {/* Modal Inline: Create Project Form */}
        {isCreating && (
          <form onSubmit={handleCreate} className="p-5 rounded-2xl bg-theme-card border border-theme-accent shadow-xl flex items-center gap-3 animate-fadeIn">
            <input
              type="text"
              placeholder="Give your architecture project a name (e.g. My SaaS API)..."
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              autoFocus
              className="flex-1 px-4 py-2 bg-theme-bg border border-theme-border rounded-xl text-xs font-mono text-theme-text focus:outline-none focus:border-theme-accent"
            />
            <button
              type="submit"
              className="px-5 py-2 bg-theme-accent text-white rounded-xl text-xs font-bold"
            >
              Create Project
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 bg-theme-hover text-theme-text rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
          </form>
        )}

        {/* Projects Section Header */}
        <div className="flex items-center justify-between pt-4 border-t border-theme-border/60">
          <div>
            <h2 className="text-base font-bold text-theme-text">Your Saved Architectures</h2>
            <p className="text-xs text-theme-muted">Persisted in Go backend database</p>
          </div>

          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-theme-card border border-theme-border rounded-xl text-xs font-mono text-theme-text focus:outline-none focus:border-theme-accent"
            />
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((proj) => {
            const isCurrent = proj.id === currentProjectId;
            const servicesCount = proj.services ? proj.services.length : 0;
            const flowsCount = proj.flows ? proj.flows.length : 1;

            return (
              <div
                key={proj.id}
                onClick={() => {
                  switchProject(proj.id);
                  closeDashboard();
                }}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group shadow-sm ${
                  isCurrent
                    ? 'bg-theme-card border-theme-accent shadow-md ring-1 ring-theme-accent/30'
                    : 'bg-theme-card/80 border-theme-border hover:border-theme-accent/50 hover:bg-theme-hover'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded-md bg-theme-bg border border-theme-border text-[10px] font-mono text-theme-muted uppercase">
                      {flowsCount} Flow{flowsCount > 1 ? 's' : ''}
                    </span>

                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-theme-text group-hover:text-theme-accent transition-colors truncate">
                    {proj.name}
                  </h3>

                  <p className="text-xs text-theme-muted mt-1 line-clamp-2 leading-relaxed">
                    {proj.description || `${servicesCount} containers configured`}
                  </p>

                  {/* Badges of Services */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {proj.services?.slice(0, 4).map((s, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded bg-theme-bg border border-theme-border/60 text-[10px] font-mono text-theme-muted truncate max-w-[90px]"
                      >
                        {s.displayName || s.name}
                      </span>
                    ))}
                    {servicesCount > 4 && (
                      <span className="px-1.5 py-0.5 rounded bg-theme-bg border border-theme-border/60 text-[10px] font-mono text-theme-muted">
                        +{servicesCount - 4}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer of Card */}
                <div className="pt-4 mt-4 border-t border-theme-border/40 flex items-center justify-between text-[11px] text-theme-muted font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(proj.updatedAt || proj.createdAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => duplicateProject(proj.id)}
                      title="Duplicate project"
                      className="p-1.5 text-theme-muted hover:text-theme-text hover:bg-theme-hover rounded-lg transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteProject(proj.id)}
                      title="Delete project"
                      className="p-1.5 text-theme-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}

          {filteredProjects.length === 0 && (
            <div className="col-span-full text-center py-16 text-theme-muted text-xs border border-dashed border-theme-border rounded-2xl">
              No architecture projects found. Click "New Architecture" above to get started.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
