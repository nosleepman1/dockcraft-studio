import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Download, 
  FileCode, 
  Command, 
  Edit2, 
  Check, 
  Activity,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useDockerStore } from '../../store/useDockerStore';
import { exportProjectZip } from '../../engine/zipExporter';
import { ThemeSelector } from '../header/ThemeSelector';
import { toast } from '../ui/Toast';

export const Header: React.FC = () => {
  const { 
    projectName, 
    setProjectName, 
    services, 
    setActiveModal, 
    isBackendConnected,
    checkBackendHealth,
  } = useDockerStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(projectName);

  useEffect(() => {
    checkBackendHealth();
    const interval = setInterval(() => checkBackendHealth(), 5000);
    return () => clearInterval(interval);
  }, [checkBackendHealth]);

  const handleSaveName = () => {
    if (nameInput.trim()) {
      const clean = nameInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      setProjectName(clean);
      toast.info('Project Renamed', clean);
    }
    setIsEditingName(false);
  };

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
      
      {/* Brand & Project Name */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Box className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-xs tracking-tight text-theme-text">
            DockCraft <span className="text-[10px] text-theme-muted font-normal">Studio</span>
          </span>
        </div>

        <div className="h-3 w-px bg-theme-border" />

        {/* Project Name Editor */}
        <div className="flex items-center">
          {isEditingName ? (
            <div className="flex items-center space-x-1">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                autoFocus
                className="px-2 py-0.5 bg-theme-card border border-theme-accent rounded text-[11px] font-mono text-theme-text focus:outline-none"
              />
              <button onClick={handleSaveName} className="p-0.5 text-emerald-400">
                <Check className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => { setNameInput(projectName); setIsEditingName(true); }}
              className="flex items-center space-x-1 px-2 py-0.5 rounded hover:bg-theme-hover cursor-pointer text-[11px] font-mono text-theme-text group"
            >
              <span>{projectName}</span>
              <Edit2 className="w-2.5 h-2.5 text-theme-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>
      </div>

      {/* Center Search / ⌘K Trigger Button */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => {
            const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
            window.dispatchEvent(event);
          }}
          className="hidden md:flex items-center space-x-2 px-3 py-1 bg-theme-hover/60 hover:bg-theme-hover text-theme-muted hover:text-theme-text rounded-lg text-xs border border-theme-border/60 transition-all w-64 justify-between"
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

      {/* Right Controls: Theme Selector + View Code + Export */}
      <div className="flex items-center space-x-2">
        <ThemeSelector />

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
