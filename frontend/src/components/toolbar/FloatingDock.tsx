import React from 'react';
import { 
  Command, 
  LayoutGrid, 
  Layers, 
  Play, 
  Square, 
  Terminal, 
  Download, 
  ShieldCheck, 
  Upload, 
  Loader2,
  FolderArchive
} from 'lucide-react';
import { useDockerStore } from '../../store/useDockerStore';
import { runSecurityAndArchitectureAudit } from '../../engine/securityLinter';
import { exportProjectZip } from '../../engine/zipExporter';
import { toast } from '../ui/Toast';

export const FloatingDock: React.FC = () => {
  const { 
    services, 
    projectName,
    autoLayout, 
    setActiveModal, 
    isDeploying, 
    isStackRunning, 
    deployStackToDocker, 
    stopDockerStack,
    toggleTerminal,
    isTerminalOpen
  } = useDockerStore();

  const issues = runSecurityAndArchitectureAudit(services);
  const criticalCount = issues.filter(i => i.level === 'critical').length;
  const warningCount = issues.filter(i => i.level === 'warning').length;

  let score = 100 - (criticalCount * 35 + warningCount * 15);
  score = Math.max(0, Math.min(100, score));

  const handleExport = async () => {
    await exportProjectZip(services, projectName);
    toast.success('ZIP Export Generated', 'Download started');
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 p-1.5 rounded-2xl bg-theme-card/90 backdrop-blur-xl border border-theme-border/80 shadow-2xl transition-all hover:border-theme-accent/40 select-none">
      
      {/* ⌘K Trigger */}
      <button
        onClick={() => {
          const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
          window.dispatchEvent(event);
        }}
        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-theme-hover/80 hover:bg-theme-hover text-theme-text text-xs font-mono font-medium border border-theme-border/60 transition-colors shadow-sm"
        title="Open Command Palette (Ctrl+K)"
      >
        <Command className="w-3.5 h-3.5 text-theme-accent" />
        <span className="hidden sm:inline">Commands</span>
        <span className="text-[10px] text-theme-muted bg-theme-bg px-1 rounded border border-theme-border/40">
          ⌘K
        </span>
      </button>

      <div className="w-px h-5 bg-theme-border mx-0.5" />

      {/* Auto Layout */}
      <button
        onClick={() => {
          autoLayout();
          toast.success('Auto-Layout Applied');
        }}
        className="p-2 rounded-xl text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors"
        title="Auto-organize Canvas (L)"
      >
        <LayoutGrid className="w-4 h-4 text-purple-400" />
      </button>

      {/* Templates */}
      <button
        onClick={() => setActiveModal('templates')}
        className="p-2 rounded-xl text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors"
        title="Architecture Templates"
      >
        <Layers className="w-4 h-4 text-blue-400" />
      </button>

      {/* Import */}
      <button
        onClick={() => setActiveModal('import')}
        className="p-2 rounded-xl text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors"
        title="Import Docker Compose / CLI"
      >
        <Upload className="w-4 h-4 text-cyan-400" />
      </button>

      {/* Projects */}
      <button
        onClick={() => setActiveModal('projects')}
        className="p-2 rounded-xl text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors"
        title="Saved Stacks"
      >
        <FolderArchive className="w-4 h-4 text-theme-accent" />
      </button>

      <div className="w-px h-5 bg-theme-border mx-0.5" />

      {/* Security Audit Badge */}
      <button
        onClick={() => setActiveModal('security')}
        className="flex items-center space-x-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-theme-hover hover:bg-theme-hover/80 text-theme-text border border-theme-border/50 transition-colors"
        title="Stack Health & Security"
      >
        <ShieldCheck className={`w-3.5 h-3.5 ${score >= 90 ? 'text-emerald-400' : 'text-amber-400'}`} />
        <span className="font-mono text-[11px]">{score}%</span>
      </button>

      {/* Live Terminal Toggle */}
      <button
        onClick={toggleTerminal}
        className={`p-2 rounded-xl transition-colors ${
          isTerminalOpen
            ? 'bg-theme-accent/20 text-theme-accent border border-theme-accent/30'
            : 'text-theme-muted hover:text-theme-text hover:bg-theme-hover'
        }`}
        title="Toggle Live Docker Console"
      >
        <Terminal className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-theme-border mx-0.5" />

      {/* Run / Stop Local Stack */}
      {isStackRunning ? (
        <button
          onClick={stopDockerStack}
          disabled={isDeploying}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white transition-colors"
        >
          {isDeploying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5" />}
          <span>Stop</span>
        </button>
      ) : (
        <button
          onClick={deployStackToDocker}
          disabled={isDeploying}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white transition-colors shadow-sm"
        >
          {isDeploying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>Deploy</span>
        </button>
      )}

      {/* Export ZIP */}
      <button
        onClick={handleExport}
        className="p-2 rounded-xl text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors"
        title="Download ZIP"
      >
        <Download className="w-4 h-4 text-emerald-400" />
      </button>

    </div>
  );
};
