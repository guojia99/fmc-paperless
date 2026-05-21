import type { KeyboardLayout, KeyboardRow } from './types';

export const DEFAULT_KEYBOARD_LAYOUT: KeyboardLayout = {
  position: 'bottom',
  isVisible: true,
  rows: [
    {
      id: 'basic',
      isVisible: true,
      keys: [
        { id: 'r', label: 'R', action: 'R', type: 'move', variantGroup: 'R' },
        { id: 'l', label: 'L', action: 'L', type: 'move', variantGroup: 'L' },
        { id: 'u', label: 'U', action: 'U', type: 'move', variantGroup: 'U' },
        { id: 'd', label: 'D', action: 'D', type: 'move', variantGroup: 'D' },
        { id: 'f', label: 'F', action: 'F', type: 'move', variantGroup: 'F' },
        { id: 'b', label: 'B', action: 'B', type: 'move', variantGroup: 'B' },
      ],
    },
    {
      id: 'wide',
      isVisible: true,
      keys: [
        { id: 'rw', label: 'Rw', action: 'Rw', type: 'move', variantGroup: 'R' },
        { id: 'lw', label: 'Lw', action: 'Lw', type: 'move', variantGroup: 'L' },
        { id: 'uw', label: 'Uw', action: 'Uw', type: 'move', variantGroup: 'U' },
        { id: 'dw', label: 'Dw', action: 'Dw', type: 'move', variantGroup: 'D' },
        { id: 'fw', label: 'Fw', action: 'Fw', type: 'move', variantGroup: 'F' },
        { id: 'bw', label: 'Bw', action: 'Bw', type: 'move', variantGroup: 'B' },
      ],
    },
    {
      id: 'modifiers',
      isVisible: true,
      keys: [
        { id: 'x', label: 'x', action: 'x', type: 'move', variantGroup: 'x' },
        { id: 'y', label: 'y', action: 'y', type: 'move', variantGroup: 'y' },
        { id: 'z', label: 'z', action: 'z', type: 'move', variantGroup: 'z' },
        { id: 'two', label: '2', action: '2', type: 'modifier' },
        { id: 'prime-mod', label: "'", action: "'", type: 'modifier' },
        { id: 'w-mod', label: 'w', action: 'w', type: 'modifier' },
      ],
    },
    {
      id: 'special',
      isVisible: true,
      keys: [
        { id: 'lparen', label: '(', action: '(', type: 'special' },
        { id: 'rparen', label: ')', action: ')', type: 'special' },
        { id: 'insert', label: '#插入', action: '#insert', type: 'special' },
        { id: 'backspace', label: '←删除', action: 'backspace', type: 'special' },
      ],
    },
  ],
};

export const OPTIONAL_ROWS: KeyboardRow[] = [
  {
    id: 'prime',
    isVisible: false,
    keys: [
      { id: 'rp', label: "R'", action: "R'", type: 'move', variantGroup: 'R' },
      { id: 'lp', label: "L'", action: "L'", type: 'move', variantGroup: 'L' },
      { id: 'up', label: "U'", action: "U'", type: 'move', variantGroup: 'U' },
      { id: 'dp', label: "D'", action: "D'", type: 'move', variantGroup: 'D' },
      { id: 'fp', label: "F'", action: "F'", type: 'move', variantGroup: 'F' },
      { id: 'bp', label: "B'", action: "B'", type: 'move', variantGroup: 'B' },
    ],
  },
  {
    id: 'wide-prime',
    isVisible: false,
    keys: [
      { id: 'rwp', label: "Rw'", action: "Rw'", type: 'move', variantGroup: 'R' },
      { id: 'lwp', label: "Lw'", action: "Lw'", type: 'move', variantGroup: 'L' },
      { id: 'uwp', label: "Uw'", action: "Uw'", type: 'move', variantGroup: 'U' },
      { id: 'dwp', label: "Dw'", action: "Dw'", type: 'move', variantGroup: 'D' },
      { id: 'fwp', label: "Fw'", action: "Fw'", type: 'move', variantGroup: 'F' },
      { id: 'bwp', label: "Bw'", action: "Bw'", type: 'move', variantGroup: 'B' },
    ],
  },
];
