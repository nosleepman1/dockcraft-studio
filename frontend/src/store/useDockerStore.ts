import { create } from 'zustand';
import {
  Connection,
  EdgeChange,
  NodeChange,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType
} from '@xyflow/react';
import { DockerService, DockerNetwork, DockerVolume, Project } from '../types/docker';
import { DockerCanvasNode, DockerCanvasEdge } from '../types/graph';
import { CatalogItem, SERVICE_CATALOG } from '../catalog/serviceCatalog';
import { ARCHITECTURE_TEMPLATES } from '../catalog/templates';
import { autoWireServices } from '../engine/autoWiring';
import { parseDockerComposeYaml, parseDockerRunCommand } from '../engine/composeParser';
import { ThemeMode, applyTheme, getInitialTheme } from '../themes/themeConfig';
import { api, SystemStatus } from '../api/client';
import { LogMessage } from '../api/websocket';

interface DockerState {
  projectName: string;
  services: DockerService[];
  networks: DockerNetwork[];
  volumes: DockerVolume[];
  selectedServiceId: string | null;
  nodes: DockerCanvasNode[];
  edges: DockerCanvasEdge[];
  
  // Themes
  currentTheme: ThemeMode;

  // Backend & Docker Runtime Integration
  isBackendConnected: boolean;
  systemStatus: SystemStatus | null;
  isDeploying: boolean;
  isStackRunning: boolean;
  isTerminalOpen: boolean;
  liveLogs: LogMessage[];
  savedProjects: Project[];

  // Modals & Tabs
  activeModal: 'preview' | 'templates' | 'import' | 'security' | 'projects' | 'dockerhub' | null;
  activePreviewTab: 'compose' | 'dockerfile' | 'nginx' | 'env' | 'scripts' | 'readme';
  previewSelectedServiceId: string | null;

  // Actions
  setTheme: (theme: ThemeMode) => void;
  setProjectName: (name: string) => void;
  selectService: (serviceId: string | null) => void;
  setActiveModal: (modal: DockerState['activeModal']) => void;
  setActivePreviewTab: (tab: DockerState['activePreviewTab']) => void;
  setPreviewSelectedServiceId: (id: string | null) => void;
  toggleTerminal: () => void;
  clearLogs: () => void;
  addLogMessage: (msg: LogMessage) => void;

  // Backend calls
  checkBackendHealth: () => Promise<void>;
  deployStackToDocker: () => Promise<void>;
  stopDockerStack: () => Promise<void>;
  saveProjectToBackend: () => Promise<void>;
  loadProjectFromBackend: (id: string) => Promise<void>;
  fetchSavedProjects: () => Promise<void>;

  // Canvas Actions
  onNodesChange: (changes: NodeChange<DockerCanvasNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<DockerCanvasEdge>[]) => void;
  onConnect: (connection: Connection) => void;

  // Service Management
  addServiceFromCatalog: (catalogItem: CatalogItem, position?: { x: number; y: number }) => string;
  updateService: (serviceId: string, updates: Partial<DockerService>) => void;
  deleteService: (serviceId: string) => void;
  duplicateService: (serviceId: string) => void;
  
  // High-level Actions
  loadTemplate: (templateId: string) => void;
  importComposeYaml: (yamlString: string) => { success: boolean; error?: string };
  importDockerRun: (command: string) => { success: boolean; error?: string };
  autoLayout: () => void;
  clearCanvas: () => void;
  autoFixIssue: (issueId: string, serviceId?: string) => void;
}

const syncNodesAndEdges = (
  services: DockerService[],
  existingNodes: DockerCanvasNode[],
  existingEdges: DockerCanvasEdge[]
): { nodes: DockerCanvasNode[]; edges: DockerCanvasEdge[] } => {
  const nodes: DockerCanvasNode[] = services.map((service, idx) => {
    const existing = existingNodes.find(n => n.id === service.id);
    const position = existing ? existing.position : { x: 100 + (idx % 3) * 320, y: 100 + Math.floor(idx / 3) * 260 };

    return {
      id: service.id,
      type: 'serviceNode',
      position,
      data: { service },
    };
  });

  const edges: DockerCanvasEdge[] = [];
  services.forEach(sourceService => {
    sourceService.dependsOn.forEach(dep => {
      const targetService = services.find(s => s.id === dep.serviceId);
      if (targetService) {
        const edgeId = `e-${sourceService.id}-${targetService.id}`;
        
        let strokeColor = '#3B82F6';
        if (targetService.category === 'database') strokeColor = '#10B981';
        else if (targetService.category === 'queue') strokeColor = '#F97316';
        else if (targetService.category === 'ai') strokeColor = '#A855F7';
        else if (sourceService.category === 'gateway') strokeColor = '#06B6D4';

        edges.push({
          id: edgeId,
          source: sourceService.id,
          target: targetService.id,
          animated: true,
          style: { stroke: strokeColor, strokeWidth: 2.5 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: strokeColor,
            width: 18,
            height: 18
          },
          data: {
            relationType: targetService.category as any,
          }
        });
      }
    });
  });

  return { nodes, edges };
};

const initialTheme = getInitialTheme();
applyTheme(initialTheme);

export const useDockerStore = create<DockerState>((set, get) => {
  const initialNetworks: DockerNetwork[] = [{ name: 'app-network', driver: 'bridge' }];
  const initialVolumes: DockerVolume[] = [];

  const starterTemplate = ARCHITECTURE_TEMPLATES[0];
  const starterServices = JSON.parse(JSON.stringify(starterTemplate.services)) as DockerService[];
  
  starterTemplate.connections.forEach(conn => {
    const source = starterServices.find(s => s.id === conn.sourceId);
    const target = starterServices.find(s => s.id === conn.targetId);
    if (source && target) {
      const wired = autoWireServices(source, target);
      Object.assign(source, wired.updatedSource);
      Object.assign(target, wired.updatedTarget);
    }
  });

  const initialNodes: DockerCanvasNode[] = [
    { id: 'svc_next', type: 'serviceNode', position: { x: 80, y: 150 }, data: { service: starterServices[0] } },
    { id: 'svc_api', type: 'serviceNode', position: { x: 460, y: 150 }, data: { service: starterServices[1] } },
    { id: 'svc_db', type: 'serviceNode', position: { x: 840, y: 60 }, data: { service: starterServices[2] } },
    { id: 'svc_redis', type: 'serviceNode', position: { x: 840, y: 280 }, data: { service: starterServices[3] } },
  ];

  const { edges: initialEdges } = syncNodesAndEdges(starterServices, initialNodes, []);

  return {
    projectName: 'dockcraft-app',
    services: starterServices,
    networks: initialNetworks,
    volumes: initialVolumes,
    selectedServiceId: null,
    nodes: initialNodes,
    edges: initialEdges,

    currentTheme: initialTheme,

    isBackendConnected: false,
    systemStatus: null,
    isDeploying: false,
    isStackRunning: false,
    isTerminalOpen: false,
    liveLogs: [],
    savedProjects: [],

    activeModal: null,
    activePreviewTab: 'compose',
    previewSelectedServiceId: null,

    setTheme: (theme) => {
      applyTheme(theme);
      set({ currentTheme: theme });
    },

    setProjectName: (name) => set({ projectName: name }),
    selectService: (serviceId) => set({ selectedServiceId: serviceId }),
    setActiveModal: (modal) => set({ activeModal: modal }),
    setActivePreviewTab: (tab) => set({ activePreviewTab: tab }),
    setPreviewSelectedServiceId: (id) => set({ previewSelectedServiceId: id }),
    toggleTerminal: () => set(state => ({ isTerminalOpen: !state.isTerminalOpen })),
    clearLogs: () => set({ liveLogs: [] }),
    addLogMessage: (msg) => set(state => ({ liveLogs: [...state.liveLogs.slice(-300), msg] })),

    checkBackendHealth: async () => {
      try {
        await api.getHealth();
        const sys = await api.getSystemStatus();
        set({ isBackendConnected: true, systemStatus: sys });
      } catch (_) {
        set({ isBackendConnected: false, systemStatus: null });
      }
    },

    deployStackToDocker: async () => {
      const { services } = get();
      set({ isDeploying: true, isTerminalOpen: true });
      try {
        await api.deployStack(services);
        set({ isDeploying: false, isStackRunning: true });
      } catch (err: any) {
        set({ isDeploying: false });
        get().addLogMessage({
          type: 'error',
          timestamp: new Date().toISOString(),
          message: `Deploy failed: ${err.message || String(err)}`
        });
      }
    },

    stopDockerStack: async () => {
      set({ isDeploying: true });
      try {
        await api.stopStack();
        set({ isDeploying: false, isStackRunning: false });
      } catch (err: any) {
        set({ isDeploying: false });
        get().addLogMessage({
          type: 'error',
          timestamp: new Date().toISOString(),
          message: `Stop failed: ${err.message || String(err)}`
        });
      }
    },

    saveProjectToBackend: async () => {
      const { projectName, services } = get();
      try {
        await api.saveProject({
          name: projectName,
          description: `Architecture with ${services.length} services`,
          services,
        });
        await get().fetchSavedProjects();
      } catch (err) {
        console.error('Failed to save project:', err);
      }
    },

    fetchSavedProjects: async () => {
      try {
        const list = await api.listProjects();
        set({ savedProjects: list });
      } catch (_) {}
    },

    loadProjectFromBackend: async (id: string) => {
      try {
        const p = await api.getProject(id);
        const newNodes: DockerCanvasNode[] = p.services.map((s, idx) => ({
          id: s.id,
          type: 'serviceNode',
          position: { x: 100 + (idx % 3) * 320, y: 100 + Math.floor(idx / 3) * 260 },
          data: { service: s }
        }));
        const { edges } = syncNodesAndEdges(p.services, newNodes, []);

        set({
          projectName: p.name,
          services: p.services,
          nodes: newNodes,
          edges,
          selectedServiceId: null,
          activeModal: null,
        });

        get().autoLayout();
      } catch (err) {
        console.error('Failed to load project:', err);
      }
    },

    onNodesChange: (changes) => {
      set({
        nodes: applyNodeChanges(changes, get().nodes),
      });
    },

    onEdgesChange: (changes) => {
      set({
        edges: applyEdgeChanges(changes, get().edges),
      });
    },

    onConnect: (connection: Connection) => {
      const { services, nodes, edges } = get();
      if (!connection.source || !connection.target || connection.source === connection.target) return;

      const sourceService = services.find(s => s.id === connection.source);
      const targetService = services.find(s => s.id === connection.target);

      if (!sourceService || !targetService) return;

      const { updatedSource, updatedTarget } = autoWireServices(sourceService, targetService);

      const updatedServices = services.map(s => {
        if (s.id === updatedSource.id) return updatedSource;
        if (s.id === updatedTarget.id) return updatedTarget;
        return s;
      });

      const synced = syncNodesAndEdges(updatedServices, nodes, edges);

      set({
        services: updatedServices,
        nodes: synced.nodes,
        edges: synced.edges,
      });
    },

    addServiceFromCatalog: (catalogItem, position) => {
      const { services, nodes, edges } = get();
      const newId = `svc_${catalogItem.name}_${Math.random().toString(36).substr(2, 6)}`;
      
      let name = catalogItem.name;
      let counter = 1;
      while (services.some(s => s.name === name)) {
        name = `${catalogItem.name}_${counter++}`;
      }

      const newService: DockerService = {
        ...JSON.parse(JSON.stringify(catalogItem)),
        id: newId,
        name,
        displayName: `${catalogItem.displayName} ${counter > 1 ? counter : ''}`.trim(),
      };

      const updatedServices = [...services, newService];
      const newNodePos = position || { x: 250 + Math.random() * 300, y: 150 + Math.random() * 200 };
      
      const newNodes = [
        ...nodes,
        {
          id: newId,
          type: 'serviceNode' as const,
          position: newNodePos,
          data: { service: newService }
        }
      ];

      const synced = syncNodesAndEdges(updatedServices, newNodes, edges);

      set({
        services: updatedServices,
        nodes: synced.nodes,
        edges: synced.edges,
        selectedServiceId: newId,
      });

      return newId;
    },

    updateService: (serviceId, updates) => {
      const { services, nodes, edges } = get();
      const updatedServices = services.map(s => {
        if (s.id === serviceId) {
          return { ...s, ...updates };
        }
        return s;
      });

      const updatedNodes = nodes.map(n => {
        if (n.id === serviceId) {
          const updatedSvc = updatedServices.find(s => s.id === serviceId)!;
          return {
            ...n,
            data: { ...n.data, service: updatedSvc }
          };
        }
        return n;
      });

      const synced = syncNodesAndEdges(updatedServices, updatedNodes, edges);

      set({
        services: updatedServices,
        nodes: synced.nodes,
        edges: synced.edges,
      });
    },

    deleteService: (serviceId) => {
      const { services, nodes, edges } = get();
      const updatedServices = services
        .filter(s => s.id !== serviceId)
        .map(s => ({
          ...s,
          dependsOn: s.dependsOn.filter(d => d.serviceId !== serviceId)
        }));

      const updatedNodes = nodes.filter(n => n.id !== serviceId);
      const synced = syncNodesAndEdges(updatedServices, updatedNodes, edges);

      set({
        services: updatedServices,
        nodes: synced.nodes,
        edges: synced.edges,
        selectedServiceId: get().selectedServiceId === serviceId ? null : get().selectedServiceId,
      });
    },

    duplicateService: (serviceId) => {
      const { services } = get();
      const service = services.find(s => s.id === serviceId);
      if (!service) return;

      const clone: DockerService = JSON.parse(JSON.stringify(service));
      clone.id = `svc_${service.name}_${Math.random().toString(36).substr(2, 6)}`;
      clone.name = `${service.name}_copy`;
      clone.displayName = `${service.displayName} (Copy)`;
      
      clone.ports = clone.ports.map(p => ({
        ...p,
        id: `p_${Math.random().toString(36).substr(2, 6)}`,
        hostPort: typeof p.hostPort === 'number' ? p.hostPort + 10 : p.hostPort
      }));

      const { nodes, edges } = get();
      const originalNode = nodes.find(n => n.id === serviceId);
      const position = originalNode ? { x: originalNode.position.x + 40, y: originalNode.position.y + 40 } : undefined;

      const updatedServices = [...services, clone];
      const newNodes = [
        ...nodes,
        {
          id: clone.id,
          type: 'serviceNode' as const,
          position: position || { x: 300, y: 300 },
          data: { service: clone }
        }
      ];

      const synced = syncNodesAndEdges(updatedServices, newNodes, edges);

      set({
        services: updatedServices,
        nodes: synced.nodes,
        edges: synced.edges,
        selectedServiceId: clone.id,
      });
    },

    loadTemplate: (templateId) => {
      const template = ARCHITECTURE_TEMPLATES.find(t => t.id === templateId);
      if (!template) return;

      const loadedServices = JSON.parse(JSON.stringify(template.services)) as DockerService[];

      template.connections.forEach(conn => {
        const source = loadedServices.find(s => s.id === conn.sourceId);
        const target = loadedServices.find(s => s.id === conn.targetId);
        if (source && target) {
          const wired = autoWireServices(source, target);
          Object.assign(source, wired.updatedSource);
          Object.assign(target, wired.updatedTarget);
        }
      });

      const newNodes: DockerCanvasNode[] = loadedServices.map((s, idx) => {
        let x = 100;
        let y = 150;
        if (s.category === 'gateway') { x = 60; y = 150; }
        else if (s.category === 'frontend') { x = 280; y = 150; }
        else if (s.category === 'backend') { x = 540; y = 150; }
        else if (s.category === 'database' || s.category === 'queue' || s.category === 'ai' || s.category === 'tool') {
          const dbIndex = loadedServices.filter(item => item.category === 'database' || item.category === 'queue' || item.category === 'ai' || item.category === 'tool').indexOf(s);
          x = 840;
          y = 50 + dbIndex * 180;
        } else {
          x = 100 + (idx % 3) * 300;
          y = 100 + Math.floor(idx / 3) * 220;
        }

        return {
          id: s.id,
          type: 'serviceNode',
          position: { x, y },
          data: { service: s }
        };
      });

      const { edges } = syncNodesAndEdges(loadedServices, newNodes, []);

      set({
        services: loadedServices,
        nodes: newNodes,
        edges,
        selectedServiceId: null,
        activeModal: null,
      });
    },

    importComposeYaml: (yamlString) => {
      const result = parseDockerComposeYaml(yamlString);
      if (result.errors.length > 0 && result.services.length === 0) {
        return { success: false, error: result.errors.join('\n') };
      }

      const newNodes: DockerCanvasNode[] = result.services.map((s, idx) => ({
        id: s.id,
        type: 'serviceNode',
        position: { x: 100 + (idx % 3) * 340, y: 100 + Math.floor(idx / 3) * 240 },
        data: { service: s }
      }));

      const { edges } = syncNodesAndEdges(result.services, newNodes, []);

      set({
        services: result.services,
        nodes: newNodes,
        edges,
        selectedServiceId: null,
        activeModal: null,
      });

      get().autoLayout();
      return { success: true };
    },

    importDockerRun: (command) => {
      const service = parseDockerRunCommand(command);
      if (!service) {
        return { success: false, error: 'Could not parse docker run command' };
      }

      const { services, nodes, edges } = get();
      const updatedServices = [...services, service];
      const newNode: DockerCanvasNode = {
        id: service.id,
        type: 'serviceNode',
        position: { x: 300, y: 200 },
        data: { service }
      };

      const synced = syncNodesAndEdges(updatedServices, [...nodes, newNode], edges);

      set({
        services: updatedServices,
        nodes: synced.nodes,
        edges: synced.edges,
        selectedServiceId: service.id,
        activeModal: null
      });

      return { success: true };
    },

    autoLayout: () => {
      const { services, nodes, edges } = get();
      
      const gateways = services.filter(s => s.category === 'gateway');
      const frontends = services.filter(s => s.category === 'frontend');
      const backends = services.filter(s => s.category === 'backend' || (s.category === 'custom' && s.isCustomBuild));
      const datastores = services.filter(s => s.category === 'database' || s.category === 'queue' || s.category === 'ai' || s.category === 'tool');
      const others = services.filter(s => !gateways.includes(s) && !frontends.includes(s) && !backends.includes(s) && !datastores.includes(s));

      const updatedNodes: DockerCanvasNode[] = [];

      const positionGroup = (group: DockerService[], colX: number, startY: number, spacingY: number) => {
        group.forEach((svc, i) => {
          updatedNodes.push({
            id: svc.id,
            type: 'serviceNode',
            position: { x: colX, y: startY + i * spacingY },
            data: { service: svc }
          });
        });
      };

      let currentX = 80;
      if (gateways.length > 0) {
        positionGroup(gateways, currentX, 100, 220);
        currentX += 340;
      }
      if (frontends.length > 0) {
        positionGroup(frontends, currentX, 100, 220);
        currentX += 340;
      }
      if (backends.length > 0) {
        positionGroup(backends, currentX, 100, 220);
        currentX += 340;
      }
      if (datastores.length > 0) {
        positionGroup(datastores, currentX, 60, 200);
        currentX += 340;
      }
      if (others.length > 0) {
        positionGroup(others, currentX, 100, 220);
      }

      const synced = syncNodesAndEdges(services, updatedNodes, edges);

      set({
        nodes: synced.nodes,
        edges: synced.edges,
      });
    },

    clearCanvas: () => {
      set({
        services: [],
        nodes: [],
        edges: [],
        selectedServiceId: null,
      });
    },

    autoFixIssue: (issueId, serviceId) => {
      const { services, updateService } = get();
      
      if (issueId.startsWith('missing_db_volume_') && serviceId) {
        const svc = services.find(s => s.id === serviceId);
        if (svc) {
          const defaultPath = svc.name.includes('postgres') ? '/var/lib/postgresql/data' :
                              svc.name.includes('mysql') ? '/var/lib/mysql' :
                              svc.name.includes('mongo') ? '/data/db' : '/var/lib/data';
          
          updateService(serviceId, {
            volumes: [
              ...svc.volumes,
              {
                id: `vol_${Date.now()}`,
                hostPath: `${svc.name}_data`,
                containerPath: defaultPath,
                type: 'volume',
                description: 'Auto-configured persistent volume'
              }
            ]
          });
        }
      }
    },
  };
});
