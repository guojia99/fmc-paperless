import type { CyclingState, CyclingResult } from './types';

export function extractBaseFace(action: string): string {
  const cleaned = action.replace(/[2'w]/gi, '');
  return cleaned.toUpperCase();
}

export function resolveCycling(
  keyAction: string,
  cyclingState: CyclingState,
  currentInput: string,
  timeoutMs: number = 500,
): { result: CyclingResult; newState: CyclingState } {
  const base = extractBaseFace(keyAction);
  const prevBase = extractBaseFace(cyclingState.lastAction);
  const now = Date.now();
  const timeSinceLastClick = now - cyclingState.lastClickTime;
  const isExpired = cyclingState.lastAction === '' || timeSinceLastClick > timeoutMs;

  if (base !== prevBase || isExpired) {
    const insertIdx = currentInput.length;
    return {
      result: { type: 'append', action: keyAction },
      newState: {
        lastAction: keyAction,
        clickCount: 1,
        lastClickTime: now,
        lastInsertIndex: insertIdx,
      },
    };
  }

  const clickCount = cyclingState.clickCount + 1;
  const fromIndex = cyclingState.lastInsertIndex;
  const variants = getVariantActions(cyclingState.lastAction);
  const variantIndex = ((clickCount - 1) % variants.length);
  const selectedVariant = variants[variantIndex];

  if (selectedVariant === '') {
    return {
      result: { type: 'clear', fromIndex },
      newState: { lastAction: '', clickCount: 0, lastClickTime: 0, lastInsertIndex: 0 },
    };
  }

  return {
    result: { type: 'replace', fromIndex, action: selectedVariant },
    newState: {
      lastAction: cyclingState.lastAction,
      clickCount,
      lastClickTime: now,
      lastInsertIndex: fromIndex,
    },
  };
}

export function getVariantActions(action: string): string[] {
  const raw = action.replace(/[2'w]/gi, '');
  const hasWide = action.toLowerCase().includes('w');
  const suffix = hasWide ? 'w' : '';

  if (action.endsWith('2')) {
    return [raw + suffix + '2', raw + suffix + "'", raw + suffix, ''];
  }
  if (action.endsWith("'")) {
    return [raw + suffix + "'", raw + suffix + '2', raw + suffix, ''];
  }
  return [raw + suffix, raw + suffix + '2', raw + suffix + "'", ''];
}

export function isCyclingExpired(state: CyclingState, now?: number): boolean {
  const timestamp = now ?? Date.now();
  if (state.lastAction === '') return true;
  return (timestamp - state.lastClickTime) > 500;
}

export function resetCycling(): CyclingState {
  return { lastAction: '', clickCount: 0, lastClickTime: 0, lastInsertIndex: 0 };
}
