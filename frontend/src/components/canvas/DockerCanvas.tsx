import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  NodeTypes,
  ConnectionLineType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useDockerStore } from '../../store/useDockerStore';
import { CustomServiceNode } from './CustomServiceNode';
import { SERVICE_CATALOG } from '../../catalog/serviceCatalog';
import { toast } from '../ui/Toast';

const DockerCanvasInner: React.FC = () => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    selectService,
    addServiceFromCatalog,
  } = useDockerStore();

  const { screenToFlowPosition } = useReactFlow();

  const nodeTypes: NodeTypes = useMemo(() => ({
    serviceNode: CustomServiceNode as any,
  }), []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const catalogId = event.dataTransfer.getData('application/dockcraft-service');
      if (!catalogId) return;

      const catalogItem = SERVICE_CATALOG.find(c => c.catalogId === catalogId);
      if (!catalogItem) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addServiceFromCatalog(catalogItem, position);
      toast.success('Service Added', catalogItem.displayName);
    },
    [screenToFlowPosition, addServiceFromCatalog]
  );

  return (
    <div className="w-full h-full relative select-none bg-theme-bg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onPaneClick={() => selectService(null)}
        onDragOver={onDragOver}
        onDrop={onDrop}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{
          stroke: '#06B6D4',
          strokeWidth: 3,
          strokeDasharray: '6 6'
        }}
        defaultEdgeOptions={{
          animated: true,
          style: { strokeWidth: 2.5 },
          type: 'smoothstep'
        }}
        deleteKeyCode={['Backspace', 'Delete']}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="var(--border-color, #1e293b)"
        />
        <Controls
          className="!bg-theme-card !border !border-theme-border !rounded-xl !shadow-2xl overflow-hidden [&>button]:!bg-theme-card [&>button]:!border-b [&>button]:!border-theme-border [&>button]:!text-theme-text [&>button:hover]:!bg-theme-hover"
        />
        <MiniMap
          className="!bg-theme-card/90 !border !border-theme-border !rounded-xl overflow-hidden shadow-2xl !bottom-4 !right-4"
          nodeColor={(node) => {
            const svc = (node.data as any)?.service;
            return svc?.color || '#3B82F6';
          }}
          maskColor="rgba(0, 0, 0, 0.6)"
          zoomable
          pannable
        />
      </ReactFlow>

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6 text-center">
          <div className="max-w-md p-6 rounded-2xl bg-theme-card/90 border border-theme-border backdrop-blur-md shadow-2xl pointer-events-auto">
            <h3 className="text-lg font-bold text-theme-text mb-2">Architecture Canvas Empty</h3>
            <p className="text-sm text-theme-muted mb-4 leading-relaxed">
              Drag services from the left catalog or choose a starter stack from Templates.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => useDockerStore.getState().setActiveModal('templates')}
                className="px-4 py-2 bg-theme-accent hover:opacity-90 text-white rounded-lg text-sm font-medium transition-opacity shadow-lg shadow-theme-accent/20"
              >
                Browse Templates
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const DockerCanvas: React.FC = () => {
  return (
    <ReactFlowProvider>
      <DockerCanvasInner />
    </ReactFlowProvider>
  );
};
