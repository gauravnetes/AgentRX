import { Handle, Position } from '@xyflow/react';

type NodeData = {
  label: string;
  sublabel: string | null;
  status: 'done' | 'running' | 'queued' | 'error' | 'gate';
};

const nodeStyles = {
  done: {
    background: '#0F2018',
    border: '1px solid #1A4030',
    titleColor: '#3A9E6F',
    subColor: '#2A7050',
  },
  running: {
    background: '#2A2010',
    border: '1.5px solid #5C4010',
    titleColor: '#D4920A',
    subColor: '#A06808',
  },
  queued: {
    background: '#161A20',
    border: '1px solid #252830',
    titleColor: '#4A5060',
    subColor: '#3A4050',
  },
  error: {
    background: '#200F0F',
    border: '1px solid #4A1A1A',
    titleColor: '#C04040',
    subColor: '#902020',
  },
  gate: {
    background: '#1A1228',
    border: '1.5px dashed #3A2060',
    titleColor: '#8A60C4',
    subColor: '#5A4090',
  },
};

export function PipelineNode({ data }: { data: NodeData }) {
  const style = nodeStyles[data.status];
  
  return (
    <div style={{
      background: style.background,
      border: style.border,
      borderRadius: 8,
      padding: '8px 12px',
      minWidth: 96,
      maxWidth: 120,
      position: 'relative',
    }}>
      {/* Running pulse indicator */}
      {data.status === 'running' && (
        <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-[#D4920A]">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4920A] opacity-75"></span>
        </span>
      )}
      
      <div style={{ color: style.titleColor, fontSize: 11, fontWeight: 500, fontFamily: 'var(--font-sans)' }}>
        {data.label}
      </div>
      
      {data.sublabel && (
        <div style={{ color: style.subColor, fontSize: 10, marginTop: 2, fontFamily: 'var(--font-mono)' }}>
          {data.sublabel}
        </div>
      )}
      
      {/* Handles hidden — React Flow internal */}
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
}
