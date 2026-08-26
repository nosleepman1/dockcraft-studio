import React, { useState, useEffect } from 'react';
import { 
  X, 
  Folder, 
  HardDrive, 
  Home, 
  ChevronRight, 
  Plus, 
  Check, 
  ArrowLeft, 
  FolderPlus,
  Loader2,
  Monitor
} from 'lucide-react';
import { useDockerStore } from '../../store/useDockerStore';
import { api, FSDirEntry } from '../../api/client';
import { toast } from '../ui/Toast';

export const DirectoryPickerModal: React.FC = () => {
  const { 
    activeModal, 
    setActiveModal, 
    targetProjectPath, 
    setTargetProjectPath 
  } = useDockerStore();

  const [currentPath, setCurrentPath] = useState<string>(targetProjectPath || '');
  const [entries, setEntries] = useState<FSDirEntry[]>([]);
  const [roots, setRoots] = useState<FSDirEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingDir, setIsCreatingDir] = useState(false);
  const [newDirName, setNewDirName] = useState('');

  // Load roots & initial directory
  useEffect(() => {
    if (activeModal === 'directory_picker') {
      loadRoots();
      loadDirectory(targetProjectPath || undefined);
    }
  }, [activeModal, targetProjectPath]);

  const loadRoots = async () => {
    try {
      const r = await api.getFSRoots();
      setRoots(r);
    } catch (_) {}
  };

  const loadDirectory = async (path?: string) => {
    setIsLoading(true);
    try {
      const data = await api.browseFS(path);
      setCurrentPath(data.currentPath);
      setEntries(data.entries);
    } catch (err: any) {
      toast.error('Cannot access directory', err.message || String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDirName.trim()) return;

    try {
      const res = await api.createFSDir(currentPath, newDirName.trim());
      setNewDirName('');
      setIsCreatingDir(false);
      toast.success('Folder Created', res.path);
      await loadDirectory(res.path);
    } catch (err: any) {
      toast.error('Failed to create folder', err.message || String(err));
    }
  };

  const handleSelectCurrent = () => {
    setTargetProjectPath(currentPath);
    toast.success('Destination Selected', currentPath);
    setActiveModal('workspace_sync');
  };

  if (activeModal !== 'directory_picker') return null;

  // Split path for breadcrumbs
  const pathParts = currentPath.replace(/\\/g, '/').split('/').filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-theme-card border border-theme-border rounded-2xl w-full max-w-3xl h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-theme-border flex items-center justify-between bg-theme-header">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-theme-accent/20 text-theme-accent border border-theme-accent/30 flex items-center justify-center">
              <Folder className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-theme-text">Choose Project Working Directory</h3>
              <p className="text-[11px] text-theme-muted">Select where docker-compose.yml and Dockerfiles will be injected</p>
            </div>
          </div>

          <button
            onClick={() => setActiveModal('workspace_sync')}
            className="p-1.5 text-theme-muted hover:text-theme-text hover:bg-theme-hover rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Roots Bar */}
        <div className="px-4 py-2 border-b border-theme-border bg-theme-bg/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[10px] uppercase font-bold text-theme-muted mr-1 shrink-0">Quick Access:</span>
          {roots.map((root, i) => (
            <button
              key={i}
              onClick={() => loadDirectory(root.path)}
              className="px-2.5 py-1 rounded-lg text-xs font-mono bg-theme-card hover:bg-theme-hover text-theme-text border border-theme-border flex items-center space-x-1.5 shrink-0 transition-colors"
            >
              {root.name.includes('Desktop') ? <Monitor className="w-3 h-3 text-cyan-400" /> :
               root.name.includes('Disk') ? <HardDrive className="w-3 h-3 text-blue-400" /> :
               <Home className="w-3 h-3 text-purple-400" />}
              <span>{root.name}</span>
            </button>
          ))}
        </div>

        {/* Breadcrumb Path Bar */}
        <div className="px-4 py-2 border-b border-theme-border bg-theme-bg flex items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center space-x-1 overflow-x-auto custom-scrollbar flex-1 py-1">
            <button
              onClick={() => loadRoots()}
              className="text-theme-muted hover:text-theme-text shrink-0"
            >
              <HardDrive className="w-3.5 h-3.5" />
            </button>
            {pathParts.map((part, index) => {
              const subPath = pathParts.slice(0, index + 1).join('/');
              return (
                <React.Fragment key={index}>
                  <ChevronRight className="w-3 h-3 text-theme-muted/50 shrink-0" />
                  <button
                    onClick={() => loadDirectory(subPath.includes(':') ? subPath : `/${subPath}`)}
                    className="px-1.5 py-0.5 rounded hover:bg-theme-hover text-theme-text truncate shrink-0 max-w-[120px]"
                  >
                    {part}
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          <button
            onClick={() => setIsCreatingDir(!isCreatingDir)}
            className="px-2.5 py-1 bg-theme-hover hover:bg-theme-card text-theme-text border border-theme-border rounded-lg text-[11px] font-semibold flex items-center space-x-1 shrink-0 transition-colors"
          >
            <FolderPlus className="w-3 h-3 text-theme-accent" />
            <span>+ New Folder</span>
          </button>
        </div>

        {/* Create Folder Box (collapsible) */}
        {isCreatingDir && (
          <form onSubmit={handleCreateFolder} className="p-3 border-b border-theme-border bg-theme-accent/5 flex items-center gap-2">
            <input
              type="text"
              placeholder="New folder name..."
              value={newDirName}
              onChange={(e) => setNewDirName(e.target.value)}
              autoFocus
              className="flex-1 px-3 py-1.5 bg-theme-card border border-theme-border rounded-lg text-xs font-mono text-theme-text focus:outline-none focus:border-theme-accent"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-theme-accent text-white rounded-lg text-xs font-semibold"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingDir(false)}
              className="px-3 py-1.5 bg-theme-hover text-theme-text rounded-lg text-xs"
            >
              Cancel
            </button>
          </form>
        )}

        {/* Folder Explorer List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar text-xs font-mono">
          {isLoading ? (
            <div className="flex items-center justify-center h-48 text-theme-muted space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-theme-accent" />
              <span>Scanning local directories...</span>
            </div>
          ) : (
            entries.map((entry, idx) => (
              <div
                key={idx}
                onClick={() => loadDirectory(entry.path)}
                className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                  entry.isParent
                    ? 'bg-theme-hover/40 text-theme-muted hover:text-theme-text'
                    : 'bg-theme-bg/60 hover:bg-theme-hover border border-theme-border/60 hover:border-theme-accent/40 text-theme-text shadow-sm'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <Folder className={`w-4 h-4 shrink-0 ${entry.isParent ? 'text-theme-muted' : 'text-amber-400 fill-amber-400/20'}`} />
                  <span className="truncate">{entry.name}</span>
                </div>

                <ChevronRight className="w-3.5 h-3.5 text-theme-muted/50 shrink-0" />
              </div>
            ))
          )}

          {!isLoading && entries.length === 0 && (
            <div className="text-center py-12 text-theme-muted text-xs">
              Folder is empty or has no subdirectories. You can create a new folder or select this path directly.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-theme-border bg-theme-header flex items-center justify-between">
          <div className="text-xs text-theme-muted font-mono truncate mr-4">
            <span>Selected Path: </span>
            <strong className="text-theme-accent">{currentPath}</strong>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setActiveModal('workspace_sync')}
              className="px-3.5 py-1.5 bg-theme-hover text-theme-text rounded-lg text-xs font-medium"
            >
              Back
            </button>
            <button
              onClick={handleSelectCurrent}
              className="px-4 py-1.5 bg-theme-accent text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-md transition-all hover:opacity-90 active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Select this Working Folder</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
