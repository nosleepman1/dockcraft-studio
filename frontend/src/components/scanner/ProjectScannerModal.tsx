import React, { useState } from 'react';
import { 
  X, 
  Search, 
  FolderSearch, 
  HardDrive, 
  Folder, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  ArrowRight, 
  Loader2,
  FileCode,
  Server,
  Database,
  Radio,
  Cpu
} from 'lucide-react';
import { useDockerStore } from '../../store/useDockerStore';
import { api, ScanProjectResult } from '../../api/client';
import { toast } from '../ui/Toast';

export const ProjectScannerModal: React.FC = () => {
  const { 
    activeModal, 
    setActiveModal, 
    targetProjectPath, 
    setTargetProjectPath,
    applyScannedArchitecture
  } = useDockerStore();

  const [scanPath, setScanPath] = useState(targetProjectPath || 'C:\\Users\\abash\\Desktop\\dockcraft-studio');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanProjectResult | null>(null);

  if (activeModal !== 'scanner') return null;

  const handleStartScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!scanPath.trim()) return;

    setIsScanning(true);
    setScanResult(null);

    try {
      const res = await api.scanProjectDirectory(scanPath.trim());
      setScanResult(res);
      toast.success('Architecture Detected!', `${res.services.length} services found in ${res.projectName}`);
    } catch (err: any) {
      toast.error('Scan Failed', err.message || String(err));
    } finally {
      setIsScanning(false);
    }
  };

  const handleApply = () => {
    if (!scanResult) return;
    applyScannedArchitecture(scanResult);
    setActiveModal(null);
    toast.success('Architecture Loaded on Canvas', scanResult.projectName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-theme-card border border-theme-border rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-theme-border flex items-center justify-between bg-theme-header">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-500 text-white flex items-center justify-center shadow-md">
              <FolderSearch className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-theme-text">Auto-Discovery Project Scanner</h2>
              <p className="text-xs text-theme-muted">Scan an existing repository on your machine to reverse-engineer its Docker architecture</p>
            </div>
          </div>

          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 text-theme-muted hover:text-theme-text hover:bg-theme-hover rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Directory Input & Trigger */}
        <form onSubmit={handleStartScan} className="p-5 border-b border-theme-border bg-theme-bg/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-theme-text uppercase tracking-wider flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-theme-accent" />
              <span>Target Repository Path on Machine</span>
            </span>

            <button
              type="button"
              onClick={() => setActiveModal('directory_picker')}
              className="px-2.5 py-1 bg-theme-hover hover:bg-theme-card text-theme-text border border-theme-border rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors shadow-sm"
            >
              <Folder className="w-3.5 h-3.5 text-amber-400" />
              <span>Browse...</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={scanPath}
              onChange={(e) => setScanPath(e.target.value)}
              placeholder="e.g. C:\Users\username\Desktop\my-repo"
              className="flex-1 px-3.5 py-2 bg-theme-card border border-theme-border rounded-xl text-xs font-mono text-theme-text focus:outline-none focus:border-theme-accent shadow-inner"
            />
            <button
              type="submit"
              disabled={isScanning}
              className="px-5 py-2 bg-theme-accent hover:opacity-90 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md active:scale-95 shrink-0"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Scan Folder</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Scan Results & Findings */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar text-xs">
          
          {isScanning && (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-theme-accent/20 border border-theme-accent/30 flex items-center justify-center text-theme-accent animate-pulse">
                <FolderSearch className="w-6 h-6 animate-spin" />
              </div>
              <h4 className="font-bold text-theme-text text-sm">Inspecting Codebase Manifests...</h4>
              <p className="text-xs text-theme-muted max-w-sm">
                Parsing package.json, composer.json, pom.xml, requirements.txt, and Prisma schemas...
              </p>
            </div>
          )}

          {!isScanning && !scanResult && (
            <div className="py-16 text-center text-theme-muted space-y-2">
              <Sparkles className="w-8 h-8 mx-auto text-theme-muted/50" />
              <p className="text-xs">
                Select a local folder above and click <strong>Scan Folder</strong>.
              </p>
            </div>
          )}

          {!isScanning && scanResult && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Summary Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-transparent border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider block">
                    Architecture Discovered
                  </span>
                  <h3 className="text-sm font-bold text-theme-text mt-0.5">{scanResult.detectedStack}</h3>
                  <span className="text-[11px] text-theme-muted font-mono mt-1 block">
                    {scanResult.totalFilesScanned} files scanned &bull; {scanResult.services.length} services configured
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 max-w-[200px] justify-end">
                  {scanResult.detectedLanguages.map(lang => (
                    <span key={lang} className="px-2 py-0.5 rounded bg-theme-card border border-theme-border text-[10px] font-mono text-theme-text">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>

              {/* Detected Services List */}
              <div className="space-y-2">
                <h4 className="font-bold text-theme-text text-xs flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-theme-accent" />
                  <span>Detected Docker Services ({scanResult.services.length})</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {scanResult.services.map((service) => (
                    <div
                      key={service.id}
                      className="p-3.5 rounded-xl bg-theme-bg/80 border border-theme-border flex items-center justify-between space-x-3 shadow-sm"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div 
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${service.color || '#3B82F6'}20`, color: service.color || '#3B82F6' }}
                        >
                          <Server className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-semibold text-theme-text text-xs truncate">{service.displayName}</h5>
                          <span className="text-[10px] font-mono text-theme-muted block truncate">
                            {service.isCustomBuild ? `Dockerfile (${service.dockerfileType})` : service.image}
                          </span>
                        </div>
                      </div>

                      {service.ports.length > 0 && (
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                          :{service.ports[0].containerPort}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-theme-border bg-theme-header flex items-center justify-between">
          <button
            onClick={() => setActiveModal(null)}
            className="px-4 py-2 bg-theme-hover text-theme-text rounded-xl text-xs font-semibold"
          >
            Cancel
          </button>

          {scanResult && (
            <button
              onClick={handleApply}
              className="px-5 py-2 bg-theme-accent text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md hover:opacity-90 transition-all active:scale-95"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Import to Canvas as Project</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
