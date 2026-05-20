import type {
  Insertion,
  NodeColor,
  Priority,
  SolutionNode,
} from '@/core/solution/types';

export type TimerMode = 'countup' | 'countdown';

export interface TimerState {
  mode: TimerMode;
  initialSeconds: number;
  startedAt: number | null;
  elapsedAtPause: number;
  isRunning: boolean;
}

export interface ScrambleData {
  text: string;
  image: string | null;
  imageHidden: boolean;
}

export interface SolutionChain {
  id: string;
  name: string;
  tree: SolutionNode;
  insertions: Insertion[];
  priority: Priority;
  color: NodeColor;
  isExpanded: boolean;
}

export interface SolveSession {
  id: string;
  createdAt: number;
  updatedAt: number;
  scramble: ScrambleData;
  chains: SolutionChain[];
  activeChainId: string;
  activeNodeId: string;
  arrangementBoard: string;
  timer: TimerState;
}

export interface ExportedSession {
  version: 1 | 2;
  exportedAt: number;
  session: SolveSession;
}

export type { Insertion, NodeColor, Priority, SolutionNode } from '@/core/solution/types';
