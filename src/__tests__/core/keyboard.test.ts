import { describe, expect, it } from 'vitest';
import {
  DEFAULT_KEYBOARD_LAYOUT,
  OPTIONAL_ROWS,
  getVariantActions,
  isCyclingExpired,
  resetCycling,
  resolveCycling,
} from '@/core/keyboard';
import type { CyclingState } from '@/core/keyboard';

function makeState(partial: Partial<CyclingState> = {}): CyclingState {
  return {
    lastAction: '',
    clickCount: 0,
    lastClickTime: Date.now(),
    lastInsertIndex: 0,
    ...partial,
  };
}

describe('DEFAULT_KEYBOARD_LAYOUT', () => {
  it('has 4 rows', () => {
    expect(DEFAULT_KEYBOARD_LAYOUT.rows).toHaveLength(4);
  });

  it('row 1: R L U D F B', () => {
    expect(DEFAULT_KEYBOARD_LAYOUT.rows[0].keys.map((k) => k.action)).toEqual([
      'R', 'L', 'U', 'D', 'F', 'B',
    ]);
  });

  it('row 2: prime variants', () => {
    expect(DEFAULT_KEYBOARD_LAYOUT.rows[1].keys.map((k) => k.action)).toEqual([
      "R'", "L'", "U'", "D'", "F'", "B'",
    ]);
  });

  it('row 3: x y z + modifiers', () => {
    expect(DEFAULT_KEYBOARD_LAYOUT.rows[2].keys.map((k) => k.action)).toEqual([
      'x', 'y', 'z', '2', "'", 'w',
    ]);
  });

  it('row 4: ( ) #insert backspace', () => {
    expect(DEFAULT_KEYBOARD_LAYOUT.rows[3].keys.map((k) => k.action)).toEqual([
      '(', ')', '#insert', 'backspace',
    ]);
  });
});

describe('OPTIONAL_ROWS', () => {
  it('exposes wide and wide-prime rows', () => {
    expect(OPTIONAL_ROWS.map((r) => r.id)).toEqual(['wide', 'wide-prime']);
  });
});

describe('resolveCycling — R R R R cycle', () => {
  it('first click appends', () => {
    const { result } = resolveCycling('R', makeState({ lastAction: '', lastClickTime: 0 }), '');
    expect(result.type).toBe('append');
    if (result.type === 'append') expect(result.action).toBe('R');
  });

  it('second click → replace with R2', () => {
    const { result } = resolveCycling(
      'R',
      makeState({ lastAction: 'R', clickCount: 1 }),
      'R',
      10_000,
    );
    expect(result.type).toBe('replace');
    if (result.type === 'replace') expect(result.action).toBe('R2');
  });

  it("third click → replace with R'", () => {
    const { result } = resolveCycling(
      'R',
      makeState({ lastAction: 'R', clickCount: 2 }),
      'R2',
      10_000,
    );
    expect(result.type).toBe('replace');
    if (result.type === 'replace') expect(result.action).toBe("R'");
  });

  it('fourth click → clear', () => {
    const { result } = resolveCycling(
      'R',
      makeState({ lastAction: 'R', clickCount: 3 }),
      "R'",
      10_000,
    );
    expect(result.type).toBe('clear');
  });

  it('different face resets cycling and appends', () => {
    const { result } = resolveCycling(
      'L',
      makeState({ lastAction: 'R', clickCount: 2 }),
      'R2',
      10_000,
    );
    expect(result.type).toBe('append');
    if (result.type === 'append') expect(result.action).toBe('L');
  });

  it('expired (timeout) treats as new press', () => {
    const { result } = resolveCycling(
      'R',
      makeState({ lastAction: 'R', clickCount: 2, lastClickTime: 0 }),
      'R2',
      10,
    );
    expect(result.type).toBe('append');
  });

  it("R' R' → R2", () => {
    const { result } = resolveCycling(
      "R'",
      makeState({ lastAction: "R'", clickCount: 1 }),
      "R'",
      10_000,
    );
    expect(result.type).toBe('replace');
    if (result.type === 'replace') expect(result.action).toBe('R2');
  });

  it('Rw Rw → Rw2', () => {
    const { result } = resolveCycling(
      'Rw',
      makeState({ lastAction: 'Rw', clickCount: 1 }),
      'Rw',
      10_000,
    );
    expect(result.type).toBe('replace');
    if (result.type === 'replace') expect(result.action).toBe('Rw2');
  });
});

describe('getVariantActions', () => {
  it("R → [R, R2, R', '']", () => {
    expect(getVariantActions('R')).toEqual(['R', 'R2', "R'", '']);
  });
  it("R' → [R', R2, R, '']", () => {
    expect(getVariantActions("R'")).toEqual(["R'", 'R2', 'R', '']);
  });
  it("Rw → [Rw, Rw2, Rw', '']", () => {
    expect(getVariantActions('Rw')).toEqual(['Rw', 'Rw2', "Rw'", '']);
  });
  it("x → [x, x2, x', '']", () => {
    expect(getVariantActions('x')).toEqual(['x', 'x2', "x'", '']);
  });
});

describe('isCyclingExpired / resetCycling', () => {
  it('fresh state is expired', () => {
    expect(isCyclingExpired(resetCycling())).toBe(true);
  });
  it('recent state is not expired', () => {
    const now = Date.now();
    expect(
      isCyclingExpired(makeState({ lastAction: 'R', lastClickTime: now }), now),
    ).toBe(false);
  });
  it('old state is expired', () => {
    const now = Date.now();
    expect(
      isCyclingExpired(makeState({ lastAction: 'R', lastClickTime: now - 600 }), now),
    ).toBe(true);
  });
  it('resetCycling has empty lastAction', () => {
    expect(resetCycling().lastAction).toBe('');
  });
});
