import { useEffect, useRef, useState } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { useScramble } from '@/hooks/useScramble';
import { cn } from '@/lib/cn';
import {
  IconChevronDown,
  IconPlus,
  IconTrash,
} from '@/components/common/Icons';

function timeAgo(ms: number): string {
  const d = new Date(ms);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleString([], {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SessionsMenu() {
  const sessions = useSessionStore((s) => s.sessions);
  const activeId = useSessionStore((s) => s.activeSessionId);
  const newSession = useSessionStore((s) => s.newSession);
  const switchSession = useSessionStore((s) => s.switchSession);
  const deleteSession = useSessionStore((s) => s.deleteSession);
  const setScrambleText = useSessionStore((s) => s.setScrambleText);
  const { generate } = useScramble();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const sorted = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);
  const active = sorted.find((s) => s.id === activeId) ?? sorted[0];

  const handleNew = async () => {
    newSession();
    setOpen(false);
    const result = await generate();
    if (result) setScrambleText(result.text, result.image);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="btn"
        onClick={() => setOpen((v) => !v)}
        title="会话历史"
      >
        <span className="hidden sm:inline">会话</span>
        <span className="font-mono text-xs text-slate-500">
          {active ? timeAgo(active.createdAt) : '无'}
        </span>
        <IconChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-80 max-h-[60vh] overflow-auto rounded-xl border border-primary-100 bg-white p-2 shadow-lg">
          <button
            type="button"
            className="btn btn-primary mb-2 w-full"
            onClick={handleNew}
          >
            <IconPlus size={16} /> 新建一把
          </button>
          {sorted.length === 0 ? (
            <p className="px-2 py-3 text-center text-sm text-slate-400">
              暂无历史会话
            </p>
          ) : (
            <ul className="space-y-1">
              {sorted.map((s) => (
                <li
                  key={s.id}
                  className={cn(
                    'group flex items-start gap-2 rounded-lg p-2 cursor-pointer',
                    s.id === activeId
                      ? 'bg-primary-50 ring-1 ring-primary-200'
                      : 'hover:bg-slate-50',
                  )}
                  onClick={() => {
                    switchSession(s.id);
                    setOpen(false);
                  }}
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-xs text-slate-500">
                      {timeAgo(s.createdAt)}
                    </span>
                    <code className="truncate font-mono text-xs text-slate-700">
                      {s.scramble.text || '(无打乱)'}
                    </code>
                  </div>
                  <button
                    type="button"
                    className="rounded p-1 text-slate-400 opacity-0 hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(s.id);
                    }}
                    aria-label="删除"
                  >
                    <IconTrash size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
