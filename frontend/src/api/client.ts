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
      body: JSON.stringify(project),
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
