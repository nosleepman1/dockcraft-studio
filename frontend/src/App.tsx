import React, { useEffect } from 'react';
import { Header } from './components/common/Header';
import { ServicePalette } from './components/sidebar/ServicePalette';
import { DockerCanvas } from './components/canvas/DockerCanvas';
import { ServiceInspector } from './components/inspector/ServiceInspector';
import { CodePreviewModal } from './components/preview/CodePreviewModal';
import { SecurityAuditModal } from './components/preview/SecurityAuditModal';
import { TemplateGalleryModal } from './components/sidebar/TemplateGalleryModal';
import { ImportComposeModal } from './components/importer/ImportComposeModal';
import { ProjectsModal } from './components/sidebar/ProjectsModal';
import { DockerHubModal } from './components/sidebar/DockerHubModal';
<<<<<<< HEAD
=======
import { ProjectScannerModal } from './components/scanner/ProjectScannerModal';
import { ProductionDeployModal } from './components/preview/ProductionDeployModal';
>>>>>>> bf34f7e (feat(frontend): implement visual ReactFlow canvas, magnetic glowing handles, bidirectional auto-wiring & live code generators)
import { LiveLogConsole } from './components/terminal/LiveLogConsole';
import { FloatingDock } from './components/toolbar/FloatingDock';
import { CommandPalette } from './components/command/CommandPalette';
import { WorkspaceSyncModal } from './components/workspace/WorkspaceSyncModal';
import { DirectoryPickerModal } from './components/workspace/DirectoryPickerModal';
import { ProjectsDashboard } from './components/dashboard/ProjectsDashboard';
import { ToastContainer, toast } from './components/ui/Toast';
import { useDockerStore } from './store/useDockerStore';

export const App: React.FC = () => {
  const { 
    selectedServiceId, 
    autoLayout, 
    toggleTerminal, 
    setActiveModal, 
    isDashboardOpen,
    openDashboard,
    closeDashboard,
    fetchSavedProjects
  } = useDockerStore();

  useEffect(() => {
    fetchSavedProjects();
  }, [fetchSavedProjects]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing inside inputs/textareas
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        if (isDashboardOpen) closeDashboard();
        else openDashboard();
      } else if (e.key.toLowerCase() === 'l' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        autoLayout();
        toast.info('Auto-Layout Applied');
      } else if (e.key.toLowerCase() === 't' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setActiveModal('templates');
<<<<<<< HEAD
=======
      } else if (e.key.toLowerCase() === 'u' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setActiveModal('scanner');
>>>>>>> bf34f7e (feat(frontend): implement visual ReactFlow canvas, magnetic glowing handles, bidirectional auto-wiring & live code generators)
      } else if (e.key.toLowerCase() === 'w' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setActiveModal('workspace_sync');
      } else if (e.key === '`' || e.key === '~') {
        e.preventDefault();
        toggleTerminal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [autoLayout, toggleTerminal, setActiveModal, isDashboardOpen, openDashboard, closeDashboard]);

  return (
    <div className="flex flex-col h-screen w-screen bg-theme-bg text-theme-text overflow-hidden select-none font-sans">
      {/* Top Header */}
      <Header />

      {/* Main Workspace Canvas */}
      <main className="flex flex-1 h-[calc(100vh-3rem)] relative overflow-hidden">
        <ServicePalette />

        <div className="flex-1 h-full relative">
          <DockerCanvas />
          {/* Floating Figma-style Dock Toolbar */}
          <FloatingDock />
        </div>

        {selectedServiceId && <ServiceInspector />}
      </main>

      {/* Projects & Multi-Flow Dashboard Hub */}
      {isDashboardOpen && <ProjectsDashboard />}

      {/* Live Docker Terminal Console */}
      <LiveLogConsole />

      {/* Command Palette (Ctrl+K) */}
      <CommandPalette />

      {/* Direct Disk Injection & Local Folder Navigation */}
      <WorkspaceSyncModal />
      <DirectoryPickerModal />

      {/* Micro-Animated Toast Notifications */}
      <ToastContainer />

      {/* Global Modals */}
<<<<<<< HEAD
=======
      <ProductionDeployModal />
      <ProjectScannerModal />
>>>>>>> bf34f7e (feat(frontend): implement visual ReactFlow canvas, magnetic glowing handles, bidirectional auto-wiring & live code generators)
      <CodePreviewModal />
      <SecurityAuditModal />
      <TemplateGalleryModal />
      <ImportComposeModal />
      <ProjectsModal />
      <DockerHubModal />
    </div>
  );
};

export default App;
