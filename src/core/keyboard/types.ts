export interface KeyDef {
  id: string;
  label: string;
  action: string;
  type: 'move' | 'modifier' | 'special';
  variantGroup?: string;
  width?: number;
}

export interface KeyboardRow {
  id: string;
  keys: KeyDef[];
  isVisible: boolean;
}

export interface KeyboardLayout {
  position: 'bottom' | 'left' | 'right' | 'float';
  isVisible: boolean;
  rows: KeyboardRow[];
}

export interface CyclingState {
  lastAction: string;
  clickCount: number;
  lastClickTime: number;
  lastInsertIndex: number;
}

export type CyclingResult =
  | { type: 'append'; action: string }
  | { type: 'replace'; fromIndex: number; action: string }
  | { type: 'clear'; fromIndex: number };
