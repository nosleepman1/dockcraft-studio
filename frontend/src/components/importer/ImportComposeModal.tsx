import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  Terminal, 
  FileCode, 
  AlertCircle, 
  Check, 
  Sparkles 
} from 'lucide-react';
import { useDockerStore } from '../../store/useDockerStore';

export const ImportComposeModal: React.FC = () => {
  const { activeModal, setActiveModal, importComposeYaml, importDockerRun } = useDockerStore();
  const [importType, setImportType] = useState<'compose' | 'dockerrun'>('compose');
  const [inputContent, setInputContent] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (activeModal !== 'import') return null;

  const handleImport = () => {
    setErrorMsg(null);
    if (!inputContent.trim()) {
      setErrorMsg('Please paste some content to import');
      return;
    }

    if (importType === 'compose') {
      const res = importComposeYaml(inputContent);
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to parse Compose YAML');
      }
    } else {
      const res = importDockerRun(inputContent);
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to parse docker run command');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-theme-card border border-theme-border rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        <div className="px-6 py-4 border-b border-theme-border flex items-center justify-between bg-theme-header">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-theme-accent/20 text-theme-accent border border-theme-accent/30 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-theme-text">Import Existing Docker Stack</h2>
              <p className="text-xs text-theme-muted">Convert YAML or CLI commands into interactive visual nodes</p>
            </div>
          </div>

          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 text-theme-muted hover:text-theme-text hover:bg-theme-hover rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-theme-border bg-theme-bg/60 flex items-center justify-between">
          <div className="flex items-center space-x-2 bg-theme-card p-1 rounded-lg border border-theme-border">
            <button
              onClick={() => { setImportType('compose'); setErrorMsg(null); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center space-x-1.5 transition-colors ${
                importType === 'compose'
                  ? 'bg-theme-accent text-white font-semibold'
                  : 'text-theme-muted hover:text-theme-text'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>docker-compose.yml</span>
            </button>
            <button
              onClick={() => { setImportType('dockerrun'); setErrorMsg(null); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center space-x-1.5 transition-colors ${
                importType === 'dockerrun'
                  ? 'bg-theme-accent text-white font-semibold'
                  : 'text-theme-muted hover:text-theme-text'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>docker run command</span>
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 flex flex-col space-y-3">
          <textarea
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            placeholder={importType === 'compose' ? 'services:\n  web:\n    image: nginx\n...' : 'docker run -d -p 80:80 nginx:alpine'}
            className="flex-1 w-full p-4 bg-theme-bg border border-theme-border rounded-xl font-mono text-xs text-theme-text focus:outline-none focus:border-theme-accent resize-none"
          />

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-theme-border bg-theme-header flex items-center justify-between">
          <span className="text-[11px] text-theme-muted">Auto-detects containers, ports, envs, volumes & depends_on</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveModal(null)}
              className="px-4 py-2 bg-theme-hover text-theme-text rounded-lg text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              className="px-5 py-2 bg-theme-accent text-white rounded-lg text-xs font-bold transition-colors shadow-lg shadow-theme-accent/20 flex items-center space-x-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Import to Canvas</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
