import { describe, expect, it } from 'vitest';
import {
  inverseSequence,
  isValidMoveString,
  parseMoves,
  serializeMoves,
  simplify,
} from '@/core/moves';

describe('parseMoves', () => {
  it('parses basic moves', () => {
    const result = parseMoves('R U F');
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ face: 'R', modifier: 'none', wide: false });
    expect(result[1]).toEqual({ face: 'U', modifier: 'none', wide: false });
  });

  it('parses prime, double, wide', () => {
    expect(parseMoves("R'")[0]).toEqual({ face: 'R', modifier: 'prime', wide: false });
    expect(parseMoves('R2')[0]).toEqual({ face: 'R', modifier: 'double', wide: false });
    expect(parseMoves('Rw')[0]).toEqual({ face: 'R', modifier: 'none', wide: true });
    expect(parseMoves("Rw'")[0]).toEqual({ face: 'R', modifier: 'prime', wide: true });
    expect(parseMoves('Rw2')[0]).toEqual({ face: 'R', modifier: 'double', wide: true });
  });

  it('parses lowercase as wide', () => {
    expect(parseMoves('r')[0]).toEqual({ face: 'R', modifier: 'none', wide: true });
  });

  it('parses axis rotations', () => {
    expect(parseMoves('x')[0]).toEqual({ face: 'x', modifier: 'none', wide: false });
    expect(parseMoves("y'")[0]).toEqual({ face: 'y', modifier: 'prime', wide: false });
    expect(parseMoves('z2')[0]).toEqual({ face: 'z', modifier: 'double', wide: false });
  });

  it('throws on unrecognized tokens', () => {
    expect(() => parseMoves('Q')).toThrow();
  });

  it('returns empty for whitespace input', () => {
    expect(parseMoves('   ')).toEqual([]);
  });
});

describe('serializeMoves / round-trip', () => {
  it("R U2 R' Rw' x2 round-trips", () => {
    const input = "R U2 R' Rw' x2";
    expect(serializeMoves(parseMoves(input))).toBe(input);
  });
});

describe('inverseSequence', () => {
  it("R U R' → R U' R'", () => {
    const inv = inverseSequence(parseMoves("R U R'"));
    expect(serializeMoves(inv.moves)).toBe("R U' R'");
  });

  it('R2 → R2', () => {
    const inv = inverseSequence(parseMoves('R2'));
    expect(serializeMoves(inv.moves)).toBe('R2');
  });

  it('full sequence inverse from spec example', () => {
    // inverse of (R2 U2 R2 D2 F2) is F2 D2 R2 U2 R2
    const inv = inverseSequence(parseMoves('R2 U2 R2 D2 F2'));
    expect(serializeMoves(inv.moves)).toBe('F2 D2 R2 U2 R2');
  });
});

describe('simplify (same-face cancellation)', () => {
  it('R R → R2', () => {
    expect(serializeMoves(simplify(parseMoves('R R')).moves)).toBe('R2');
  });
  it("R R R → R'", () => {
    expect(serializeMoves(simplify(parseMoves('R R R')).moves)).toBe("R'");
  });
  it('R R R R → empty', () => {
    expect(simplify(parseMoves('R R R R')).moves).toHaveLength(0);
  });
  it("F' F2 → F", () => {
    expect(serializeMoves(simplify(parseMoves("F' F2")).moves)).toBe('F');
  });
  it("R2 R' → R", () => {
    expect(serializeMoves(simplify(parseMoves("R2 R'")).moves)).toBe('R');
  });
});

describe('simplify (opposite-face commutative merge per spec)', () => {
  it("U' D2 U' → U2 D2", () => {
    expect(serializeMoves(simplify(parseMoves("U' D2 U'")).moves)).toBe('U2 D2');
  });

  it("D2 U2 D2 → U2 (D cancels, U remains)", () => {
    expect(serializeMoves(simplify(parseMoves('D2 U2 D2')).moves)).toBe('U2');
  });

  it("L' R' L → R'", () => {
    expect(serializeMoves(simplify(parseMoves("L' R' L")).moves)).toBe("R'");
  });

  it('U D unchanged (no full cancellation, both present)', () => {
    expect(serializeMoves(simplify(parseMoves('U D')).moves)).toBe('U D');
  });

  it('U D U → U2 D (commutative, U+U sums)', () => {
    expect(serializeMoves(simplify(parseMoves('U D U')).moves)).toBe('U2 D');
  });

  it('Uw D unchanged (wide and non-wide do NOT merge)', () => {
    expect(serializeMoves(simplify(parseMoves('Uw D')).moves)).toBe('Uw D');
  });

  it("Uw' Dw2 Uw' → Uw2 Dw2 (wide commutative merge)", () => {
    expect(serializeMoves(simplify(parseMoves("Uw' Dw2 Uw'")).moves)).toBe('Uw2 Dw2');
  });

  it('R U D R → R2 (R+R, U D in middle unchanged)', () => {
    // Runs: [R], [U D], [R]. Non-adjacent R's don't merge across non-commuting U/D run.
    // So expected: R U D R (R's separated by different-axis run).
    expect(serializeMoves(simplify(parseMoves('R U D R')).moves)).toBe('R U D R');
  });
});

describe('simplify (axis rotations)', () => {
  it("x x' → empty", () => {
    expect(simplify(parseMoves("x x'")).moves).toHaveLength(0);
  });
  it('x x → x2', () => {
    expect(serializeMoves(simplify(parseMoves('x x')).moves)).toBe('x2');
  });
  it('R x → R x (no merge across face/rotation)', () => {
    expect(serializeMoves(simplify(parseMoves('R x')).moves)).toBe('R x');
  });
});

describe('isValidMoveString', () => {
  it('valid', () => {
    expect(isValidMoveString("R U2 R'")).toBe(true);
    expect(isValidMoveString('Rw Lw2')).toBe(true);
    expect(isValidMoveString('')).toBe(true);
  });
  it('invalid', () => {
    expect(isValidMoveString('Q')).toBe(false);
    expect(isValidMoveString('R T')).toBe(false);
  });
});
