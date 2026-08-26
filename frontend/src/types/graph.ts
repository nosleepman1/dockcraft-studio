import { Node, Edge } from '@xyflow/react';
import { DockerService } from './docker';

export type DockerNodeType = 'serviceNode';

export interface DockerNodeData extends Record<string, unknown> {
  service: DockerService;
  isSelected?: boolean;
  onEdit?: (serviceId: string) => void;
  onDelete?: (serviceId: string) => void;
  onDuplicate?: (serviceId: string) => void;
}

export type DockerCanvasNode = Node<DockerNodeData, DockerNodeType>;
export type DockerCanvasEdge = Edge<{
  relationType?: 'database' | 'api' | 'proxy' | 'queue' | 'ai' | 'generic';
  label?: string;
}>;
