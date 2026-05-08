import { create } from 'zustand';

type PipelinePhase = 1 | 2 | 3 | 4 | 5;

interface PipelineState {
  threadId: string | null;
  moleculeName: string | null;
  formula: string | null;
  currentPhase: PipelinePhase;
  progressPercent: number;
  status: 'idle' | 'running' | 'awaiting_approval' | 'complete' | 'error';
  elapsedTime: string;

  setThreadId: (id: string | null) => void;
  setMoleculeName: (name: string | null) => void;
  startRun: (name: string) => void;
}

export const usePipelineStore = create<PipelineState>((set) => ({
  threadId: null,
  moleculeName: null,
  formula: null,
  currentPhase: 1,
  progressPercent: 0,
  status: 'idle',
  elapsedTime: '00:00',

  setThreadId: (id) => set({ threadId: id }),
  setMoleculeName: (name) => set({ moleculeName: name }),
  startRun: (name) => set({ 
    threadId: `th_${Math.random().toString(36).substring(7)}`, 
    moleculeName: name,
    formula: 'C22H24N2O8', // mock
    status: 'running',
    currentPhase: 1,
    progressPercent: 10,
    elapsedTime: '00:01'
  }),
}));
