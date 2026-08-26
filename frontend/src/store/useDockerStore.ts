import { create } from 'zustand';
import {
  Connection,
  EdgeChange,
  NodeChange,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType
} from '@xyflow/react';
import { DockerService, DockerNetwork, DockerVolume, Project, ProjectFlow } from '../types/docker';
import { DockerCanvasNode, DockerCanvasEdge } from '../types/graph';
import { CatalogItem, SERVICE_CATALOG } from '../catalog/serviceCatalog';
import { ARCHITECTURE_TEMPLATES } from '../catalog/templates';
import { autoWireServices } from '../engine/autoWiring';
import { parseDockerComposeYaml, parseDockerRunCommand } from '../engine/composeParser';
import { generateDockerComposeYaml } from '../engine/composeGenerator';
import { generateDockerfileForService } from '../engine/dockerfileGenerator';
import { generateNginxConfig } from '../engine/nginxGenerator';
import { generateEnvFiles } from '../engine/envGenerator';
import { generateStartScriptSh, generateStartScriptPs1, generateReadmeMd } from '../engine/scriptGenerator';
import { ThemeMode, applyTheme, getInitialTheme } from '../themes/themeConfig';
<<<<<<< HEAD
import { api, SystemStatus, DiskFilePayload } from '../api/client';
import { LogMessage } from '../api/websocket';
=======
import { api, SystemStatus, DiskFilePayload, ScanProjectResult } from '../api/client';
import { LogMessage } from '../api/websocket';
import { hardenAllStackSecrets } from '../engine/secretsVault';
>>>>>>> bf34f7e (feat(frontend): implement visual ReactFlow canvas, magnetic glowing handles, bidirectional auto-wiring & live code generators)
import { toast } from '../components/ui/Toast';

interface DockerState {
  projectName: string;
  currentProjectId: string;
  currentFlowId: string;
  isDashboardOpen: boolean;

  services: DockerService[];
  networks: DockerNetwork[];
  volumes: DockerVolume[];
  selectedServiceId: string | null;
  nodes: DockerCanvasNode[];
  edges: DockerCanvasEdge[];
  
  // Themes
  currentTheme: ThemeMode;

  // Local Workspace & Direct Disk Injection
  targetProjectPath: string;
  serviceTargetFolders: Record<string, string>;

  // Backend & Docker Runtime Integration
  isBackendConnected: boolean;
  systemStatus: SystemStatus | null;
  isDeploying: boolean;
  isStackRunning: boolean;
  isTerminalOpen: boolean;
  liveLogs: LogMessage[];
  savedProjects: Project[];

  // Modals & Tabs
<<<<<<< HEAD
  activeModal: 'preview' | 'templates' | 'import' | 'security' | 'projects' | 'dockerhub' | 'workspace_sync' | 'directory_picker' | null;
  activePreviewTab: 'compose' | 'dockerfile' | 'nginx' | 'env' | 'scripts' | 'readme';
  previewSelectedServiceId: string | null;

=======
  activeModal: 'preview' | 'templates' | 'import' | 'security' | 'projects' | 'dockerhub' | 'workspace_sync' | 'directory_picker' | 'scanner' | 'production_deploy' | null;
  activePreviewTab: 'compose' | 'dockerfile' | 'nginx' | 'env' | 'scripts' | 'readme';
  previewSelectedServiceId: string | null;

  // Scanner & Secrets
  applyScannedArchitecture: (result: ScanProjectResult) => void;
  hardenAllStackSecretsAction: () => void;

>>>>>>> bf34f7e (feat(frontend): implement visual ReactFlow canvas, magnetic glowing handles, bidirectional auto-wiring & live code generators)
  // Dashboard & Multi-Project / Multi-Flow Actions
  openDashboard: () => void;
  closeDashboard: () => void;
  createNewProject: (name: string, templateId?: string) => string;
  switchProject: (projectId: string) => void;
  duplicateProject: (projectId: string) => void;
  deleteProject: (projectId: string) => Promise<void>;
  switchFlow: (flowId: string) => void;
  createFlow: (flowName: string) => void;
  deleteFlow: (flowId: string) => void;

  // Actions
  setTheme: (theme: ThemeMode) => void;
  setProjectName: (name: string) => void;
  setTargetProjectPath: (path: string) => void;
  setServiceTargetFolder: (serviceId: string, folder: string) => void;
  selectService: (serviceId: string | null) => void;
  setActiveModal: (modal: DockerState['activeModal']) => void;
  setActivePreviewTab: (tab: DockerState['activePreviewTab']) => void;
  setPreviewSelectedServiceId: (id: string | null) => void;
  toggleTerminal: () => void;
  clearLogs: () => void;
  addLogMessage: (msg: LogMessage) => void;

  // Direct Disk Injection & Run
  injectStackToDisk: () => Promise<boolean>;
  deployStackAtCustomPath: () => Promise<void>;

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
<<<<<<< HEAD
=======
  const edgeSet = new Set<string>();

>>>>>>> bf34f7e (feat(frontend): implement visual ReactFlow canvas, magnetic glowing handles, bidirectional auto-wiring & live code generators)
  services.forEach(sourceService => {
    sourceService.dependsOn.forEach(dep => {
      const targetService = services.find(s => s.id === dep.serviceId);
      if (targetService) {
        const edgeId = `e-${sourceService.id}-${targetService.id}`;
<<<<<<< HEAD
        
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
=======
        if (!edgeSet.has(edgeId)) {
          edgeSet.add(edgeId);

          let strokeColor = '#06B6D4'; // Bright Cyan
          if (targetService.category === 'database') strokeColor = '#10B981'; // Emerald
          else if (targetService.category === 'queue') strokeColor = '#F97316'; // Orange
          else if (targetService.category === 'ai') strokeColor = '#A855F7'; // Purple
          else if (sourceService.category === 'gateway') strokeColor = '#3B82F6'; // Blue

          edges.push({
            id: edgeId,
            source: sourceService.id,
            target: targetService.id,
            type: 'smoothstep',
            animated: true,
            style: { 
              stroke: strokeColor, 
              strokeWidth: 3.5,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: strokeColor,
              width: 22,
              height: 22
            },
            data: {
              relationType: targetService.category as any,
            }
          });
        }
>>>>>>> bf34f7e (feat(frontend): implement visual ReactFlow canvas, magnetic glowing handles, bidirectional auto-wiring & live code generators)
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

<<<<<<< HEAD
  const initialNodes: DockerCanvasNode[] = [
    { id: 'svc_next', type: 'serviceNode', position: { x: 80, y: 150 }, data: { service: starterServices[0] } },
    { id: 'svc_api', type: 'serviceNode', position: { x: 460, y: 150 }, data: { service: starterServices[1] } },
    { id: 'svc_db', type: 'serviceNode', position: { x: 840, y: 60 }, data: { service: starterServices[2] } },
    { id: 'svc_redis', type: 'serviceNode', position: { x: 840, y: 280 }, data: { service: starterServices[3] } },
  ];
=======
  const initialNodes: DockerCanvasNode[] = starterServices.map((s, idx) => {
    let x = 80;
    let y = 150;
    if (s.category === 'gateway') { x = 60; y = 150; }
    else if (s.category === 'frontend') { x = 360; y = 150; }
    else if (s.category === 'backend') { x = 680; y = 150; }
    else if (s.category === 'database') { x = 1000; y = 80; }
    else if (s.category === 'queue') { x = 1000; y = 280; }
    else {
      x = 100 + (idx % 3) * 320;
      y = 100 + Math.floor(idx / 3) * 260;
    }

    return {
      id: s.id,
      type: 'serviceNode',
      position: { x, y },
      data: { service: s }
    };
  });
>>>>>>> bf34f7e (feat(frontend): implement visual ReactFlow canvas, magnetic glowing handles, bidirectional auto-wiring & live code generators)

  const { edges: initialEdges } = syncNodesAndEdges(starterServices, initialNodes, []);

  const defaultProjectPath = 'C:\\Users\\abash\\Desktop\\dockcraft-studio';

<<<<<<< HEAD
  const defaultServiceFolders: Record<string, string> = {
    svc_next: 'frontend',
    svc_api: 'backend',
  };
=======
  const defaultServiceFolders: Record<string, string> = {};
  starterServices.forEach(s => {
    if (s.category === 'frontend') defaultServiceFolders[s.id] = 'frontend';
    if (s.category === 'backend') defaultServiceFolders[s.id] = 'backend';
  });
>>>>>>> bf34f7e (feat(frontend): implement visual ReactFlow canvas, magnetic glowing handles, bidirectional auto-wiring & live code generators)

  const initialProject: Project = {
    id: 'proj_default',
    name: 'Fullstack Monorepo',
    description: 'Next.js + FastAPI + PostgreSQL + Redis',
    activeFlowId: 'dev',
    flows: [
      {
        id: 'dev',
        name: 'development',
        services: starterServices,
        targetProjectPath: defaultProjectPath,
        serviceTargetFolders: defaultServiceFolders
      },
      {
        id: 'prod',
        name: 'production',
        services: starterServices,
        targetProjectPath: defaultProjectPath,
        serviceTargetFolders: defaultServiceFolders
      }
    ],
    services: starterServices,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    projectName: 'Fullstack Monorepo',
    currentProjectId: 'proj_default',
    currentFlowId: 'dev',
    isDashboardOpen: false,

    services: starterServices,
    networks: initialNetworks,
    volumes: initialVolumes,
    selectedServiceId: null,
    nodes: initialNodes,
    edges: initialEdges,

    currentTheme: initialTheme,

    targetProjectPath: defaultProjectPath,
    serviceTargetFolders: defaultServiceFolders,

    isBackendConnected: false,
    systemStatus: null,
    isDeploying: false,
    isStackRunning: false,
    isTerminalOpen: false,
    liveLogs: [],
    savedProjects: [initialProject],

    activeModal: null,
    activePreviewTab: 'compose',
    previewSelectedServiceId: null,

    openDashboard: () => {
      get().fetchSavedProjects();
      set({ isDashboardOpen: true });
    },
    closeDashboard: () => set({ isDashboardOpen: false }),

<<<<<<< HEAD
=======
    applyScannedArchitecture: (result: ScanProjectResult) => {
      const newId = `proj_${Date.now()}`;
      const defaultFlow: ProjectFlow = {
        id: 'dev',
        name: 'development',
        services: result.services,
        targetProjectPath: result.rootPath,
        serviceTargetFolders: {}
      };

      const newProj: Project = {
        id: newId,
        name: result.projectName,
        description: `Auto-scanned: ${result.detectedStack}`,
        activeFlowId: 'dev',
        flows: [defaultFlow],
        services: result.services,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const newNodes: DockerCanvasNode[] = result.services.map((s, idx) => ({
        id: s.id,
        type: 'serviceNode',
        position: { x: 100 + (idx % 3) * 320, y: 100 + Math.floor(idx / 3) * 260 },
        data: { service: s }
      }));
      const { edges } = syncNodesAndEdges(result.services, newNodes, []);

      set(state => ({
        currentProjectId: newId,
        currentFlowId: 'dev',
        projectName: result.projectName,
        targetProjectPath: result.rootPath,
        services: result.services,
        nodes: newNodes,
        edges,
        savedProjects: [newProj, ...state.savedProjects],
        selectedServiceId: null,
      }));

      get().autoLayout();
      get().saveProjectToBackend();
    },

    hardenAllStackSecretsAction: () => {
      const { services, nodes, edges } = get();
      const hardened = hardenAllStackSecrets(services);
      const synced = syncNodesAndEdges(hardened.services, nodes, edges);
      set({
        services: hardened.services,
        nodes: synced.nodes,
        edges: synced.edges,
      });
      get().saveProjectToBackend();
      toast.success('Stack Hardened', `Generated ${hardened.count} cryptographically secure secrets`);
    },

>>>>>>> bf34f7e (feat(frontend): implement visual ReactFlow canvas, magnetic glowing handles, bidirectional auto-wiring & live code generators)
    createNewProject: (name, templateId) => {
      const newId = `proj_${Date.now()}`;
      let newServices: DockerService[] = [];

      if (templateId) {
        const tpl = ARCHITECTURE_TEMPLATES.find(t => t.id === templateId);
        if (tpl) {
          newServices = JSON.parse(JSON.stringify(tpl.services));
        }
      }

      const defaultFlow: ProjectFlow = {
        id: 'dev',
        name: 'development',
        services: newServices,
        targetProjectPath: defaultProjectPath,
        serviceTargetFolders: {}
      };

      const newProj: Project = {
        id: newId,
        name,
        description: `${newServices.length} containers`,
        activeFlowId: 'dev',
        flows: [defaultFlow],
        services: newServices,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const newNodes: DockerCanvasNode[] = newServices.map((s, idx) => ({
        id: s.id,
        type: 'serviceNode',
        position: { x: 100 + (idx % 3) * 320, y: 100 + Math.floor(idx / 3) * 260 },
        data: { service: s }
      }));
      const { edges } = syncNodesAndEdges(newServices, newNodes, []);

      set(state => ({
        currentProjectId: newId,
        currentFlowId: 'dev',
        projectName: name,
        services: newServices,
        nodes: newNodes,
        edges,
        savedProjects: [newProj, ...state.savedProjects],
        selectedServiceId: null,
      }));

      get().saveProjectToBackend();
      return newId;
    },

    switchProject: (projectId) => {
      const { savedProjects } = get();
      const proj = savedProjects.find(p => p.id === projectId);
      if (!proj) return;

      const activeFlow = proj.flows?.find(f => f.id === proj.activeFlowId) || proj.flows?.[0] || {
        id: 'dev',
        name: 'dev',
        services: proj.services || []
      };

      const currentServices = activeFlow.services || proj.services || [];
      const newNodes: DockerCanvasNode[] = currentServices.map((s, idx) => ({
        id: s.id,
        type: 'serviceNode',
        position: { x: 100 + (idx % 3) * 320, y: 100 + Math.floor(idx / 3) * 260 },
        data: { service: s }
      }));
      const { edges } = syncNodesAndEdges(currentServices, newNodes, []);

      set({
        currentProjectId: proj.id,
        projectName: proj.name,
        currentFlowId: activeFlow.id,
        services: currentServices,
        nodes: newNodes,
        edges,
        targetProjectPath: activeFlow.targetProjectPath || defaultProjectPath,
        serviceTargetFolders: activeFlow.serviceTargetFolders || {},
        selectedServiceId: null,
        isDashboardOpen: false,
      });

      get().autoLayout();
      toast.info('Switched Project', proj.name);
    },

    duplicateProject: (projectId) => {
      const { savedProjects } = get();
      const orig = savedProjects.find(p => p.id === projectId);
      if (!orig) return;

      const clone: Project = JSON.parse(JSON.stringify(orig));
      clone.id = `proj_${Date.now()}`;
      clone.name = `${orig.name} (Copy)`;
      clone.createdAt = new Date().toISOString();
      clone.updatedAt = new Date().toISOString();

      set(state => ({
        savedProjects: [clone, ...state.savedProjects]
      }));

      api.saveProject(clone);
      toast.success('Project Duplicated', clone.name);
    },

    deleteProject: async (projectId) => {
      await api.deleteProject(projectId);
      set(state => ({
        savedProjects: state.savedProjects.filter(p => p.id !== projectId)
      }));
      toast.info('Project Deleted');
    },

    switchFlow: (flowId) => {
      const { currentProjectId, savedProjects, services, targetProjectPath, serviceTargetFolders } = get();
      const proj = savedProjects.find(p => p.id === currentProjectId);
      if (!proj) return;

      // Save current flow before switching
      const updatedFlows = (proj.flows || []).map(f => {
        if (f.id === get().currentFlowId) {
          return { ...f, services, targetProjectPath, serviceTargetFolders };
        }
        return f;
      });

      const targetFlow = updatedFlows.find(f => f.id === flowId);
      if (!targetFlow) return;

      const flowServices = targetFlow.services || [];
      const newNodes: DockerCanvasNode[] = flowServices.map((s, idx) => ({
        id: s.id,
        type: 'serviceNode',
        position: { x: 100 + (idx % 3) * 320, y: 100 + Math.floor(idx / 3) * 260 },
        data: { service: s }
      }));
      const { edges } = syncNodesAndEdges(flowServices, newNodes, []);

      proj.flows = updatedFlows;
      proj.activeFlowId = flowId;

      set({
        currentFlowId: flowId,
        services: flowServices,
        nodes: newNodes,
        edges,
        targetProjectPath: targetFlow.targetProjectPath || targetProjectPath,
        serviceTargetFolders: targetFlow.serviceTargetFolders || {},
        selectedServiceId: null,
      });

      toast.info(`Flow: ${targetFlow.name.toUpperCase()}`);
    },

    createFlow: (flowName) => {
      const { currentProjectId, savedProjects, services, targetProjectPath, serviceTargetFolders } = get();
      const proj = savedProjects.find(p => p.id === currentProjectId);
      if (!proj) return;

      const newFlowId = `flow_${Date.now().toString(36)}`;
      const newFlow: ProjectFlow = {
        id: newFlowId,
        name: flowName,
        services: JSON.parse(JSON.stringify(services)),
        targetProjectPath,
        serviceTargetFolders: { ...serviceTargetFolders }
      };

      const updatedFlows = [...(proj.flows || []), newFlow];
      proj.flows = updatedFlows;

      set({
        currentFlowId: newFlowId,
      });

      get().saveProjectToBackend();
      toast.success(`Flow Created: ${flowName}`);
    },

    deleteFlow: (flowId) => {
      const { currentProjectId, savedProjects } = get();
      const proj = savedProjects.find(p => p.id === currentProjectId);
      if (!proj || !proj.flows || proj.flows.length <= 1) {
        toast.warning('Cannot delete the last remaining flow');
        return;
      }

      proj.flows = proj.flows.filter(f => f.id !== flowId);
      if (proj.flows.length > 0) {
        get().switchFlow(proj.flows[0].id);
      }
    },

    setTheme: (theme) => {
      applyTheme(theme);
      set({ currentTheme: theme });
    },

    setProjectName: (name) => {
      const { currentProjectId, savedProjects } = get();
      set({ projectName: name });
      const proj = savedProjects.find(p => p.id === currentProjectId);
      if (proj) {
        proj.name = name;
        get().saveProjectToBackend();
      }
    },

    setTargetProjectPath: (path) => set({ targetProjectPath: path }),
    setServiceTargetFolder: (serviceId, folder) => {
      set(state => ({
        serviceTargetFolders: { ...state.serviceTargetFolders, [serviceId]: folder }
      }));
    },

    selectService: (serviceId) => set({ selectedServiceId: serviceId }),
    setActiveModal: (modal) => set({ activeModal: modal }),
    setActivePreviewTab: (tab) => set({ activePreviewTab: tab }),
    setPreviewSelectedServiceId: (id) => set({ previewSelectedServiceId: id }),
    toggleTerminal: () => set(state => ({ isTerminalOpen: !state.isTerminalOpen })),
    clearLogs: () => set({ liveLogs: [] }),
    addLogMessage: (msg) => set(state => ({ liveLogs: [...state.liveLogs.slice(-300), msg] })),

    injectStackToDisk: async (): Promise<boolean> => {
      const { services, targetProjectPath, serviceTargetFolders } = get();
      if (!targetProjectPath) {
        toast.error('No Destination Folder', 'Please select a local folder path first');
        return false;
      }

      try {
        const files: DiskFilePayload[] = [];

        // 1. docker-compose.yml
        files.push({
          relativePath: 'docker-compose.yml',
          content: generateDockerComposeYaml(services)
        });

        // 2. .env and .env.example
        const { envContent, envExampleContent } = generateEnvFiles(services);
        files.push({ relativePath: '.env', content: envContent });
        files.push({ relativePath: '.env.example', content: envExampleContent });

        // 3. Nginx config
        const hasGateway = services.some(s => s.category === 'gateway' || s.image?.includes('nginx'));
        const hasFrontAndBack = services.some(s => s.category === 'backend') && services.some(f => f.category === 'frontend');
        if (hasGateway || hasFrontAndBack) {
          files.push({
            relativePath: 'nginx/nginx.conf',
            content: generateNginxConfig(services)
          });
        }

        // 4. Custom services Dockerfiles
        services.filter(s => s.isCustomBuild).forEach(s => {
          const folder = serviceTargetFolders[s.id] || s.name;
          const generated = generateDockerfileForService(s);
          files.push({
            relativePath: `${folder}/Dockerfile`,
            content: generated.dockerfileContent
          });
          files.push({
            relativePath: `${folder}/.dockerignore`,
            content: generated.dockerignoreContent
          });
        });

        // 5. Scripts & README
        files.push({ relativePath: 'start.sh', content: generateStartScriptSh(services) });
        files.push({ relativePath: 'start.ps1', content: generateStartScriptPs1(services) });
        files.push({ relativePath: 'README.md', content: generateReadmeMd(services) });

        const result = await api.writeStackToDisk(targetProjectPath, files);
        toast.success(`Injected ${result.count} Files!`, `Written directly into ${targetProjectPath}`);
        return true;
      } catch (err: any) {
        toast.error('Injection Failed', err.message || String(err));
        return false;
      }
    },

    deployStackAtCustomPath: async () => {
      const { targetProjectPath, injectStackToDisk } = get();
      set({ isDeploying: true, isTerminalOpen: true });

      const injected = await injectStackToDisk();
      if (!injected) {
        set({ isDeploying: false });
        return;
      }

      try {
        await api.deployAtPath(targetProjectPath);
        set({ isDeploying: false, isStackRunning: true });
        toast.success('Stack Running', `Docker Compose started in ${targetProjectPath}`);
      } catch (err: any) {
        set({ isDeploying: false });
        toast.error('Deploy Failed', err.message || String(err));
      }
    },

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
      const { projectName, currentProjectId, currentFlowId, services, savedProjects, targetProjectPath, serviceTargetFolders } = get();
      try {
        const proj = savedProjects.find(p => p.id === currentProjectId) || {
          id: currentProjectId,
          name: projectName,
          description: `Architecture with ${services.length} services`,
          activeFlowId: currentFlowId,
          flows: [{ id: currentFlowId, name: currentFlowId, services, targetProjectPath, serviceTargetFolders }],
          services,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        proj.name = projectName;
        proj.services = services;
        proj.updatedAt = new Date().toISOString();

        await api.saveProject(proj);
      } catch (err) {
        console.error('Failed to save project:', err);
      }
    },

    fetchSavedProjects: async () => {
      try {
        const list = await api.listProjects();
        if (list && list.length > 0) {
          set({ savedProjects: list });
        }
      } catch (_) {}
    },

    loadProjectFromBackend: async (id: string) => {
      try {
        const p = await api.getProject(id);
        get().switchProject(p.id);
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
<<<<<<< HEAD
      set({
        edges: applyEdgeChanges(changes, get().edges),
      });
=======
      const currentEdges = get().edges;
      const updatedEdges = applyEdgeChanges(changes, currentEdges);

      const removedChanges = changes.filter(c => c.type === 'remove');
      if (removedChanges.length > 0) {
        const removedIds = new Set(removedChanges.map(c => (c as any).id));
        const { services, nodes } = get();
        const updatedServices = services.map(s => ({
          ...s,
          dependsOn: s.dependsOn.filter(dep => !removedIds.has(`e-${s.id}-${dep.serviceId}`))
        }));
        const synced = syncNodesAndEdges(updatedServices, nodes, updatedEdges);
        set({
          services: updatedServices,
          nodes: synced.nodes,
          edges: synced.edges,
        });
        get().saveProjectToBackend();
        return;
      }

      set({ edges: updatedEdges });
>>>>>>> bf34f7e (feat(frontend): implement visual ReactFlow canvas, magnetic glowing handles, bidirectional auto-wiring & live code generators)
    },

    onConnect: (connection: Connection) => {
      const { services, nodes, edges } = get();
      if (!connection.source || !connection.target || connection.source === connection.target) return;

<<<<<<< HEAD
      const sourceService = services.find(s => s.id === connection.source);
      const targetService = services.find(s => s.id === connection.target);

      if (!sourceService || !targetService) return;

=======
      const sourceNode = nodes.find(n => n.id === connection.source);
      const targetNode = nodes.find(n => n.id === connection.target);
      const sourceService = services.find(s => s.id === connection.source) || (sourceNode?.data as any)?.service;
      const targetService = services.find(s => s.id === connection.target) || (targetNode?.data as any)?.service;

      if (!sourceService || !targetService) return;

      // 1. Auto-wire variables and network
>>>>>>> bf34f7e (feat(frontend): implement visual ReactFlow canvas, magnetic glowing handles, bidirectional auto-wiring & live code generators)
      const { updatedSource, updatedTarget, connectionDescription } = autoWireServices(sourceService, targetService);

      const updatedServices = services.map(s => {
        if (s.id === updatedSource.id) return updatedSource;
        if (s.id === updatedTarget.id) return updatedTarget;
        return s;
      });

<<<<<<< HEAD
      const synced = syncNodesAndEdges(updatedServices, nodes, edges);

      set({
        services: updatedServices,
        nodes: synced.nodes,
        edges: synced.edges,
      });

      toast.info('Auto-Wired Connection', connectionDescription);
=======
      // 2. Determine edge color
      let strokeColor = '#06B6D4';
      if (targetService.category === 'database' || sourceService.category === 'database') strokeColor = '#10B981';
      else if (targetService.category === 'queue' || sourceService.category === 'queue') strokeColor = '#F97316';
      else if (targetService.category === 'ai' || sourceService.category === 'ai') strokeColor = '#A855F7';
      else if (sourceService.category === 'gateway' || targetService.category === 'gateway') strokeColor = '#3B82F6';

      const edgeId = `e-${connection.source}-${connection.target}`;
      
      const newEdge: DockerCanvasEdge = {
        id: edgeId,
        source: connection.source,
        target: connection.target,
        type: 'smoothstep',
        animated: true,
        style: {
          stroke: strokeColor,
          strokeWidth: 3.5,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: strokeColor,
          width: 22,
          height: 22
        },
        data: {
          relationType: (targetService.category || 'generic') as any,
        }
      };

      const existingEdgesFiltered = edges.filter(e => e.id !== edgeId);
      const updatedEdges = [...existingEdgesFiltered, newEdge];

      // 3. Update nodes with updated services
      const updatedNodes = nodes.map(n => {
        const found = updatedServices.find(s => s.id === n.id);
        return found ? { ...n, data: { ...n.data, service: found } } : n;
      });

      set({
        services: updatedServices,
        nodes: updatedNodes,
        edges: updatedEdges,
      });

      get().saveProjectToBackend();
      toast.success('Connected & Auto-Wired', connectionDescription);
>>>>>>> bf34f7e (feat(frontend): implement visual ReactFlow canvas, magnetic glowing handles, bidirectional auto-wiring & live code generators)
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
