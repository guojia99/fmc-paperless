import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';

import type { KeyboardLayout, KeyboardRow } from '@/core/keyboard';
import { DEFAULT_KEYBOARD_LAYOUT, OPTIONAL_ROWS } from '@/core/keyboard';

export type KeyboardPosition = KeyboardLayout['position'] | 'hidden';

const MAX_ROWS = 6;
const LAYOUT_POSITIONS = new Set<KeyboardPosition>([
  'bottom',
  'left',
  'right',
  'float',
]);

function isLayoutPosition(p: KeyboardPosition): p is Exclude<KeyboardPosition, 'hidden'> {
  return LAYOUT_POSITIONS.has(p);
}

function cloneRow(row: KeyboardRow): KeyboardRow {
  return {
    id: `${row.id}-${nanoid(4)}`,
    isVisible: true,
    keys: row.keys.map((k) => ({ ...k })),
  };
}

interface KeyboardState {
  layout: KeyboardLayout;
  position: KeyboardPosition;
  /** Last docked layout position (never `hidden`). */
  lastLayoutPosition: Exclude<KeyboardPosition, 'hidden'>;
  availableRows: KeyboardRow[];

  setPosition: (p: KeyboardPosition) => void;
  showForInput: () => void;
  hideForInput: () => void;
  show: () => void;
  hide: () => void;
  setRows: (rows: KeyboardRow[]) => void;
  addOptionalRow: (templateId: string) => void;
  removeRow: (rowId: string) => void;
  moveRow: (rowId: string, direction: 'up' | 'down') => void;
  reset: () => void;
}

export const useKeyboardStore = create<KeyboardState>()(
  persist(
    (set, get) => ({
      layout: DEFAULT_KEYBOARD_LAYOUT,
      position: 'hidden',
      lastLayoutPosition: 'bottom',
      availableRows: OPTIONAL_ROWS.map(cloneRow),

      setPosition: (p) =>
        set((s) => {
          if (p === 'hidden') {
            return {
              position: 'hidden',
              lastLayoutPosition: isLayoutPosition(s.position)
                ? s.position
                : s.lastLayoutPosition,
            };
          }
          return { position: p, lastLayoutPosition: p };
        }),

      showForInput: () => {
        const { lastLayoutPosition } = get();
        set({ position: lastLayoutPosition });
      },

      hideForInput: () =>
        set((s) => ({
          position: 'hidden',
          lastLayoutPosition: isLayoutPosition(s.position)
            ? s.position
            : s.lastLayoutPosition,
        })),

      show: () => {
        const s = get();
        set({
          position:
            s.position === 'hidden' ? s.lastLayoutPosition : s.position,
        });
      },
      hide: () => get().hideForInput(),

      setRows: (rows) =>
        set((s) => ({ layout: { ...s.layout, rows: rows.slice(0, MAX_ROWS) } })),

      addOptionalRow: (templateId) => {
        const s = get();
        const candidate = s.availableRows.find((r) => r.id === templateId);
        if (!candidate) return;
        if (s.layout.rows.length >= MAX_ROWS) return;
        set({
          layout: { ...s.layout, rows: [...s.layout.rows, cloneRow(candidate)] },
          availableRows: s.availableRows.filter((r) => r.id !== templateId),
        });
      },

      removeRow: (rowId) => {
        const s = get();
        const removed = s.layout.rows.find((r) => r.id === rowId);
        if (!removed) return;
        const returned = cloneRow(removed);
        set({
          layout: { ...s.layout, rows: s.layout.rows.filter((r) => r.id !== rowId) },
          availableRows: [...s.availableRows, returned],
        });
      },

      moveRow: (rowId, direction) =>
        set((s) => {
          const rows = [...s.layout.rows];
          const idx = rows.findIndex((r) => r.id === rowId);
          if (idx < 0) return s;
          const target = direction === 'up' ? idx - 1 : idx + 1;
          if (target < 0 || target >= rows.length) return s;
          [rows[idx], rows[target]] = [rows[target], rows[idx]];
          return { layout: { ...s.layout, rows } };
        }),

      reset: () =>
        set({
          layout: DEFAULT_KEYBOARD_LAYOUT,
          position: 'hidden',
          lastLayoutPosition: 'bottom',
          availableRows: OPTIONAL_ROWS.map(cloneRow),
        }),
    }),
    {
      name: 'fmc.keyboard',
      partialize: (s) => ({
        layout: s.layout,
        position: s.position,
        lastLayoutPosition: s.lastLayoutPosition,
        availableRows: s.availableRows,
      }),
    },
  ),
);

export { OPTIONAL_ROWS };
