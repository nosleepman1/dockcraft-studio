import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Star, 
  ShieldCheck, 
  Plus, 
  Download, 
  Box,
  Loader2
} from 'lucide-react';
import { useDockerStore } from '../../store/useDockerStore';
import { api, DockerHubItem } from '../../api/client';

export const DockerHubModal: React.FC = () => {
  const { activeModal, setActiveModal, addServiceFromCatalog } = useDockerStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DockerHubItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  if (activeModal !== 'dockerhub') return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const data = await api.searchDockerHub(query.trim());
      setResults(data);
    } catch (_) {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddImage = (item: DockerHubItem) => {
    const cleanName = item.name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    addServiceFromCatalog({
      catalogId: `hub_${cleanName}`,
      name: cleanName,
      displayName: item.name,
      category: 'custom',
      image: item.name,
      tag: 'latest',
      icon: 'Box',
      color: '#3B82F6',
      description: item.description || `Docker Hub image: ${item.name}`,
      isCustomBuild: false,
      ports: [{ id: 'p1', hostPort: 8080, containerPort: 8080, protocol: 'tcp' }],
      expose: [],
      networks: ['app-network'],
      env: [],
      volumes: [],
      dependsOn: [],
      restart: 'unless-stopped',
    });
    setActiveModal(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-theme-card border border-theme-border rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-theme-border flex items-center justify-between bg-theme-header">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-theme-text">Docker Hub Live Registry Search</h2>
              <p className="text-xs text-theme-muted">Search millions of public Docker container images in real-time</p>
            </div>
          </div>

          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 text-theme-muted hover:text-theme-text hover:bg-theme-hover rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="p-4 border-b border-theme-border bg-theme-bg/60 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" />
            <input
              type="text"
              placeholder="Search images (e.g. rust, cassandra, grafana, vault)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full pl-9 pr-3 py-2 bg-theme-card border border-theme-border rounded-lg text-xs font-mono text-theme-text focus:outline-none focus:border-theme-accent"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2 bg-theme-accent hover:opacity-90 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shrink-0 shadow-sm"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Search Hub</span>
          </button>
        </form>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
          {results.map((res, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-theme-bg/80 border border-theme-border hover:border-theme-accent/50 transition-all flex items-start justify-between group"
            >
              <div className="min-w-0 flex-1 mr-4">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-bold text-theme-text truncate font-mono">{res.name}</h4>
                  {res.isOfficial && (
                    <span className="px-2 py-0.2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-[10px] font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Official
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-[11px] text-amber-400 font-mono">
                    <Star className="w-3 h-3 fill-amber-400" /> {res.starCount}
                  </span>
                </div>
                <p className="text-xs text-theme-muted mt-1.5 leading-relaxed line-clamp-2">
                  {res.description || 'No description provided.'}
                </p>
              </div>

              <button
                onClick={() => handleAddImage(res)}
                className="px-3.5 py-1.5 bg-theme-hover hover:bg-theme-accent hover:text-white text-theme-text rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-theme-border shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Node</span>
              </button>
            </div>
          ))}

          {results.length === 0 && !isLoading && (
            <div className="text-center py-12 text-theme-muted text-xs">
              Type an image keyword and press "Search Hub" to discover community & official Docker images.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
