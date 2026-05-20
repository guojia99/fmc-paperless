import { useCallback } from 'react';
import { useSessionStore } from '@/store/sessionStore';

/**
 * Bridges keyboard input (virtual or physical) to the active node in the
 * active session. All cycling / backspace / parens / `#insert` semantics
 * live inside `sessionStore.appendKey` — this hook just dispatches.
 */
export function useKeyboardInput() {
  const appendKey = useSessionStore((s) => s.appendKey);

  const press = useCallback(
    (action: string) => {
      appendKey(action);
    },
    [appendKey],
  );

  return { press };
}
