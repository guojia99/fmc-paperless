/*!
 * Commutator (https://github.com/nbwzx/commutator)
 * Copyright (c) 2022-2025 Zixing Wang <zixingwang.cn@gmail.com>
 * Licensed under MIT (https://github.com/nbwzx/commutator/blob/main/LICENSE)
 *
 * Vendored into fmc-paperless. Only the `expand` entry point is re-exported;
 * the rest of the library (search, post-processing) is omitted for size.
 */
/* eslint-disable no-misleading-character-class, no-control-regex */

type CommuteMap = { [id: string]: { class: number; priority: number } };
type ReplaceMap = { [id: string]: string };
type Move = { base: string; amount: number };

const orderInit = 4;

const commuteInit: CommuteMap = {
  U: { class: 1, priority: 1 },
  u: { class: 1, priority: 2 },
  E: { class: 1, priority: 3 },
  D: { class: 1, priority: 4 },
  d: { class: 1, priority: 5 },
  R: { class: 2, priority: 1 },
  r: { class: 2, priority: 2 },
  M: { class: 2, priority: 3 },
  L: { class: 2, priority: 4 },
  l: { class: 2, priority: 5 },
  F: { class: 3, priority: 1 },
  f: { class: 3, priority: 2 },
  S: { class: 3, priority: 3 },
  B: { class: 3, priority: 4 },
  b: { class: 3, priority: 5 },
};

const initialReplaceInit: ReplaceMap = {
  Rw2: 'r2',
  "Rw'": "r'",
  Rw: 'r',
  Lw2: 'l2',
  "Lw'": "l'",
  Lw: 'l',
  Fw2: 'f2',
  "Fw'": "f'",
  Fw: 'f',
  Bw2: 'b2',
  "Bw'": "b'",
  Bw: 'b',
  Uw2: 'u2',
  "Uw'": "u'",
  Uw: 'u',
  Dw2: 'd2',
  "Dw'": "d'",
  Dw: 'd',
  r2: 'R2 M2',
  "r'": "R' M",
  r: "R M'",
  l2: 'M2 L2',
  "l'": "M' L'",
  l: 'M L',
  f2: 'F2 S2',
  "f'": "F' S'",
  f: 'F S',
  b2: 'S2 B2',
  "b'": "S B'",
  b: "S' B",
  u2: 'U2 E2',
  "u'": "U' E",
  u: "U E'",
  d2: 'E2 D2',
  "d'": "E' D'",
  d: 'E D',
};

const finalReplaceInit: ReplaceMap = {
  'R2 M2': 'r2',
  "R' M": "r'",
  "R M'": 'r',
  'M2 L2': 'l2',
  "M' L'": "l'",
  'M L': 'l',
  'F2 S2': 'f2',
  "F' S'": "f'",
  'F S': 'f',
  'S2 B2': 'b2',
  "S B'": "b'",
  "S' B": 'b',
  'U2 E2': 'u2',
  "U' E": "u'",
  "U E'": 'u',
  'E2 D2': 'd2',
  "E' D'": "d'",
  'E D': 'd',
  'M2 R2': 'r2',
  "M R'": "r'",
  "M' R": 'r',
  'L2 M2': 'l2',
  "L' M'": "l'",
  'L M': 'l',
  'S2 F2': 'f2',
  "S' F'": "f'",
  'S F': 'f',
  'B2 S2': 'b2',
  "B' S": "b'",
  "B S'": 'b',
  'E2 U2': 'u2',
  "E U'": "u'",
  "E' U": 'u',
  'D2 E2': 'd2',
  "D' E'": "d'",
  'D E': 'd',
  'R M2': "r M'",
  "R' M2": "r' M",
  'M2 R': "r M'",
  "M2 R'": "r' M",
  'U2 E': "U' u'",
  "U2 E'": 'U u',
  'E U2': "U' u'",
  "E' U2": 'U u',
  'U E2': 'U u2',
  "U' E2": 'U u2',
  'E2 U': "U' u2",
  "E2 U'": 'U u2',
};

// --- module-scoped mutable state used by the algorithm ---
let order = orderInit;
let minAmount = Math.floor(orderInit / 2) + 1 - orderInit;
let maxAmount = Math.floor(orderInit / 2);
let maxAlgAmount = 0;
let isOrderZero = false;
let commute: CommuteMap = commuteInit;
let initialReplace: ReplaceMap = initialReplaceInit;
let finalReplace: ReplaceMap = finalReplaceInit;

function clean(input: string): string {
  let s = input;
  s = s.replace(
    /[\u00ad\u1806\u034f\u180b-\u180d\ufe0f-\uff00\ufffc]+/gu,
    '',
  );
  s = s.replace(/[\u0009\u000a\u000b\u000c\u000d\u0085]/gu, ' ');
  s = s.replace(
    /[\u0000-\u0008\u000e-\u001f\u007f-\u0084\u0086-\u009f\u06dd\u070f\u180e\u200c-\u200f\u202a-\u202e\u2060-\u2063\u206a-\u206f\ufeff\ufff9-\ufffb]+/gu,
    '',
  );
  s = s.replace(/\u200b/gu, '');
  s = s.replace(
    /[\u00a0\u1680\u2000-\u200a\u2028-\u2029\u202f\u205f\u3000]/gu,
    ' ',
  );
  s = s.replace(
    /[\u061c\u115f\u1160\u17b4\u17b5\u2064\u2800\u3164\uffa0]/gu,
    ' ',
  );
  s = s.replace(/[!！]/gu, ' ');
  s = s.replace(/\s+/gu, ' ');
  s = s.trim();
  return s;
}

function isOperator(sign: string): boolean {
  return '+:,/[]'.indexOf(sign) > -1;
}

function operatorLevel(op: string): number {
  if (op === ':') return 0;
  if (op === ',') return 1;
  if (op === '/') return 2;
  if (op === '+') return 3;
  if (op === '[') return 4;
  if (op === ']') return 5;
  return -1;
}

function initStack(algorithm: string): string[] {
  const stack: string[] = [algorithm[0]];
  for (let i = 1; i < algorithm.length; i++) {
    if (isOperator(algorithm[i]) || isOperator(stack.slice(-1)[0])) {
      stack.push(algorithm[i]);
    } else {
      stack.push(stack.pop() + algorithm[i]);
    }
  }
  return stack;
}

function rpn(stackInput: string[]): string[] {
  const out: string[] = [];
  const ops: string[] = [];
  while (stackInput.length > 0) {
    const sign = stackInput.shift() as string;
    if (!isOperator(sign)) {
      out.push(sign);
    } else if (sign === ']') {
      let matched = false;
      while (ops.length > 0) {
        const popped = ops.pop() as string;
        if (popped === '[') {
          matched = true;
          break;
        } else {
          out.push(popped);
        }
      }
      if (!matched) return ['Lack left parenthesis.'];
    } else {
      while (
        ops.length > 0 &&
        ops.slice(-1)[0] !== '[' &&
        operatorLevel(sign) <= operatorLevel(ops.slice(-1)[0])
      ) {
        out.push(ops.pop() as string);
      }
      ops.push(sign);
    }
  }
  while (ops.length > 0) {
    const popped = ops.pop() as string;
    if (popped === '[') return ['Lack right parenthesis.'];
    out.push(popped);
  }
  return out;
}

function calc(stack: string[]): string {
  const out: string[] = [];
  while (stack.length > 0) {
    const sign = stack.shift() as string;
    if (isOperator(sign)) {
      if (out.length >= 2) {
        const b = out.pop() as string;
        const a = out.pop() as string;
        out.push(calcTwo(a, b, sign));
      } else {
        return '';
      }
    } else {
      out.push(sign);
    }
  }
  return out[0] ?? '';
}

function calcTwo(alg1: string, alg2: string, sign: string): string {
  const a = algToArray(alg1);
  const b = algToArray(alg2);
  switch (sign) {
    case '+':
      return arrayToStr(a.concat(b));
    case ':':
      return arrayToStr(a.concat(b, invert(a)));
    case ',':
      return arrayToStr(a.concat(b, invert(a), invert(b)));
    case '/':
      return arrayToStr(
        a.concat(b, invert(a), invert(a), invert(b), a),
      );
    default:
      return arrayToStr(a.concat(b));
  }
}

function algToArray(algorithm: string): Move[] {
  let alg = clean(algorithm);
  for (const s in initialReplace) {
    const re = new RegExp(s, 'gu');
    alg = alg.replace(re, initialReplace[s]);
  }
  alg = alg.replace(/\s+/giu, '');
  if (alg === '') return [];
  let buf = '';
  for (let i = 0; i < alg.length; i++) {
    if ((alg[i + 1] < '0' || alg[i + 1] > '9') && alg[i + 1] !== "'") {
      buf = `${buf + alg[i]} `;
    } else {
      buf = buf + alg[i];
    }
  }
  const parts = buf.split(' ');
  const arr: Move[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (!parts[i]) continue;
    arr[i] = { base: parts[i][0], amount: 0 };
    const num = parts[i].replace(/[^0-9]/gu, '');
    if (num === '') arr[i].amount = 1;
    else arr[i].amount = Number(num);
    if (arr[i].amount > maxAlgAmount) maxAlgAmount = arr[i].amount;
    if (parts[i].indexOf("'") > -1) arr[i].amount = -arr[i].amount;
  }
  return arr.filter(Boolean);
}

function arrayToStr(arr0: Move[]): string {
  let arr = arr0.concat();
  arr = simplify(arr);
  if (arr.length === 0) return '';
  for (let times = 0; times <= 1; times++) {
    for (let i = 0; i < arr.length - 1; i++) {
      if (
        isSameClass(arr[i], arr[i + 1]) &&
        commute[arr[i].base].priority > commute[arr[i + 1].base].priority
      ) {
        arr = swapArray(arr, i, i + 1);
      }
    }
  }
  const tmp: string[] = [];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].amount < 0) {
      if (arr[i].amount === -1) tmp[i] = `${arr[i].base}'`;
      else tmp[i] = `${arr[i].base + -arr[i].amount}'`;
    } else if (arr[i].amount === 1) {
      tmp[i] = arr[i].base;
    } else {
      tmp[i] = arr[i].base + arr[i].amount;
    }
  }
  let out = `${tmp.join(' ')} `;
  for (const i in finalReplace) {
    const re = new RegExp(`${i} `, 'gu');
    out = out.replace(re, `${finalReplace[i]} `);
  }
  out = out.substring(0, out.length - 1);
  return out;
}

function simplify(array: Move[]): Move[] {
  if (array.length === 0) return [];
  const arr: Move[] = [];
  for (let i = 0; i < array.length; i++) {
    const add: Move = {
      base: array[i].base,
      amount: normalize(array[i].amount),
    };
    const len = arr.length;
    if (normalize(add.amount) === 0) continue;
    let changed = false;
    for (let j = 1; j <= 3; j++) {
      if (arr.length >= j) {
        if (arr[len - j].base === add.base) {
          let canCommute = true;
          if (j >= 2) {
            for (let k = 1; k <= j; k++) {
              if (!(arr[len - k].base in commute)) {
                canCommute = false;
                break;
              }
            }
            for (let k = 2; k <= j; k++) {
              if (!isSameClass(arr[len - k], arr[len - (k - 1)])) {
                canCommute = false;
                break;
              }
            }
          }
          if (canCommute) {
            const merged: Move = {
              base: arr[len - j].base,
              amount: normalize(arr[len - j].amount + add.amount),
            };
            if (merged.amount === 0) arr.splice(-j, 1);
            else arr.splice(-j, 1, merged);
            changed = true;
            break;
          }
        }
      }
    }
    if (!changed) arr[len] = add;
  }
  return arr;
}

function invert(array: Move[]): Move[] {
  const arr: Move[] = [];
  for (let i = array.length - 1; i >= 0; i--) {
    arr.push({ base: array[i].base, amount: normalize(-array[i].amount) });
  }
  return arr;
}

function isSameClass(a: Move, b: Move): boolean {
  if (a.base in commute && b.base in commute) {
    return commute[a.base].class === commute[b.base].class;
  }
  return false;
}

function swapArray(arr: Move[], i: number, j: number): Move[] {
  arr[i] = arr.splice(j, 1, arr[i])[0];
  return arr;
}

function normalize(amount: number): number {
  if (isOrderZero) return amount;
  return (((amount % order) + order - minAmount) % order) + minAmount;
}

export interface ExpandInput {
  algorithm: string;
  order?: number;
  initialReplace?: ReplaceMap;
  finalReplace?: ReplaceMap;
  commute?: CommuteMap;
}

const MAX_INT = 4294967295;

/**
 * Expand a commutator/conjugate expression (e.g. `[R, U]`, `R: [U, F]`,
 * `[A,B]+[C,D]`) into its flat move sequence. Returns the expanded sequence
 * as a space-separated string, or one of:
 *   - 'Lack left parenthesis.'
 *   - 'Lack right parenthesis.'
 *   - ''  (empty input or simplification result)
 */
export function expand(input: ExpandInput): string {
  order = input.order ?? orderInit;
  initialReplace = input.initialReplace ?? initialReplaceInit;
  finalReplace = input.finalReplace ?? finalReplaceInit;
  commute = input.commute ?? commuteInit;

  let algorithm = clean(input.algorithm);
  algorithm = algorithm
    .replace(/\*\s/gu, '*')
    .replace(/\s\*/gu, '*')
    .replace(/:\s/gu, ':')
    .replace(/\s:/gu, ':')
    .replace(/\[\s/gu, '[')
    .replace(/\s\[/gu, '[')
    .replace(/\]\s/gu, ']')
    .replace(/\s\]/gu, ']')
    .replace(/,\s/gu, ',')
    .replace(/\s,/gu, ',')
    .replace(/\+\s/gu, '+')
    .replace(/\s\+/gu, '+')
    .replace(/\*2/gu, '2');

  // (X)2 → X X
  for (let i = algorithm.length - 1; i > 1; i--) {
    if (algorithm[i] === '2' && algorithm[i - 1] === ')') {
      let j = i - 1;
      while (algorithm[j] !== '(' && j >= 0) j--;
      if (j >= 0) {
        algorithm =
          algorithm.slice(0, j) +
          algorithm.slice(j + 1, i - 1) +
          algorithm.slice(j + 1, i - 1) +
          algorithm.slice(i + 1);
        break;
      }
    }
  }
  // [X]2 → X X
  for (let i = algorithm.length - 1; i > 1; i--) {
    if (algorithm[i] === '2' && algorithm[i - 1] === ']') {
      let j = i - 1;
      while (algorithm[j] !== '[' && j >= 0) j--;
      if (j >= 0) {
        algorithm =
          algorithm.slice(0, j) +
          algorithm.slice(j + 1, i - 1) +
          algorithm.slice(j + 1, i - 1) +
          algorithm.slice(i + 1);
        break;
      }
    }
  }
  algorithm = algorithm.replace(/\(/gu, '');
  algorithm = algorithm.replace(/\)/gu, '');
  algorithm = `[${algorithm.replace(/\+/gu, ']+[')}]`;
  algorithm = algorithm.replace(/\]\[/gu, ']+[');

  if (order === 0) {
    isOrderZero = true;
    order = MAX_INT;
  } else {
    isOrderZero = false;
  }
  minAmount = Math.floor(order / 2) + 1 - order;
  maxAmount = Math.floor(order / 2);

  if (!algorithm || algorithm === '[]') return '';

  const stack = rpn(initStack(algorithm));
  if (
    stack[0] === 'Lack left parenthesis.' ||
    stack[0] === 'Lack right parenthesis.'
  ) {
    return stack[0];
  }
  const calcTemp = calc(stack);
  if (calcTemp === '') return '';
  const out = arrayToStr(algToArray(calcTemp));
  return out;
}

void maxAmount;
