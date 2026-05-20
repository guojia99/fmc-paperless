import { nanoid } from 'nanoid';
import { expand as expandCommutator } from '@/lib/commutator';
import type { Insertion } from './types';
import { PLACEHOLDER_CHARS } from './types';

export function createInsertion(partial: Partial<Insertion> = {}): Insertion {
  return {
    id: partial.id ?? nanoid(6),
    placeholder: partial.placeholder ?? '#',
    moves: partial.moves ?? '',
    type: partial.type ?? 'normal',
  };
}

/**
 * Return the first placeholder character from `PLACEHOLDER_CHARS` that is not
 * yet used in `existing`. Falls back to a `$N` token once the standard set is
 * exhausted.
 */
export function nextAvailablePlaceholder(existing: Insertion[]): string {
  const used = new Set(existing.map((i) => i.placeholder));
  for (const ch of PLACEHOLDER_CHARS) {
    if (!used.has(ch)) return ch;
  }
  for (let i = 1; i < 100; i++) {
    const token = `$${i}`;
    if (!used.has(token)) return token;
  }
  return `$${existing.length}`;
}

/** Normalize user input to a single placeholder token. */
export function sanitizePlaceholder(raw: string): string {
  const t = raw.trim();
  if (!t) return '#';
  const dollar = t.match(/^\$(\d+)$/);
  if (dollar) return `$${dollar[1]}`;
  return t[0];
}

export function isPlaceholderTaken(
  insertions: Insertion[],
  placeholder: string,
  exceptId?: string,
): boolean {
  return insertions.some(
    (i) => i.id !== exceptId && i.placeholder === placeholder,
  );
}

export interface InsertionResolveResult {
  resolved: string;
  error?: string;
}

const PLACEHOLDER_PATTERN = /[#@^&*?~]|\$\d+/g;

/**
 * Substitute every insertion placeholder occurring in `raw`.
 *
 * Normal insertions: each `placeholder` occurrence is replaced by the
 * insertion's `moves`, surrounded by spaces so the result tokenizes correctly:
 *   "(U2 # L2)" + (# = "U2 B2") → "U2 U2 B2 L2"
 *
 * Wide insertions: each `placeholder` occurrence is replaced verbatim
 * (no surrounding whitespace), so the placeholder acts as a modifier slot:
 *   "F#'" + (# = "w") → "Fw'"
 *   "F#"  + (# = "w") → "Fw"
 *
 * Commutator insertions: the `moves` field stores a commutator/conjugate
 * expression (e.g. `[R, U]`, `A:[B, C]`). It is expanded once via the
 * vendored commutator library, then substituted like a normal insertion.
 *
 * If any unresolved placeholder remains an `error` is set on the result.
 */
export function resolveInsertions(
  raw: string,
  insertions: Insertion[],
): InsertionResolveResult {
  let text = raw;
  let firstError: string | undefined;

  for (const ins of insertions) {
    const ph = ins.placeholder || '#';
    if (!text.includes(ph)) continue;
    if (ins.type === 'normal') {
      text = text.split(ph).join(` ${ins.moves} `);
    } else if (ins.type === 'wide') {
      text = text.split(ph).join(ins.moves);
    } else {
      // 'commutator'
      let expanded = '';
      try {
        expanded = expandCommutator({ algorithm: ins.moves });
      } catch (err) {
        const msg = err instanceof Error ? err.message : '展开失败';
        if (!firstError) {
          firstError = `插入 '${ph}' 交换子展开失败: ${msg}`;
        }
      }
      if (
        expanded === 'Lack left parenthesis.' ||
        expanded === 'Lack right parenthesis.'
      ) {
        if (!firstError) {
          firstError = `插入 '${ph}' 交换子语法错误: ${expanded}`;
        }
        expanded = '';
      }
      text = text.split(ph).join(` ${expanded} `);
    }
  }

  text = text.replace(/\s+/g, ' ').trim();

  if (!firstError) {
    const leftovers = text.match(PLACEHOLDER_PATTERN);
    if (leftovers && leftovers.length > 0) {
      firstError = `未定义的插入占位符 '${leftovers[0]}'`;
    }
  }

  return { resolved: text, error: firstError };
}
