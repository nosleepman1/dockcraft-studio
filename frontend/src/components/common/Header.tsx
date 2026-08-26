import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Download, 
  FileCode, 
  Command, 
<<<<<<< HEAD
  FolderSync
=======
  FolderSync,
  Rocket
>>>>>>> bf34f7e (feat(frontend): implement visual ReactFlow canvas, magnetic glowing handles, bidirectional auto-wiring & live code generators)
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useDockerStore } from '../../store/useDockerStore';
import { exportProjectZip } from '../../engine/zipExporter';
import { ThemeSelector } from '../header/ThemeSelector';
import { ProjectSwitcher } from '../header/ProjectSwitcher';
import { toast } from '../ui/Toast';

export const Header: React.FC = () => {
  const { 
    projectName, 
    services, 
    setActiveModal, 
    isBackendConnected,
    checkBackendHealth,
  } = useDockerStore();

  useEffect(() => {
    checkBackendHealth();
    const interval = setInterval(() => checkBackendHealth(), 5000);
    return () => clearInterval(interval);
  }, [checkBackendHealth]);

  const handleExportZip = async () => {
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.15 },
        colors: ['#1D63ED', '#00D1B2', '#8B5CF6', '#10B981']
      });
      await exportProjectZip(services, projectName);
      toast.success('ZIP Export Ready', `${projectName}.zip downloaded`);
    } catch (err) {
      toast.error('Export Failed', 'Check console for details');
    }
  };

  return (
    <header className="h-12 bg-theme-header border-b border-theme-border px-4 flex items-center justify-between select-none z-20 shrink-0 backdrop-blur-md">
      
      {/* Brand + Multi-Project Switcher & Flows */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Box className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-xs tracking-tight text-theme-text hidden sm:inline">
            DockCraft
          </span>
        </div>

        <div className="h-3 w-px bg-theme-border" />

        {/* Multi-Project & Flow Switcher Dropdown */}
        <ProjectSwitcher />
      </div>

      {/* Center Search / ⌘K Trigger Button */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => {
            const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
            window.dispatchEvent(event);
          }}
          className="hidden md:flex items-center space-x-2 px-3 py-1 bg-theme-hover/60 hover:bg-theme-hover text-theme-muted hover:text-theme-text rounded-lg text-xs border border-theme-border/60 transition-all w-60 justify-between"
        >
          <div className="flex items-center space-x-1.5">
            <Command className="w-3 h-3 text-theme-accent" />
            <span className="text-[11px]">Quick actions & services...</span>
          </div>
          <span className="text-[9px] font-mono px-1 py-0.2 bg-theme-bg border border-theme-border rounded">
            ⌘K
          </span>
        </button>

        {/* Engine status indicator */}
        <div className="flex items-center space-x-1.5 text-[11px] font-mono text-theme-muted">
          <span className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-emerald-400 shadow-sm shadow-emerald-500/50' : 'bg-slate-500'}`} />
          <span className="hidden lg:inline">{isBackendConnected ? 'Go Engine Ready' : 'Offline'}</span>
        </div>
      </div>

<<<<<<< HEAD
      {/* Right Controls: Theme Selector + Sync Disk + View Code + Export */}
      <div className="flex items-center space-x-2">
        <ThemeSelector />

=======
      {/* Right Controls: Theme Selector + Zero-Code Prod Pack + Sync Disk + View Code + Export */}
      <div className="flex items-center space-x-2">
        <ThemeSelector />

        {/* Zero-Code Production Deployment Pack */}
        <button
          onClick={() => setActiveModal('production_deploy')}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-cyan-500/20 hover:from-purple-500/30 hover:to-cyan-500/30 text-purple-300 border border-purple-500/30 transition-all shadow-sm active:scale-95"
          title="Generate Zero-Code Production Deployment Pack"
        >
          <Rocket className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">Prod Pack</span>
        </button>

>>>>>>> bf34f7e (feat(frontend): implement visual ReactFlow canvas, magnetic glowing handles, bidirectional auto-wiring & live code generators)
        <button
          onClick={() => setActiveModal('workspace_sync')}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-colors shadow-sm"
          title="Direct Disk Injection & Folder Mapping"
        >
          <FolderSync className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sync Disk</span>
        </button>

        <button
          onClick={() => setActiveModal('preview')}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-theme-card hover:bg-theme-hover text-theme-text border border-theme-border transition-colors shadow-sm"
        >
          <FileCode className="w-3.5 h-3.5 text-theme-accent" />
          <span className="hidden sm:inline">View Code</span>
        </button>

        <button
          onClick={handleExportZip}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-theme-accent text-white shadow-sm transition-all hover:opacity-90 active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>

    </header>
  );
};
