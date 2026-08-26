import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { 
  Database, 
  Server, 
  Globe, 
  Network, 
  Radio, 
  HardDrive, 
  Sparkles, 
  Box, 
  Code, 
  Zap, 
  Cpu, 
  Shield, 
  Trash2, 
  Copy, 
  CheckCircle2
} from 'lucide-react';
import { DockerCanvasNode } from '../../types/graph';
import { useDockerStore } from '../../store/useDockerStore';
import { toast } from '../ui/Toast';

const ICON_MAP: Record<string, React.ElementType> = {
  Database,
  Server,
  Globe,
  Network,
  Radio,
  HardDrive,
  Sparkles,
  Box,
  Code,
  Zap,
  Cpu,
  Shield,
};

export const CustomServiceNode = memo((props: NodeProps<DockerCanvasNode>) => {
  const { data, selected } = props;
  const service = data.service;
  const { selectService, deleteService, duplicateService, selectedServiceId } = useDockerStore();

  const isCurrentSelected = selected || selectedServiceId === service.id;
  const IconComponent = ICON_MAP[service.icon] || Box;

  const hasHealth = service.healthCheck && service.healthCheck.enabled;
  const primaryPort = service.ports[0];

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteService(service.id);
    toast.info(`Removed ${service.displayName}`);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateService(service.id);
    toast.success(`Duplicated ${service.displayName}`);
  };

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        selectService(service.id);
      }}
      className={`relative group w-64 rounded-2xl transition-all duration-200 cursor-pointer backdrop-blur-xl select-none ${
        isCurrentSelected
          ? 'bg-theme-card border-2 border-theme-accent shadow-2xl scale-[1.02]'
          : 'bg-theme-card/90 border border-theme-border/80 hover:border-theme-accent/50 hover:shadow-xl hover:scale-[1.01]'
      }`}
    >
      {/* Target Connection Handle (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        id="target"
        className="!w-3 !h-3 !bg-theme-accent !border-2 !border-theme-bg hover:!scale-150 transition-transform !-left-1.5"
      />

      {/* Card Header */}
      <div className="p-3 border-b border-theme-border/60 flex items-center justify-between">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div 
            className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-inner"
            style={{ backgroundColor: `${service.color || '#3B82F6'}20`, color: service.color || '#3B82F6' }}
          >
            <IconComponent className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-theme-text text-xs truncate leading-tight">
              {service.displayName}
            </h4>
            <span className="text-[10px] font-mono text-theme-muted block truncate mt-0.5">
              {service.name}
            </span>
          </div>
        </div>

        {/* Quick Node Actions on hover */}
        <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleDuplicate}
            title="Duplicate"
            className="p-1 text-theme-muted hover:text-theme-text hover:bg-theme-hover rounded-lg transition-colors"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            onClick={handleDelete}
            title="Delete"
            className="p-1 text-theme-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Card Body - Ultra-Clean Metrics & Pills */}
      <div className="px-3 py-2 flex items-center justify-between text-[10px] font-mono text-theme-muted">
        {/* Source image / dockerfile pill */}
        <div className="flex items-center gap-1.5 truncate mr-2">
          {service.isCustomBuild ? (
            <span className="px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 font-semibold border border-indigo-500/20">
              Dockerfile
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded bg-theme-hover text-theme-text truncate max-w-[110px]" title={`${service.image}:${service.tag}`}>
              {service.image?.split('/')[1] || service.image || 'image'}
            </span>
          )}
        </div>

        {/* Port Pill */}
        {primaryPort ? (
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20 shrink-0">
            :{primaryPort.containerPort}
          </span>
        ) : (
          <span className="text-theme-muted/50">—</span>
        )}
      </div>

      {/* Bottom Footer Info */}
      <div className="px-3 py-1.5 border-t border-theme-border/40 flex items-center justify-between text-[9px] font-mono text-theme-muted">
        <div className="flex items-center gap-1.5">
          {service.env && service.env.length > 0 && (
            <span className="text-amber-400/90">{service.env.length} env</span>
          )}
          {service.volumes && service.volumes.length > 0 && (
            <span className="text-cyan-400/90">&bull; {service.volumes.length} vol</span>
          )}
        </div>

        {hasHealth && (
          <span className="text-emerald-400 flex items-center gap-1" title="Healthcheck active">
            <CheckCircle2 className="w-2.5 h-2.5" />
          </span>
        )}
      </div>

      {/* Source Connection Handle (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        id="source"
        className="!w-3 !h-3 !bg-theme-accent !border-2 !border-theme-bg hover:!scale-150 transition-transform !-right-1.5"
      />
    </div>
  );
});

CustomServiceNode.displayName = 'CustomServiceNode';
