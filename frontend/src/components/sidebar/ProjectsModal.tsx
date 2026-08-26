import React, { useEffect, useState } from 'react';
import { 
  X, 
  FolderArchive, 
  Save, 
  Trash2, 
  FolderOpen, 
  Clock, 
  Layers,
  Plus
} from 'lucide-react';
import { useDockerStore } from '../../store/useDockerStore';
import { api } from '../../api/client';

export const ProjectsModal: React.FC = () => {
  const { 
    activeModal, 
    setActiveModal, 
    savedProjects, 
    fetchSavedProjects, 
    loadProjectFromBackend,
    saveProjectToBackend,
    projectName,
    setProjectName,
    services
  } = useDockerStore();

  const [newProjectName, setNewProjectName] = useState(projectName);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (activeModal === 'projects') {
      fetchSavedProjects();
      setNewProjectName(projectName);
    }
  }, [activeModal, fetchSavedProjects, projectName]);

  if (activeModal !== 'projects') return null;

  const handleSave = async () => {
    if (!newProjectName.trim()) return;
    setIsSaving(true);
    setProjectName(newProjectName.trim());
    await saveProjectToBackend();
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this saved stack project?')) {
      await api.deleteProject(id);
      await fetchSavedProjects();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-theme-card border border-theme-border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-theme-border flex items-center justify-between bg-theme-header">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-theme-accent/20 text-theme-accent border border-theme-accent/30 flex items-center justify-center">
              <FolderArchive className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-theme-text">Saved Projects & Stacks</h2>
              <p className="text-xs text-theme-muted">Persisted in Go backend SQLite database</p>
            </div>
          </div>

          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 text-theme-muted hover:text-theme-text hover:bg-theme-hover rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Save Current Project Box */}
        <div className="p-4 border-b border-theme-border bg-theme-bg/60 flex items-center gap-3">
          <input
            type="text"
            placeholder="Stack project name..."
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-theme-card border border-theme-border rounded-lg text-xs font-mono text-theme-text focus:outline-none focus:border-theme-accent"
          />
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-1.5 bg-theme-accent hover:opacity-90 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shrink-0 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Current Stack'}</span>
          </button>
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
          {savedProjects.map((proj) => (
            <div
              key={proj.id}
              className="p-4 rounded-xl bg-theme-bg/80 border border-theme-border hover:border-theme-accent/50 transition-all flex items-center justify-between group"
            >
              <div className="min-w-0 flex-1 mr-4">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-bold text-theme-text truncate">{proj.name}</h4>
                  <span className="px-2 py-0.2 bg-theme-hover text-theme-muted rounded text-[10px] font-mono">
                    {proj.services ? proj.services.length : 0} services
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-[11px] text-theme-muted mt-1 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(proj.updatedAt || proj.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => loadProjectFromBackend(proj.id)}
                  className="px-3 py-1.5 bg-theme-hover hover:bg-theme-accent hover:text-white text-theme-text rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-theme-border"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Load</span>
                </button>
                <button
                  onClick={() => handleDelete(proj.id)}
                  className="p-1.5 text-theme-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {savedProjects.length === 0 && (
            <div className="text-center py-12 text-theme-muted text-xs">
              No saved stacks found. Name your stack above and click "Save Current Stack".
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
