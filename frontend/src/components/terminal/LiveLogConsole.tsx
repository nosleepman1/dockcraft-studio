import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Trash2, 
  ChevronDown, 
<<<<<<< HEAD
  ChevronUp, 
  Activity, 
  CheckCircle2, 
  AlertCircle,
  Maximize2,
  Minimize2,
  Search
} from 'lucide-react';
import { useDockerStore } from '../../store/useDockerStore';
import { logWebSocket } from '../../api/websocket';
=======
  Maximize2, 
  Minimize2, 
  Search,
  Activity,
  Layers
} from 'lucide-react';
import { useDockerStore } from '../../store/useDockerStore';
import { logWebSocket } from '../../api/websocket';
import { ContainerMetricsView } from './ContainerMetricsView';
>>>>>>> bf34f7e (feat(frontend): implement visual ReactFlow canvas, magnetic glowing handles, bidirectional auto-wiring & live code generators)

export const LiveLogConsole: React.FC = () => {
  const { 
    isTerminalOpen, 
    toggleTerminal, 
    liveLogs, 
    clearLogs, 
    addLogMessage, 
    isBackendConnected,
    isStackRunning
  } = useDockerStore();

<<<<<<< HEAD
=======
  const [activeTab, setActiveTab] = useState<'logs' | 'metrics'>('logs');
>>>>>>> bf34f7e (feat(frontend): implement visual ReactFlow canvas, magnetic glowing handles, bidirectional auto-wiring & live code generators)
  const [filterText, setFilterText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Connect WebSocket on mount
  useEffect(() => {
    logWebSocket.connect();
    const unsubscribe = logWebSocket.subscribe((msg) => {
      addLogMessage(msg);
    });
    return () => {
      unsubscribe();
    };
  }, [addLogMessage]);

  // Auto-scroll to bottom
  useEffect(() => {
<<<<<<< HEAD
    if (isTerminalOpen) {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [liveLogs, isTerminalOpen]);
=======
    if (isTerminalOpen && activeTab === 'logs') {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [liveLogs, isTerminalOpen, activeTab]);
>>>>>>> bf34f7e (feat(frontend): implement visual ReactFlow canvas, magnetic glowing handles, bidirectional auto-wiring & live code generators)

  if (!isTerminalOpen) {
    return (
      <button
        onClick={toggleTerminal}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-full bg-theme-card border border-theme-border text-theme-text hover:border-theme-accent text-xs font-mono font-medium shadow-2xl flex items-center space-x-2 transition-all hover:scale-105"
      >
        <Terminal className="w-3.5 h-3.5 text-theme-accent" />
        <span>Live Docker Console</span>
        <div className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
        {liveLogs.length > 0 && (
          <span className="px-1.5 py-0.2 bg-theme-hover text-theme-muted rounded text-[10px]">
            {liveLogs.length}
          </span>
        )}
      </button>
    );
  }

  const filteredLogs = liveLogs.filter((log) => {
    if (!filterText) return true;
    const text = log.content || log.message || '';
    return text.toLowerCase().includes(filterText.toLowerCase());
  });

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 bg-theme-card border-t border-theme-border shadow-2xl transition-all duration-200 flex flex-col ${
<<<<<<< HEAD
        isExpanded ? 'h-[65vh]' : 'h-64'
      }`}
    >
      {/* Console Topbar */}
      <div className="h-9 px-4 border-b border-theme-border bg-theme-header flex items-center justify-between select-none">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-theme-text">
            <Terminal className="w-3.5 h-3.5 text-theme-accent" />
            <span>Docker Engine Stream</span>
          </div>

          <div className="flex items-center space-x-1 text-[11px] text-theme-muted font-mono">
            <span className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-emerald-400' : 'bg-red-400'}`} />
            <span>{isBackendConnected ? 'Connected (ws://localhost:8080)' : 'Backend Disconnected'}</span>
=======
        isExpanded ? 'h-[65vh]' : 'h-72'
      }`}
    >
      {/* Console Topbar with Tab Switcher */}
      <div className="h-10 px-4 border-b border-theme-border bg-theme-header flex items-center justify-between select-none">
        <div className="flex items-center space-x-3">
          
          {/* Tab Buttons */}
          <div className="flex items-center bg-theme-bg rounded-lg p-0.5 border border-theme-border">
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition-colors ${
                activeTab === 'logs'
                  ? 'bg-theme-card text-theme-accent shadow-sm'
                  : 'text-theme-muted hover:text-theme-text'
              }`}
            >
              <Terminal className="w-3 h-3" />
              <span>Live Logs</span>
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition-colors ${
                activeTab === 'metrics'
                  ? 'bg-theme-card text-emerald-400 shadow-sm'
                  : 'text-theme-muted hover:text-theme-text'
              }`}
            >
              <Activity className="w-3 h-3" />
              <span>Container Stats</span>
            </button>
          </div>

          <div className="flex items-center space-x-1 text-[11px] text-theme-muted font-mono hidden sm:flex">
            <span className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-emerald-400' : 'bg-red-400'}`} />
            <span>{isBackendConnected ? 'Daemon Online' : 'Offline'}</span>
>>>>>>> bf34f7e (feat(frontend): implement visual ReactFlow canvas, magnetic glowing handles, bidirectional auto-wiring & live code generators)
          </div>

          {isStackRunning && (
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-mono">
              ● Stack Active
            </span>
          )}
        </div>

        {/* Console Controls */}
        <div className="flex items-center space-x-2">
<<<<<<< HEAD
          {/* Search Filter */}
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-theme-muted" />
            <input
              type="text"
              placeholder="Filter logs..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="pl-6 pr-2 py-0.5 bg-theme-bg border border-theme-border rounded text-[11px] font-mono text-theme-text focus:outline-none focus:border-theme-accent w-36"
            />
          </div>

          <button
            onClick={clearLogs}
            title="Clear logs"
            className="p-1 text-theme-muted hover:text-theme-text rounded hover:bg-theme-hover transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
=======
          {activeTab === 'logs' && (
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-theme-muted" />
              <input
                type="text"
                placeholder="Filter logs..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="pl-6 pr-2 py-0.5 bg-theme-bg border border-theme-border rounded text-[11px] font-mono text-theme-text focus:outline-none focus:border-theme-accent w-36"
              />
            </div>
          )}

          {activeTab === 'logs' && (
            <button
              onClick={clearLogs}
              title="Clear logs"
              className="p-1 text-theme-muted hover:text-theme-text rounded hover:bg-theme-hover transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
>>>>>>> bf34f7e (feat(frontend): implement visual ReactFlow canvas, magnetic glowing handles, bidirectional auto-wiring & live code generators)

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Minimize' : 'Maximize'}
            className="p-1 text-theme-muted hover:text-theme-text rounded hover:bg-theme-hover transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={toggleTerminal}
            title="Close console"
            className="p-1 text-theme-muted hover:text-theme-text rounded hover:bg-theme-hover transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

<<<<<<< HEAD
      {/* Log Output Area */}
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs custom-scrollbar bg-theme-bg/95 space-y-1">
        {filteredLogs.length === 0 ? (
          <div className="text-theme-muted/60 text-center py-10 text-[11px]">
            No log output yet. Click "Deploy Stack" to launch containers and stream live output.
          </div>
        ) : (
          filteredLogs.map((log, index) => {
            const isError = log.type === 'error' || log.content?.includes('Error') || log.content?.includes('FAIL');
            const isSystem = log.type === 'system';

            return (
              <div
                key={index}
                className={`leading-relaxed break-all ${
                  isError
                    ? 'text-red-400'
                    : isSystem
                    ? 'text-cyan-400 font-semibold'
                    : 'text-theme-text/90'
                }`}
              >
                <span className="text-theme-muted/50 select-none mr-2">
                  {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}
                </span>
                <span>{log.content || log.message}</span>
              </div>
            );
          })
        )}
        <div ref={logEndRef} />
=======
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3.5 font-mono text-xs custom-scrollbar bg-theme-bg/95">
        {activeTab === 'metrics' ? (
          <ContainerMetricsView />
        ) : (
          <div className="space-y-1">
            {filteredLogs.length === 0 ? (
              <div className="text-theme-muted/60 text-center py-10 text-[11px]">
                No log output yet. Click "Deploy" to launch containers and stream live output.
              </div>
            ) : (
              filteredLogs.map((log, index) => {
                const isError = log.type === 'error' || log.content?.includes('Error') || log.content?.includes('FAIL');
                const isSystem = log.type === 'system';

                return (
                  <div
                    key={index}
                    className={`leading-relaxed break-all ${
                      isError
                        ? 'text-red-400'
                        : isSystem
                        ? 'text-cyan-400 font-semibold'
                        : 'text-theme-text/90'
                    }`}
                  >
                    <span className="text-theme-muted/50 select-none mr-2">
                      {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}
                    </span>
                    <span>{log.content || log.message}</span>
                  </div>
                );
              })
            )}
            <div ref={logEndRef} />
          </div>
        )}
>>>>>>> bf34f7e (feat(frontend): implement visual ReactFlow canvas, magnetic glowing handles, bidirectional auto-wiring & live code generators)
      </div>
    </div>
  );
};
