import React, { useState } from 'react';
import { 
  X, 
  Rocket, 
  ShieldCheck, 
  Globe, 
  Lock, 
  Terminal, 
  Download, 
  Copy, 
  CheckCircle2, 
  HardDrive, 
  FileCode,
  Layers,
  ArrowRight,
  Server
} from 'lucide-react';
import { useDockerStore } from '../../store/useDockerStore';
import { generateProductionBundle, ProductionBundleOptions } from '../../engine/productionBundleGenerator';
import { api } from '../../api/client';
import { toast } from '../ui/Toast';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export const ProductionDeployModal: React.FC = () => {
  const { activeModal, setActiveModal, services, projectName, targetProjectPath } = useDockerStore();

  const [options, setOptions] = useState<ProductionBundleOptions>({
    domainName: 'app.example.com',
    enableSSL: true,
    sslEmail: 'admin@example.com',
    enableCICD: true,
    enableDBBackupCron: true,
  });

  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [isInjecting, setIsInjecting] = useState(false);

  if (activeModal !== 'production_deploy' as any) return null;

  const bundle = generateProductionBundle(services, projectName, options);
  const currentFile = bundle.files[activeFileIndex] || bundle.files[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    toast.success('Copied to Clipboard', currentFile.path);
  };

  const handleDownloadProdZip = async () => {
    const zip = new JSZip();
    bundle.files.forEach((f) => {
      zip.file(f.path, f.content);
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${projectName.toLowerCase()}-production-ready.zip`);
    toast.success('Production ZIP Ready', 'Downloaded production deployment pack');
  };

  const handleInjectToDisk = async () => {
    if (!targetProjectPath) {
      toast.error('No Target Directory', 'Please select a local folder in Workspace Sync first');
      return;
    }

    setIsInjecting(true);
    try {
      const payloads = bundle.files.map(f => ({
        relativePath: f.path,
        content: f.content
      }));

      await api.writeStackToDisk(targetProjectPath, payloads);
      toast.success('Production Pack Injected to Disk!', `Written to ${targetProjectPath}`);
    } catch (err: any) {
      toast.error('Injection Failed', err.message || String(err));
    } finally {
      setIsInjecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-theme-card border border-theme-border rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-theme-border flex items-center justify-between bg-theme-header">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 via-indigo-500 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Rocket className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-theme-text flex items-center gap-2">
                <span>Zero-Code Production Deployment Pack</span>
                <span className="px-2 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
                  100% Ready
                </span>
              </h2>
              <p className="text-xs text-theme-muted">Turn your canvas into a production-hardened cloud architecture in 1 click</p>
            </div>
          </div>

          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 text-theme-muted hover:text-theme-text hover:bg-theme-hover rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options Toolbar */}
        <div className="px-6 py-3 border-b border-theme-border bg-theme-bg/80 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          
          {/* Domain input */}
          <div className="space-y-1">
            <label className="text-[10px] text-theme-muted font-bold uppercase flex items-center gap-1">
              <Globe className="w-3 h-3 text-cyan-400" /> Target Domain
            </label>
            <input
              type="text"
              value={options.domainName}
              onChange={(e) => setOptions({ ...options, domainName: e.target.value })}
              placeholder="e.g. app.mycompany.com"
              className="w-full px-2.5 py-1.5 bg-theme-card border border-theme-border rounded-lg text-theme-text text-xs focus:outline-none focus:border-theme-accent"
            />
          </div>

          {/* SSL Toggle & Email */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-theme-muted font-bold uppercase flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" /> SSL / Let's Encrypt
              </label>
              <input
                type="checkbox"
                checked={options.enableSSL}
                onChange={(e) => setOptions({ ...options, enableSSL: e.target.checked })}
                className="w-3.5 h-3.5 rounded text-theme-accent"
              />
            </div>
            <input
              type="email"
              disabled={!options.enableSSL}
              value={options.sslEmail}
              onChange={(e) => setOptions({ ...options, sslEmail: e.target.value })}
              placeholder="admin@example.com"
              className="w-full px-2.5 py-1.5 bg-theme-card border border-theme-border rounded-lg text-theme-text text-xs focus:outline-none focus:border-theme-accent disabled:opacity-50"
            />
          </div>

          {/* CI/CD Toggle */}
          <div className="space-y-1 flex flex-col justify-between">
            <label className="text-[10px] text-theme-muted font-bold uppercase flex items-center gap-1">
              <Server className="w-3 h-3 text-purple-400" /> GitHub Actions CI/CD
            </label>
            <div className="flex items-center space-x-2 py-1">
              <input
                type="checkbox"
                id="cicd_toggle"
                checked={options.enableCICD}
                onChange={(e) => setOptions({ ...options, enableCICD: e.target.checked })}
                className="w-3.5 h-3.5 rounded text-theme-accent"
              />
              <label htmlFor="cicd_toggle" className="text-theme-text text-[11px] cursor-pointer">
                Generate Automated Deploy Pipeline
              </label>
            </div>
          </div>

        </div>

        {/* Main Content: File Explorer & Monaco Code Viewer */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* File Tree List */}
          <div className="w-64 border-r border-theme-border bg-theme-bg/60 p-3 space-y-1 overflow-y-auto custom-scrollbar select-none">
            <span className="text-[10px] font-mono text-theme-muted uppercase tracking-wider font-bold px-2 block mb-2">
              Generated Files ({bundle.files.length})
            </span>

            {bundle.files.map((file, idx) => {
              const isActive = activeFileIndex === idx;
              return (
                <button
                  key={file.path}
                  onClick={() => setActiveFileIndex(idx)}
                  className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-mono flex items-center space-x-2 transition-all ${
                    isActive
                      ? 'bg-theme-accent text-white font-bold shadow-md shadow-theme-accent/20'
                      : 'text-theme-muted hover:text-theme-text hover:bg-theme-hover'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{file.path}</span>
                </button>
              );
            })}
          </div>

          {/* Code Viewer */}
          <div className="flex-1 flex flex-col bg-theme-card overflow-hidden font-mono text-xs">
            <div className="px-4 py-2 border-b border-theme-border bg-theme-header flex items-center justify-between">
              <div>
                <span className="font-bold text-theme-text">{currentFile.path}</span>
                <span className="text-[10px] text-theme-muted block">{currentFile.description}</span>
              </div>

              <button
                onClick={handleCopy}
                className="px-2.5 py-1 bg-theme-hover hover:bg-theme-card text-theme-text border border-theme-border rounded-lg text-xs flex items-center space-x-1.5 transition-colors"
              >
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-theme-bg/95 font-mono text-xs text-theme-text/90 leading-relaxed whitespace-pre select-text">
              {currentFile.content}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-theme-border bg-theme-header flex items-center justify-between">
          <button
            onClick={() => setActiveModal(null)}
            className="px-4 py-2 bg-theme-hover text-theme-text rounded-xl text-xs font-semibold"
          >
            Close
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownloadProdZip}
              className="px-4 py-2 bg-theme-hover hover:bg-theme-card text-theme-text border border-theme-border rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download ZIP</span>
            </button>

            <button
              onClick={handleInjectToDisk}
              disabled={isInjecting}
              className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:opacity-90 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>1-Click Inject to Disk</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
