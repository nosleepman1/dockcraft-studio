import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  RotateCw, 
  Square, 
  Terminal, 
  Cpu, 
  HardDrive, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useDockerStore } from '../../store/useDockerStore';
import { api, ContainerStat } from '../../api/client';
import { toast } from '../ui/Toast';

export const ContainerMetricsView: React.FC = () => {
  const { isStackRunning } = useDockerStore();
  const [stats, setStats] = useState<ContainerStat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [restartingId, setRestartingId] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const data = await api.getContainerStats();
      setStats(data);
    } catch (_) {}
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleRestart = async (containerName: string) => {
    setRestartingId(containerName);
    try {
      await api.restartContainer(containerName);
      toast.success('Container Restarted', containerName);
      await fetchStats();
    } catch (err: any) {
      toast.error('Restart Failed', err.message || String(err));
    } finally {
      setRestartingId(null);
    }
  };

  return (
    <div className="space-y-4 text-xs font-mono select-none">
      
      {/* Metrics Bar Header */}
      <div className="flex items-center justify-between pb-2 border-b border-theme-border/60">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="font-bold text-theme-text text-xs">Active Containers Performance ({stats.length})</span>
        </div>

        <button
          onClick={() => {
            setIsLoading(true);
            fetchStats().then(() => setIsLoading(false));
          }}
          className="p-1 text-theme-muted hover:text-theme-text hover:bg-theme-hover rounded transition-colors"
          title="Refresh metrics"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Grid of Container Performance Cards */}
      {stats.length === 0 ? (
        <div className="py-8 text-center text-theme-muted text-xs">
          No live container stats detected. Deploy your stack to see real-time CPU & RAM metrics.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {stats.map((c) => {
            const cpuVal = parseFloat(c.cpuPerc.replace('%', '')) || 0;
            const memVal = parseFloat(c.memPerc.replace('%', '')) || 0;

            return (
              <div
                key={c.id || c.name}
                className="p-3.5 rounded-xl bg-theme-bg/90 border border-theme-border shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-sm shadow-emerald-500/50" />
                    <span className="font-bold text-theme-text text-xs truncate">{c.name}</span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleRestart(c.name)}
                      disabled={restartingId === c.name}
                      title="Restart container"
                      className="p-1 rounded text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors"
                    >
                      {restartingId === c.name ? (
                        <Loader2 className="w-3 h-3 animate-spin text-theme-accent" />
                      ) : (
                        <RotateCw className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                {/* CPU Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-theme-muted">
                    <span className="flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-cyan-400" /> CPU Usage
                    </span>
                    <strong className="text-theme-text">{c.cpuPerc || '0%'}</strong>
                  </div>
                  <div className="w-full h-1.5 bg-theme-hover rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        cpuVal > 80 ? 'bg-red-500' : cpuVal > 40 ? 'bg-amber-400' : 'bg-cyan-400'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, cpuVal))}%` }}
                    />
                  </div>
                </div>

                {/* Memory Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-theme-muted">
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-purple-400" /> Memory
                    </span>
                    <strong className="text-theme-text">{c.memUsage || '0B'} ({c.memPerc || '0%'})</strong>
                  </div>
                  <div className="w-full h-1.5 bg-theme-hover rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        memVal > 85 ? 'bg-red-500' : memVal > 60 ? 'bg-amber-400' : 'bg-purple-400'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, memVal))}%` }}
                    />
                  </div>
                </div>

                {/* Network & I/O Footer */}
                <div className="pt-2 border-t border-theme-border/40 flex items-center justify-between text-[9px] text-theme-muted">
                  <span>Net I/O: <strong className="text-theme-text">{c.netIO || '0B / 0B'}</strong></span>
                  <span>PIDs: <strong className="text-theme-text">{c.pids || '1'}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
