import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { OPTIONAL_ROWS, useKeyboardStore } from '@/store/keyboardStore';
import type { KeyboardPosition } from '@/store/keyboardStore';
import { cn } from '@/lib/cn';
import {
  IconChevronDown,
  IconChevronUp,
  IconClose,
  IconPlus,
  IconTrash,
} from '@/components/common/Icons';
import { useUIStore } from '@/store/uiStore';

const POSITIONS: { id: KeyboardPosition; label: string }[] = [
  { id: 'bottom', label: '底部' },
  { id: 'left', label: '左侧' },
  { id: 'right', label: '右侧' },
  { id: 'float', label: '悬浮' },
  { id: 'hidden', label: '隐藏' },
];

export function KeyboardConfigurator() {
  const layout = useKeyboardStore((s) => s.layout);
  const position = useKeyboardStore((s) => s.position);
  const setPosition = useKeyboardStore((s) => s.setPosition);
  const addOptionalRow = useKeyboardStore((s) => s.addOptionalRow);
  const removeRow = useKeyboardStore((s) => s.removeRow);
  const moveRow = useKeyboardStore((s) => s.moveRow);
  const reset = useKeyboardStore((s) => s.reset);
  const close = useUIStore((s) => s.setConfiguringKeyboard);

  const canAddRow = layout.rows.length < 6;

  // Close on Escape for keyboard accessibility.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) close(false);
      }}
    >
      <div
        className="card w-full max-w-md max-h-[85vh] overflow-auto p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-primary-700">键盘配置</h2>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={() => close(false)}
            aria-label="关闭"
          >
            <IconClose size={16} />
          </button>
        </div>

        <div className="mb-4">
          <div className="mb-1 text-xs text-slate-500">位置</div>
          <div className="flex flex-wrap gap-1">
            {POSITIONS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={cn(
                  'btn',
                  position === p.id ? 'btn-primary' : '',
                )}
                onClick={() => setPosition(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between">
            <div className="text-xs text-slate-500">布局行 ({layout.rows.length}/6)</div>
            <button
              type="button"
              className="btn btn-ghost text-xs"
              onClick={reset}
            >
              恢复默认
            </button>
          </div>
          <ul className="space-y-1">
            {layout.rows.map((row, idx) => (
              <li
                key={row.id}
                className="flex items-center gap-2 rounded-lg border border-primary-100 bg-white px-2 py-1.5 text-sm"
              >
                <div className="flex flex-1 flex-wrap items-center gap-1">
                  {row.keys.map((k) => (
                    <code key={k.id} className="chip chip-primary font-mono">
                      {k.label}
                    </code>
                  ))}
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon"
                    onClick={() => moveRow(row.id, 'up')}
                    disabled={idx === 0}
                    aria-label="上移"
                  >
                    <IconChevronUp size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon"
                    onClick={() => moveRow(row.id, 'down')}
                    disabled={idx === layout.rows.length - 1}
                    aria-label="下移"
                  >
                    <IconChevronDown size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-icon"
                    onClick={() => removeRow(row.id)}
                    aria-label="移除"
                  >
                    <IconTrash size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="mb-1 text-xs text-slate-500">添加常用行</div>
          <div className="flex flex-wrap gap-2">
            {OPTIONAL_ROWS.map((r) => (
              <button
                key={r.id}
                type="button"
                className="btn"
                disabled={!canAddRow}
                onClick={() => addOptionalRow(r.id)}
              >
                <IconPlus size={14} />
                {r.keys.map((k) => k.label).join(' ')}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
