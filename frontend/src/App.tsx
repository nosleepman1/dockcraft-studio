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
import { LiveLogConsole } from './components/terminal/LiveLogConsole';
import { FloatingDock } from './components/toolbar/FloatingDock';
import { CommandPalette } from './components/command/CommandPalette';
import { ToastContainer, toast } from './components/ui/Toast';
import { useDockerStore } from './store/useDockerStore';

export const App: React.FC = () => {
  const { selectedServiceId, autoLayout, toggleTerminal, setActiveModal } = useDockerStore();

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing inside inputs/textareas
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key.toLowerCase() === 'l' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        autoLayout();
        toast.info('Auto-Layout Applied');
      } else if (e.key.toLowerCase() === 't' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setActiveModal('templates');
      } else if (e.key === '`' || e.key === '~') {
        e.preventDefault();
        toggleTerminal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [autoLayout, toggleTerminal, setActiveModal]);

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

      {/* Live Docker Terminal Console */}
      <LiveLogConsole />

      {/* Command Palette (Ctrl+K) */}
      <CommandPalette />

      {/* Micro-Animated Toast Notifications */}
      <ToastContainer />

      {/* Global Modals */}
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
