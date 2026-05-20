import { useState } from 'react';
import { selectActiveSession, useSessionStore } from '@/store/sessionStore';
import { useTimer } from '@/hooks/useTimer';
import { cn } from '@/lib/cn';
import { IconClock, IconPause, IconPlay, IconReset } from '@/components/common/Icons';
import type { TimerMode, TimerState } from '@/types';

const FALLBACK_TIMER: TimerState = {
  mode: 'countup',
  initialSeconds: 60 * 60,
  startedAt: null,
  elapsedAtPause: 0,
  isRunning: false,
};

export function Timer() {
  const session = useSessionStore(selectActiveSession);
  const startTimer = useSessionStore((s) => s.startTimer);
  const pauseTimer = useSessionStore((s) => s.pauseTimer);
  const resetTimer = useSessionStore((s) => s.resetTimer);
  const setMode = useSessionStore((s) => s.setTimerMode);
  const setInitial = useSessionStore((s) => s.setTimerInitial);
  const [editing, setEditing] = useState(false);
  const timer = session?.timer ?? FALLBACK_TIMER;
  const display = useTimer(timer);

  if (!session) return null;

  const bgClass =
    display.severity === 'danger'
      ? 'bg-rose-500 text-white border-rose-500'
      : display.severity === 'warning'
        ? 'bg-amber-50 text-amber-700 border-amber-300'
        : 'bg-white text-primary-700 border-primary-200';

  const handleToggleMode = () => {
    const next: TimerMode = timer.mode === 'countup' ? 'countdown' : 'countup';
    setMode(next);
  };

  const handleEditCommit = (value: string) => {
    setEditing(false);
    const minutes = Math.max(1, Math.min(180, Math.floor(Number(value) || 60)));
    setInitial(minutes * 60);
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-mono shadow-sm transition-colors',
        bgClass,
      )}
    >
      <IconClock size={16} />
      <span className="text-lg font-bold tabular-nums tracking-tight">{display.text}</span>
      {timer.mode === 'countdown' && editing ? (
        <input
          autoFocus
          type="number"
          className="w-14 rounded border border-current bg-transparent px-1 py-0 text-xs"
          defaultValue={Math.round(timer.initialSeconds / 60)}
          onBlur={(e) => handleEditCommit(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleEditCommit(e.currentTarget.value);
            if (e.key === 'Escape') setEditing(false);
          }}
        />
      ) : (
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline opacity-80"
          onClick={handleToggleMode}
          onDoubleClick={() => {
            if (timer.mode === 'countdown') setEditing(true);
          }}
          title={timer.mode === 'countup' ? '正计时 (点击切换为倒计时)' : '倒计时 (点击切换为正计时, 双击修改时长)'}
        >
          {timer.mode === 'countup' ? '正计时' : `倒计时 ${Math.round(timer.initialSeconds / 60)}m`}
        </button>
      )}
      <div className="ml-1 flex items-center gap-0.5">
        {timer.isRunning ? (
          <button
            type="button"
            className="rounded-md p-1 hover:bg-black/10"
            onClick={pauseTimer}
            aria-label="暂停"
          >
            <IconPause size={16} />
          </button>
        ) : (
          <button
            type="button"
            className="rounded-md p-1 hover:bg-black/10"
            onClick={startTimer}
            aria-label="开始"
          >
            <IconPlay size={16} />
          </button>
        )}
        <button
          type="button"
          className="rounded-md p-1 hover:bg-black/10"
          onClick={resetTimer}
          aria-label="重置"
          title="重置"
        >
          <IconReset size={16} />
        </button>
      </div>
    </div>
  );
}
