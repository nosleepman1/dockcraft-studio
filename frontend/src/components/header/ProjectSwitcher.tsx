import React, { useState, useRef, useEffect } from 'react';
import { 
  Folder, 
  ChevronDown, 
  Plus, 
  LayoutDashboard, 
  Check, 
  Layers, 
  Sparkles,
  Edit2,
  Trash2,
  Boxes
} from 'lucide-react';
import { useDockerStore } from '../../store/useDockerStore';
import { toast } from '../ui/Toast';

export const ProjectSwitcher: React.FC = () => {
  const { 
    projectName, 
    savedProjects, 
    currentProjectId, 
    switchProject, 
    createNewProject, 
    openDashboard,
    currentFlowId,
    switchFlow,
    createFlow,
    deleteFlow
  } = useDockerStore();

  const [isOpen, setIsOpen] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsCreatingProject(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createNewProject(newTitle.trim());
    setNewTitle('');
    setIsCreatingProject(false);
    setIsOpen(false);
    toast.success('Project Created', newTitle.trim());
  };

  const handleAddFlow = () => {
    const name = prompt('Enter new flow name (e.g. staging, testing, worker):');
    if (name && name.trim()) {
      createFlow(name.trim().toLowerCase());
    }
  };

  // Find active project flows
  const activeProj = savedProjects.find(p => p.id === currentProjectId);
  const flows = activeProj?.flows || [
    { id: 'dev', name: 'dev', services: [] },
    { id: 'prod', name: 'prod', services: [] }
  ];

  return (
    <div className="flex items-center space-x-2 select-none" ref={dropdownRef}>
      
      {/* Dashboard Hub button */}
      <button
        onClick={openDashboard}
        className="p-1.5 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-hover border border-theme-border/60 transition-colors"
        title="Open Workspace Dashboard (All Projects)"
      >
        <LayoutDashboard className="w-3.5 h-3.5 text-theme-accent" />
      </button>

      {/* Project Switcher Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-theme-hover/70 hover:bg-theme-hover text-theme-text border border-theme-border/60 text-xs font-semibold transition-colors group"
        >
          <Folder className="w-3.5 h-3.5 text-amber-400" />
          <span className="max-w-[130px] truncate">{projectName}</span>
          <ChevronDown className="w-3 h-3 text-theme-muted group-hover:text-theme-text transition-transform" />
        </button>

        {isOpen && (
          <div className="absolute left-0 mt-2 w-64 bg-theme-card border border-theme-border rounded-xl shadow-2xl z-50 p-2 space-y-1 animate-fadeIn">
            <div className="px-2 py-1 border-b border-theme-border mb-1 flex items-center justify-between text-[10px] font-bold text-theme-muted uppercase tracking-wider">
              <span>Switch Architecture</span>
              <button
                onClick={openDashboard}
                className="text-theme-accent hover:underline lowercase"
              >
                view all
              </button>
            </div>

            {/* Projects List */}
            <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
              {savedProjects.map((p) => {
                const isSelected = p.id === currentProjectId;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      switchProject(p.id);
                      setIsOpen(false);
                    }}
                    className={`w-full p-2 rounded-lg text-left flex items-center justify-between text-xs font-mono transition-colors ${
                      isSelected
                        ? 'bg-theme-accent/20 text-theme-text font-bold border border-theme-accent/40'
                        : 'text-theme-muted hover:text-theme-text hover:bg-theme-hover'
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{p.name}</span>
                    </div>
                    {isSelected && <Check className="w-3 h-3 text-theme-accent shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Create New Project inline */}
            {isCreatingProject ? (
              <form onSubmit={handleCreateProject} className="pt-2 border-t border-theme-border space-y-1.5">
                <input
                  type="text"
                  placeholder="New project title..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                  className="w-full px-2.5 py-1 bg-theme-bg border border-theme-border rounded-lg text-xs font-mono text-theme-text focus:outline-none focus:border-theme-accent"
                />
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => setIsCreatingProject(false)}
                    className="px-2 py-0.5 text-[10px] text-theme-muted hover:text-theme-text"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-2.5 py-0.5 bg-theme-accent text-white rounded text-[10px] font-bold"
                  >
                    Create
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsCreatingProject(true)}
                className="w-full p-2 rounded-lg text-left flex items-center space-x-2 text-xs font-semibold text-theme-accent hover:bg-theme-hover transition-colors pt-2 border-t border-theme-border"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Project</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="h-3 w-px bg-theme-border" />

      {/* Flows / Environment Switcher Pills */}
      <div className="flex items-center bg-theme-bg/80 border border-theme-border rounded-lg p-0.5 gap-0.5">
        {flows.map((flow) => {
          const isActive = (currentFlowId || 'dev') === flow.id;
          return (
            <button
              key={flow.id}
              onClick={() => switchFlow(flow.id)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase transition-all ${
                isActive
                  ? 'bg-theme-accent text-white shadow-sm'
                  : 'text-theme-muted hover:text-theme-text hover:bg-theme-hover'
              }`}
            >
              {flow.name}
            </button>
          );
        })}

        <button
          onClick={handleAddFlow}
          className="px-1.5 py-0.5 text-theme-muted hover:text-theme-text text-[10px] rounded hover:bg-theme-hover"
          title="Add new flow / environment"
        >
          +
        </button>
      </div>

    </div>
  );
};
