export type Priority = 'none' | 'low' | 'medium' | 'high';

export type NodeColor = 'none' | 'sky' | 'mint' | 'lemon' | 'rose' | 'lilac';

export type InsertionType = 'normal' | 'wide' | 'commutator';

export interface Insertion {
  id: string;
  placeholder: string;
  moves: string;
  type: InsertionType;
}

/** Standard placeholder characters, in assignment order. */
export const PLACEHOLDER_CHARS = ['#', '@', '^', '&', '*', '?', '~'] as const;

export interface SolutionNode {
  id: string;
  moves: string;
  label: string;
  annotation: string;
  bracketed: boolean;
  priority: Priority;
  color: NodeColor;
  children: SolutionNode[];
  isExpanded: boolean;
}

export interface CompiledNodeInfo {
  id: string;
  moves: string;
  bracketed: boolean;
  label: string;
  stepCount: number;
  cumulativeCount: number;
}

export interface CompiledResult {
  text: string;
  moveCount: number;
  nodes: CompiledNodeInfo[];
  error?: string;
}

export interface BranchPath {
  ids: string[];
  nodes: SolutionNode[];
}
