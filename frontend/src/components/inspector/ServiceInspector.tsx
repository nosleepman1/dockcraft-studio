import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Sliders, 
  HardDrive, 
  Globe, 
  Activity, 
  Cpu, 
  KeyRound, 
  Eye, 
  EyeOff,
  Box
} from 'lucide-react';
import { useDockerStore } from '../../store/useDockerStore';
import { DockerService, PortMapping, VolumeMapping, EnvVariable } from '../../types/docker';

type InspectorTab = 'general' | 'ports' | 'env' | 'volumes' | 'health' | 'resources';

export const ServiceInspector: React.FC = () => {
  const { services, selectedServiceId, selectService, updateService, deleteService } = useDockerStore();
  const [activeTab, setActiveTab] = useState<InspectorTab>('general');
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});

  const service = services.find(s => s.id === selectedServiceId);
  if (!service) return null;

  const handleUpdate = (updates: Partial<DockerService>) => {
    updateService(service.id, updates);
  };

  const addPort = () => {
    handleUpdate({
      ports: [...service.ports, { id: `p_${Date.now()}`, hostPort: 8080, containerPort: 8080, protocol: 'tcp' }]
    });
  };

  const updatePort = (index: number, updates: Partial<PortMapping>) => {
    const updated = [...service.ports];
    updated[index] = { ...updated[index], ...updates };
    handleUpdate({ ports: updated });
  };

  const removePort = (index: number) => {
    handleUpdate({ ports: service.ports.filter((_, i) => i !== index) });
  };

  const addEnv = () => {
    handleUpdate({
      env: [...service.env, { id: `env_${Date.now()}`, key: 'NEW_VAR', value: 'value', isSecret: false }]
    });
  };

  const updateEnv = (index: number, updates: Partial<EnvVariable>) => {
    const updated = [...service.env];
    updated[index] = { ...updated[index], ...updates };
    handleUpdate({ env: updated });
  };

  const removeEnv = (index: number) => {
    handleUpdate({ env: service.env.filter((_, i) => i !== index) });
  };

  const addVolume = () => {
    handleUpdate({
      volumes: [...service.volumes, { id: `vol_${Date.now()}`, hostPath: `${service.name}_data`, containerPath: '/data', type: 'volume' }]
    });
  };

  const updateVolume = (index: number, updates: Partial<VolumeMapping>) => {
    const updated = [...service.volumes];
    updated[index] = { ...updated[index], ...updates };
    handleUpdate({ volumes: updated });
  };

  const removeVolume = (index: number) => {
    handleUpdate({ volumes: service.volumes.filter((_, i) => i !== index) });
  };

  return (
    <div className="w-96 bg-theme-sidebar border-l border-theme-border flex flex-col h-full shrink-0 z-10">
      {/* Inspector Header */}
      <div className="p-4 border-b border-theme-border flex items-center justify-between">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div 
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-inner"
            style={{ backgroundColor: `${service.color}22`, color: service.color }}
          >
            <Box className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-theme-text truncate">{service.displayName}</h3>
            <span className="text-[10px] font-mono text-theme-muted">{service.name}</span>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => deleteService(service.id)}
            title="Delete Container"
            className="p-1.5 text-theme-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => selectService(null)}
            title="Close Inspector"
            className="p-1.5 text-theme-muted hover:text-theme-text hover:bg-theme-hover rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center px-2 py-1.5 border-b border-theme-border bg-theme-bg/50 gap-1 overflow-x-auto no-scrollbar">
        {[
          { id: 'general', label: 'General', icon: Sliders },
          { id: 'ports', label: `Ports (${service.ports.length})`, icon: Globe },
          { id: 'env', label: `Env (${service.env.length})`, icon: KeyRound },
          { id: 'volumes', label: `Storage (${service.volumes.length})`, icon: HardDrive },
          { id: 'health', label: 'Health', icon: Activity },
          { id: 'resources', label: 'Limits', icon: Cpu },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as InspectorTab)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap flex items-center space-x-1.5 transition-colors ${
                isActive
                  ? 'bg-theme-accent text-white font-semibold shadow-sm'
                  : 'text-theme-muted hover:text-theme-text hover:bg-theme-hover'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs">
        {activeTab === 'general' && (
          <div className="space-y-4">
            <div>
              <label className="block text-theme-muted mb-1 font-medium">Container Name</label>
              <input
                type="text"
                value={service.name}
                onChange={(e) => handleUpdate({ name: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '_') })}
                className="w-full px-3 py-1.5 bg-theme-bg border border-theme-border rounded-lg text-theme-text font-mono focus:outline-none focus:border-theme-accent"
              />
            </div>

            <div>
              <label className="block text-theme-muted mb-1 font-medium">Display Title</label>
              <input
                type="text"
                value={service.displayName}
                onChange={(e) => handleUpdate({ displayName: e.target.value })}
                className="w-full px-3 py-1.5 bg-theme-bg border border-theme-border rounded-lg text-theme-text focus:outline-none focus:border-theme-accent"
              />
            </div>

            <div className="p-3 bg-theme-bg rounded-xl border border-theme-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-theme-text">Build Source</span>
                <div className="flex items-center bg-theme-card rounded-lg p-0.5 border border-theme-border">
                  <button
                    onClick={() => handleUpdate({ isCustomBuild: false })}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                      !service.isCustomBuild ? 'bg-theme-accent text-white' : 'text-theme-muted hover:text-theme-text'
                    }`}
                  >
                    Image
                  </button>
                  <button
                    onClick={() => handleUpdate({ isCustomBuild: true })}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                      service.isCustomBuild ? 'bg-theme-accent text-white' : 'text-theme-muted hover:text-theme-text'
                    }`}
                  >
                    Dockerfile
                  </button>
                </div>
              </div>

              {!service.isCustomBuild ? (
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[10px] text-theme-muted mb-1">Image</label>
                    <input
                      type="text"
                      value={service.image || ''}
                      onChange={(e) => handleUpdate({ image: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-theme-card border border-theme-border rounded-lg text-theme-text font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-theme-muted mb-1">Tag</label>
                    <input
                      type="text"
                      value={service.tag || ''}
                      onChange={(e) => handleUpdate({ tag: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-theme-card border border-theme-border rounded-lg text-theme-text font-mono"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] text-theme-muted mb-1">Dockerfile Runtime</label>
                    <select
                      value={service.dockerfileType || 'nodejs'}
                      onChange={(e) => handleUpdate({ dockerfileType: e.target.value as any })}
                      className="w-full px-2.5 py-1.5 bg-theme-card border border-theme-border rounded-lg text-theme-text font-mono"
                    >
                      <option value="nodejs">Node.js (Express / NestJS)</option>
                      <option value="python-fastapi">Python (FastAPI)</option>
                      <option value="go">Go (Alpine binary)</option>
                      <option value="nextjs">Next.js Standalone</option>
                      <option value="react-vite">React / Vite SPA</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-theme-muted mb-1 font-medium">Restart Policy</label>
              <select
                value={service.restart}
                onChange={(e) => handleUpdate({ restart: e.target.value as any })}
                className="w-full px-3 py-1.5 bg-theme-bg border border-theme-border rounded-lg text-theme-text font-mono"
              >
                <option value="unless-stopped">unless-stopped</option>
                <option value="always">always</option>
                <option value="on-failure">on-failure</option>
                <option value="no">no</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'ports' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-theme-muted text-[11px]">Ports</span>
              <button
                onClick={addPort}
                className="px-2.5 py-1 bg-theme-accent/20 text-theme-accent border border-theme-accent/30 hover:bg-theme-accent hover:text-white rounded-md text-[11px] transition-colors"
              >
                + Add Port
              </button>
            </div>

            <div className="space-y-2">
              {service.ports.map((port, idx) => (
                <div key={port.id || idx} className="p-2.5 bg-theme-bg border border-theme-border rounded-lg flex items-center gap-2">
                  <input
                    type="number"
                    value={port.hostPort}
                    onChange={(e) => updatePort(idx, { hostPort: Number(e.target.value) })}
                    className="w-20 px-2 py-1 bg-theme-card border border-theme-border rounded font-mono text-emerald-400"
                  />
                  <span className="text-theme-muted">:</span>
                  <input
                    type="number"
                    value={port.containerPort}
                    onChange={(e) => updatePort(idx, { containerPort: Number(e.target.value) })}
                    className="w-20 px-2 py-1 bg-theme-card border border-theme-border rounded font-mono text-cyan-400"
                  />
                  <button
                    onClick={() => removePort(idx)}
                    className="p-1.5 text-theme-muted hover:text-red-400 ml-auto transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'env' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-theme-muted text-[11px]">Variables</span>
              <button
                onClick={addEnv}
                className="px-2.5 py-1 bg-theme-accent/20 text-theme-accent border border-theme-accent/30 hover:bg-theme-accent hover:text-white rounded-md text-[11px] transition-colors"
              >
                + Add Variable
              </button>
            </div>

            <div className="space-y-2">
              {service.env.map((envVar, idx) => {
                const isVisible = visibleSecrets[envVar.id];
                return (
                  <div key={envVar.id || idx} className="p-2.5 bg-theme-bg border border-theme-border rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={envVar.key}
                        onChange={(e) => updateEnv(idx, { key: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_') })}
                        className="flex-1 px-2 py-1 bg-theme-card border border-theme-border rounded font-mono text-yellow-400 text-xs"
                      />
                      <button
                        onClick={() => updateEnv(idx, { isSecret: !envVar.isSecret })}
                        className={`p-1 rounded text-[10px] font-semibold border ${
                          envVar.isSecret ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-theme-hover text-theme-muted border-theme-border'
                        }`}
                      >
                        {envVar.isSecret ? 'SECRET' : 'PUBLIC'}
                      </button>
                      <button onClick={() => removeEnv(idx)} className="p-1 text-theme-muted hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={envVar.isSecret && !isVisible ? 'password' : 'text'}
                        value={envVar.value}
                        onChange={(e) => updateEnv(idx, { value: e.target.value })}
                        className="w-full px-2 py-1 bg-theme-card border border-theme-border rounded font-mono text-theme-text text-xs"
                      />
                      {envVar.isSecret && (
                        <button
                          type="button"
                          onClick={() => setVisibleSecrets(prev => ({ ...prev, [envVar.id]: !prev[envVar.id] }))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-text"
                        >
                          {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'volumes' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-theme-muted text-[11px]">Volumes</span>
              <button
                onClick={addVolume}
                className="px-2.5 py-1 bg-theme-accent/20 text-theme-accent border border-theme-accent/30 hover:bg-theme-accent hover:text-white rounded-md text-[11px] transition-colors"
              >
                + Add Mount
              </button>
            </div>

            <div className="space-y-2">
              {service.volumes.map((vol, idx) => (
                <div key={vol.id || idx} className="p-2.5 bg-theme-bg border border-theme-border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-semibold text-theme-muted">{vol.type} Mount</span>
                    <button onClick={() => removeVolume(idx)} className="p-1 text-theme-muted hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={vol.hostPath}
                    onChange={(e) => updateVolume(idx, { hostPath: e.target.value })}
                    className="w-full px-2 py-1 bg-theme-card border border-theme-border rounded font-mono text-amber-400"
                  />
                  <input
                    type="text"
                    value={vol.containerPath}
                    onChange={(e) => updateVolume(idx, { containerPath: e.target.value })}
                    className="w-full px-2 py-1 bg-theme-card border border-theme-border rounded font-mono text-cyan-400"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
