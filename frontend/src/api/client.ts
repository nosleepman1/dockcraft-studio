import { DockerService, Project, SecurityIssue } from '../types/docker';

const API_BASE_URL = 'http://localhost:8080/api';

export interface SystemStatus {
  dockerAvailable: boolean;
  dockerVersion: string;
  runningStacks: number;
  os: string;
}

export interface DockerHubItem {
  name: string;
  description: string;
  starCount: number;
  isOfficial: boolean;
  pullCount: string;
}

export interface FSDirEntry {
  name: string;
  path: string;
  isDir: boolean;
  modTime?: string;
  isParent?: boolean;
}

export interface DiskFilePayload {
  relativePath: string;
  content: string;
}

<<<<<<< HEAD
=======
export interface ScanProjectResult {
  projectName: string;
  rootPath: string;
  detectedStack: string;
  detectedLanguages: string[];
  detectedDatabases: string[];
  services: DockerService[];
  totalFilesScanned: number;
}

export interface ContainerStat {
  id: string;
  name: string;
  cpuPerc: string;
  memUsage: string;
  memPerc: string;
  netIO: string;
  blockIO: string;
  pids: string;
  status: string;
  timestamp: string;
}

>>>>>>> bf34f7e (feat(frontend): implement visual ReactFlow canvas, magnetic glowing handles, bidirectional auto-wiring & live code generators)
export const api = {
  // Health & System
  getHealth: async (): Promise<{ status: string; service: string }> => {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) throw new Error('Backend offline');
    return res.json();
  },

  getSystemStatus: async (): Promise<SystemStatus> => {
    const res = await fetch(`${API_BASE_URL}/system/status`);
    if (!res.ok) throw new Error('Failed to get system status');
    return res.json();
  },

<<<<<<< HEAD
  // Local File System Navigation & Injection
=======
  // Local File System Navigation, Injection & Scanner
>>>>>>> bf34f7e (feat(frontend): implement visual ReactFlow canvas, magnetic glowing handles, bidirectional auto-wiring & live code generators)
  getFSRoots: async (): Promise<FSDirEntry[]> => {
    const res = await fetch(`${API_BASE_URL}/fs/roots`);
    if (!res.ok) throw new Error('Failed to get FS roots');
    return res.json();
  },

  browseFS: async (path?: string): Promise<{ currentPath: string; entries: FSDirEntry[] }> => {
    const url = path ? `${API_BASE_URL}/fs/browse?path=${encodeURIComponent(path)}` : `${API_BASE_URL}/fs/browse`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to browse directory');
    return res.json();
  },

  createFSDir: async (parentPath: string, dirName: string): Promise<{ success: boolean; path: string }> => {
    const res = await fetch(`${API_BASE_URL}/fs/create-dir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parentPath, dirName }),
    });
    if (!res.ok) throw new Error('Failed to create folder');
    return res.json();
  },

  writeStackToDisk: async (targetPath: string, files: DiskFilePayload[]): Promise<{ success: boolean; targetPath: string; count: number; writtenFiles: string[] }> => {
    const res = await fetch(`${API_BASE_URL}/fs/write-stack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetPath, files }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || 'Failed to write stack files to disk');
    }
    return res.json();
  },

  deployAtPath: async (targetPath: string): Promise<{ status: string; targetPath: string }> => {
    const res = await fetch(`${API_BASE_URL}/docker/deploy-at-path`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetPath }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || 'Failed to deploy at specified path');
    }
    return res.json();
  },

<<<<<<< HEAD
=======
  scanProjectDirectory: async (path: string): Promise<ScanProjectResult> => {
    const res = await fetch(`${API_BASE_URL}/fs/scan-project`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || 'Failed to scan repository directory');
    }
    return res.json();
  },

  // Docker Live Stats & Container Controls
  getContainerStats: async (): Promise<ContainerStat[]> => {
    const res = await fetch(`${API_BASE_URL}/docker/stats`);
    if (!res.ok) return [];
    return res.json();
  },

  restartContainer: async (name: string): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${API_BASE_URL}/docker/container/restart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || `Failed to restart ${name}`);
    }
    return res.json();
  },

  getContainerLogs: async (name: string): Promise<{ container: string; logs: string }> => {
    const res = await fetch(`${API_BASE_URL}/docker/container/logs?name=${encodeURIComponent(name)}`);
    if (!res.ok) throw new Error(`Failed to fetch logs for ${name}`);
    return res.json();
  },

>>>>>>> bf34f7e (feat(frontend): implement visual ReactFlow canvas, magnetic glowing handles, bidirectional auto-wiring & live code generators)
  // Projects CRUD
  listProjects: async (): Promise<Project[]> => {
    const res = await fetch(`${API_BASE_URL}/projects`);
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },

  saveProject: async (project: Partial<Project>): Promise<Project> => {
    const res = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...project, createdAt: new Date().toISOString() }),
    });
    if (!res.ok) throw new Error('Failed to save project');
    return res.json();
  },

  getProject: async (id: string): Promise<Project> => {
    const res = await fetch(`${API_BASE_URL}/projects/${id}`);
    if (!res.ok) throw new Error('Project not found');
    return res.json();
  },

  deleteProject: async (id: string): Promise<boolean> => {
    const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  },

  // Generator & Audit from Go Backend
  generateCompose: async (services: DockerService[]): Promise<{ composeYaml: string; env: string; envExample: string }> => {
    const res = await fetch(`${API_BASE_URL}/generate/compose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ services }),
    });
    if (!res.ok) throw new Error('Failed to generate compose');
    return res.json();
  },

  auditStack: async (services: DockerService[]): Promise<{ issues: SecurityIssue[]; count: number }> => {
    const res = await fetch(`${API_BASE_URL}/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ services }),
    });
    if (!res.ok) throw new Error('Failed to audit stack');
    return res.json();
  },

  // Docker Hub Search
  searchDockerHub: async (query: string): Promise<DockerHubItem[]> => {
    const res = await fetch(`${API_BASE_URL}/hub/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    return res.json();
  },

  // Live Docker Commands
  deployStack: async (services: DockerService[]): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE_URL}/docker/deploy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ services }),
    });
    if (!res.ok) throw new Error('Deployment failed');
    return res.json();
  },

  stopStack: async (): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE_URL}/docker/stop`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Stop failed');
    return res.json();
  },

  getContainerStatus: async (): Promise<{ running: boolean; raw: string }> => {
    const res = await fetch(`${API_BASE_URL}/docker/ps`);
    if (!res.ok) return { running: false, raw: '' };
    return res.json();
  },
};
