import { useEffect } from 'react';
import { useKeyboardStore } from '@/store/keyboardStore';

const KEEP_KEYBOARD_SELECTOR = [
  '.tree-node-row',
  '.node-actions',
  '[data-chain-header]',
  '[data-virtual-keyboard]',
  '[data-keyboard-configurator]',
  '[data-insertion-picker]',
  '.kb-key',
].join(',');

/**
 * Hide the virtual keyboard when the user clicks outside move-input zones.
 * Showing is driven by `setActiveNode` → `showForInput`.
 */
export function useMoveInputKeyboardDismiss() {
  const hideForInput = useKeyboardStore((s) => s.hideForInput);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest(KEEP_KEYBOARD_SELECTOR)) return;
      hideForInput();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [hideForInput]);
}
