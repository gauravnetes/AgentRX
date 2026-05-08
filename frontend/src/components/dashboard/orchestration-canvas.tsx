"use client";

import React, { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Edge,
  Node,
  NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { PipelineStage, PipelineStageData } from "./pipeline-stage";

interface OrchestrationCanvasProps {
  currentStageIndex: number;
}

const nodeTypes: NodeTypes = {
  pipelineStage: PipelineStage,
};

const initialNodes: Node<PipelineStageData>[] = [
  {
    id: "stage-1",
    type: "pipelineStage",
    position: { x: 250, y: 50 },
    data: { label: "Pharmacodynamic Mapping", status: "pending", description: "Mapping biological pathways" },
  },
  {
    id: "stage-2",
    type: "pipelineStage",
    position: { x: 250, y: 180 },
    data: { label: "Patent Clearance", status: "pending", description: "Checking USPTO & WIPO" },
  },
  {
    id: "stage-3",
    type: "pipelineStage",
    position: { x: 250, y: 310 },
    data: { label: "Commercial Viability", status: "pending", description: "TAM & pricing analysis" },
  },
  {
    id: "stage-4",
    type: "pipelineStage",
    position: { x: 250, y: 440 },
    data: { label: "Supply Chain Analysis", status: "pending", description: "EXIM & manufacturing routes" },
  },
];

const initialEdges: Edge[] = [
  { id: "e1-2", source: "stage-1", target: "stage-2", animated: true, style: { stroke: "#FFFFFF", strokeWidth: 1 } },
  { id: "e2-3", source: "stage-2", target: "stage-3", animated: true, style: { stroke: "#FFFFFF", strokeWidth: 1 } },
  { id: "e3-4", source: "stage-3", target: "stage-4", animated: true, style: { stroke: "#FFFFFF", strokeWidth: 1 } },
];

export function OrchestrationCanvas({ currentStageIndex }: OrchestrationCanvasProps) {
  
  const nodes = useMemo(() => {
    return initialNodes.map((node, index) => {
      let status: "pending" | "active" | "completed" = "pending";
      if (index < currentStageIndex) status = "completed";
      else if (index === currentStageIndex) status = "active";

      return {
        ...node,
        data: {
          ...node.data,
          status,
        },
      };
    });
  }, [currentStageIndex]);

  const edges = useMemo(() => {
    return initialEdges.map((edge) => {
      // Determine if edge should be animated/highlighted based on active node
      const sourceIndex = parseInt(edge.source.replace("stage-", "")) - 1;
      const isPast = sourceIndex < currentStageIndex;
      const isActive = sourceIndex === currentStageIndex;
      
      return {
        ...edge,
        animated: isActive,
        style: {
          stroke: isPast || isActive ? "#FFFFFF" : "rgba(255,255,255,0.1)",
          strokeWidth: 1,
          opacity: isPast || isActive ? 1 : 0.5,
        }
      };
    });
  }, [currentStageIndex]);

  return (
    <div className="w-full h-[600px] relative rounded-2xl overflow-hidden border border-white/10 bg-black/20">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.5 }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.5}
        maxZoom={1.5}
        className="touch-none"
      >
        <Background color="rgba(255,255,255,0.05)" gap={24} size={1} />
        <Controls 
          className="!bg-[#131A2A] !border-white/[0.08] !rounded-xl !overflow-hidden [&>button]:!border-b-white/[0.08] [&>button]:!bg-transparent [&>button]:!text-[#F5F7FA] hover:[&>button]:!bg-white/[0.05]" 
          position="bottom-left" 
          showInteractive={false} 
        />
      </ReactFlow>
    </div>
  );
}
