import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DrawerMode = 'none' | 'arrangement' | 'sessions';

export interface InsertionPickerTarget {
  nodeId: string;
  chainId: string;
}

interface UIState {
  drawer: DrawerMode;
  configuringKeyboard: boolean;
  insertionPicker: InsertionPickerTarget | null;

  openDrawer: (mode: DrawerMode) => void;
  toggleDrawer: (mode: DrawerMode) => void;
  closeDrawer: () => void;
  setConfiguringKeyboard: (v: boolean) => void;
  openInsertionPicker: (target: InsertionPickerTarget) => void;
  closeInsertionPicker: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      drawer: 'none',
      configuringKeyboard: false,
      insertionPicker: null,

      openDrawer: (mode) => set({ drawer: mode }),
      toggleDrawer: (mode) =>
        set((s) => ({ drawer: s.drawer === mode ? 'none' : mode })),
      closeDrawer: () => set({ drawer: 'none' }),
      setConfiguringKeyboard: (v) => set({ configuringKeyboard: v }),
      openInsertionPicker: (target) => set({ insertionPicker: target }),
      closeInsertionPicker: () => set({ insertionPicker: null }),
    }),
    {
      name: 'fmc.ui',
      partialize: (s) => ({ drawer: s.drawer }),
    },
  ),
);
