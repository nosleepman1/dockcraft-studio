import React, { useState } from 'react';
import { 
  X, 
  FolderSync, 
  HardDrive, 
  Folder, 
  FileCode, 
  FileText, 
  Check, 
  Play, 
  Sparkles, 
  ChevronRight, 
  Edit3, 
  ArrowRight,
  Server,
  Download,
  Terminal,
  Layers,
  Loader2
} from 'lucide-react';
import { useDockerStore } from '../../store/useDockerStore';
import { toast } from '../ui/Toast';

export const WorkspaceSyncModal: React.FC = () => {
  const { 
    services, 
    activeModal, 
    setActiveModal, 
    targetProjectPath, 
    setTargetProjectPath,
    serviceTargetFolders,
    setServiceTargetFolder,
    injectStackToDisk,
    deployStackAtCustomPath,
    isDeploying
  } = useDockerStore();

  const [isInjecting, setIsInjecting] = useState(false);

  if (activeModal !== 'workspace_sync') return null;

  const customServices = services.filter(s => s.isCustomBuild);

  const handleInject = async () => {
    setIsInjecting(true);
    const ok = await injectStackToDisk();
    setIsInjecting(false);
    if (ok) {
      setActiveModal(null);
    }
  };

  const handleDeploy = async () => {
    setActiveModal(null);
    await deployStackAtCustomPath();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-theme-card border border-theme-border rounded-2xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-theme-border flex items-center justify-between bg-theme-header">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-md">
              <FolderSync className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-theme-text">Direct Disk Injection & Placement</h2>
              <p className="text-xs text-theme-muted">Inject docker-compose, .env, and Dockerfiles straight into your local workspace</p>
            </div>
          </div>

          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 text-theme-muted hover:text-theme-text hover:bg-theme-hover rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Working Directory Selection Box */}
        <div className="p-5 border-b border-theme-border bg-theme-bg/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-theme-text uppercase tracking-wider flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-theme-accent" />
              <span>Target Project Root Directory on Machine</span>
            </span>

            <button
              onClick={() => setActiveModal('directory_picker')}
              className="px-3 py-1 bg-theme-hover hover:bg-theme-card text-theme-text border border-theme-border rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
            >
              <Folder className="w-3.5 h-3.5 text-amber-400" />
              <span>Browse Computer...</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={targetProjectPath}
              onChange={(e) => setTargetProjectPath(e.target.value)}
              placeholder="e.g. C:\Users\username\Desktop\my-project or /Users/username/my-project"
              className="flex-1 px-3.5 py-2 bg-theme-card border border-theme-border rounded-xl text-xs font-mono text-theme-text focus:outline-none focus:border-theme-accent shadow-inner"
            />
          </div>
          <span className="text-[11px] text-theme-muted block font-mono">
            `docker-compose.yml`, `.env`, and scripts will be placed at this root.
          </span>
        </div>

        {/* Content & Placement Config */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-xs">
          
          {/* Custom Services Placement */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-theme-text text-sm flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-400" />
                <span>Custom Dockerfile Subdirectory Placements ({customServices.length})</span>
              </h4>
              <span className="text-xs text-theme-muted font-mono">Choose folder for each app</span>
            </div>

            {customServices.length === 0 ? (
              <div className="p-4 rounded-xl border border-theme-border bg-theme-bg text-theme-muted text-xs text-center">
                All services in your canvas are pre-built public images (Postgres, Redis, etc.). No custom Dockerfiles required.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {customServices.map((service) => {
                  const currentFolder = serviceTargetFolders[service.id] || (service.category === 'frontend' ? 'frontend' : 'backend');
                  const fullDest = `${targetProjectPath}\\${currentFolder}\\Dockerfile`;

                  return (
                    <div
                      key={service.id}
                      className="p-4 rounded-xl bg-theme-bg/80 border border-theme-border hover:border-theme-accent/50 space-y-2.5 transition-all shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 min-w-0">
                          <div 
                            className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${service.color}22`, color: service.color }}
                          >
                            <FileCode className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-theme-text truncate text-xs">{service.displayName}</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                          {service.dockerfileType || 'Dockerfile'}
                        </span>
                      </div>

                      <div>
                        <label className="block text-[11px] text-theme-muted mb-1 font-mono">Destination Subfolder:</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={currentFolder}
                            onChange={(e) => setServiceTargetFolder(service.id, e.target.value.trim())}
                            className="flex-1 px-2.5 py-1 bg-theme-card border border-theme-border rounded-lg text-xs font-mono text-theme-text focus:outline-none focus:border-theme-accent"
                          />
                        </div>
                      </div>

                      {/* Quick Presets */}
                      <div className="flex items-center gap-1 text-[10px] font-mono">
                        <span className="text-theme-muted mr-1">Presets:</span>
                        {['backend', 'frontend', 'api', 'apps/web', 'services/auth'].map((preset) => (
                          <button
                            key={preset}
                            onClick={() => setServiceTargetFolder(service.id, preset)}
                            className="px-1.5 py-0.5 rounded bg-theme-card hover:bg-theme-hover text-theme-muted hover:text-theme-text border border-theme-border transition-colors"
                          >
                            {preset}
                          </button>
                        ))}
                      </div>

                      <div className="text-[10px] font-mono text-theme-muted truncate pt-1 border-t border-theme-border/40">
                        ↳ Will write to: <span className="text-emerald-400">{fullDest}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Files injection overview tree */}
          <div className="space-y-3">
            <h4 className="font-bold text-theme-text text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Files to be Written Directly to Disk</span>
            </h4>

            <div className="p-4 rounded-xl bg-theme-bg border border-theme-border space-y-1.5 font-mono text-xs text-theme-muted">
              <div className="flex items-center space-x-2 text-theme-text">
                <Folder className="w-3.5 h-3.5 text-amber-400" />
                <span>{targetProjectPath} (Root)</span>
              </div>
              <div className="pl-6 space-y-1 text-[11px]">
                <div className="flex items-center space-x-2 text-blue-400">
                  <FileCode className="w-3 h-3" />
                  <span>docker-compose.yml</span>
                </div>
                <div className="flex items-center space-x-2 text-amber-400">
                  <FileText className="w-3 h-3" />
                  <span>.env & .env.example</span>
                </div>
                <div className="flex items-center space-x-2 text-pink-400">
                  <FileText className="w-3 h-3" />
                  <span>README.md</span>
                </div>
                <div className="flex items-center space-x-2 text-cyan-400">
                  <Terminal className="w-3 h-3" />
                  <span>start.sh & start.ps1</span>
                </div>
                {customServices.map(s => {
                  const folder = serviceTargetFolders[s.id] || (s.category === 'frontend' ? 'frontend' : 'backend');
                  return (
                    <div key={s.id} className="flex items-center space-x-2 text-indigo-400">
                      <FileCode className="w-3 h-3" />
                      <span>{folder}/Dockerfile + .dockerignore ({s.displayName})</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-theme-border bg-theme-header flex items-center justify-between">
          <span className="text-xs text-theme-muted font-mono">
            Files written in 1-click without dialog prompts
          </span>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveModal(null)}
              className="px-4 py-2 bg-theme-hover text-theme-text rounded-xl text-xs font-medium transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleInject}
              disabled={isInjecting}
              className="px-4 py-2 bg-theme-card hover:bg-theme-hover text-theme-text border border-theme-border rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm"
            >
              {isInjecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FolderSync className="w-3.5 h-3.5 text-cyan-400" />}
              <span>⚡ Inject to Disk</span>
            </button>

            <button
              onClick={handleDeploy}
              disabled={isDeploying}
              className="px-5 py-2 bg-theme-accent hover:opacity-90 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md active:scale-95"
            >
              {isDeploying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>🚀 Inject & Launch Stack</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
