"use client";

import { useMemo } from 'react';
import { ReactFlow, Background } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { PipelineNode } from './PipelineNode';
import { usePipelineStore } from '@/store/usePipelineStore';

const nodeTypes = {
  custom: PipelineNode,
};

export function PipelineDAG() {
  const { status, currentPhase } = usePipelineStore();

  const nodes = useMemo(() => [
    { id: 'web-intel',   type: 'custom', data: { label: 'Web Intel',   sublabel: '12 hits', status: currentPhase > 1 ? 'done' : status === 'running' ? 'running' : 'queued' }, position: { x: 0,   y: 40 } },
    { id: 'merge',       type: 'custom', data: { label: 'Merge',       sublabel: null,      status: currentPhase > 2 ? 'done' : currentPhase === 2 ? 'running' : 'queued' }, position: { x: 150, y: 52 } },
    { id: 'ip-clear',    type: 'custom', data: { label: 'IP Clearance',sublabel: '5/8',     status: currentPhase > 3 ? 'done' : currentPhase === 3 ? 'running' : 'queued' }, position: { x: 280, y: 40 } },
    { id: 'gate',        type: 'custom', data: { label: '⚑ Approval',  sublabel: 'Human',   status: currentPhase > 4 ? 'done' : currentPhase === 4 ? 'gate' : 'queued' },    position: { x: 430, y: 52 } },
    { id: 'commercial',  type: 'custom', data: { label: 'Commercial',  sublabel: null,      status: currentPhase > 5 ? 'done' : currentPhase === 5 ? 'running' : 'queued' }, position: { x: 560, y: 40 } },
    { id: 'supply',      type: 'custom', data: { label: 'IQVIA Supply',sublabel: null,      status: currentPhase > 5 ? 'done' : 'queued' },                                  position: { x: 710, y: 40 } },
  ], [status, currentPhase]);

  const edges = useMemo(() => [
    { id: 'e1', source: 'web-intel', target: 'merge', style: { stroke: currentPhase > 1 ? '#1A4030' : '#5C4010', strokeWidth: 1.5, strokeDasharray: currentPhase > 1 ? 'none' : '6 4' }, animated: currentPhase === 1 && status === 'running' },
    { id: 'e2', source: 'merge', target: 'ip-clear', style: { stroke: currentPhase > 2 ? '#1A4030' : currentPhase === 2 ? '#5C4010' : '#252830', strokeWidth: 1.5, strokeDasharray: currentPhase > 2 ? 'none' : '4 4' }, animated: currentPhase === 2 },
    { id: 'e3', source: 'ip-clear', target: 'gate', style: { stroke: currentPhase > 3 ? '#1A4030' : currentPhase === 3 ? '#5C4010' : '#252830', strokeWidth: 1.5, strokeDasharray: currentPhase > 3 ? 'none' : '4 4' }, animated: currentPhase === 3 },
    { id: 'e4', source: 'gate', target: 'commercial', style: { stroke: currentPhase > 4 ? '#1A4030' : currentPhase === 4 ? '#5C4010' : '#252830', strokeWidth: 1.5, strokeDasharray: currentPhase > 4 ? 'none' : '4 4' }, animated: currentPhase === 4 },
    { id: 'e5', source: 'commercial', target: 'supply', style: { stroke: currentPhase > 5 ? '#1A4030' : currentPhase === 5 ? '#5C4010' : '#252830', strokeWidth: 1.5, strokeDasharray: currentPhase > 5 ? 'none' : '4 4' }, animated: currentPhase === 5 },
  ], [status, currentPhase]);

  return (
    <div className="w-full h-[110px]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        proOptions={{ hideAttribution: true }}
        style={{ background: 'transparent' }}
      />
    </div>
  );
}
