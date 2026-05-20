import { useEffect, useState } from 'react';
import type { TimerState } from '@/types';

export type TimerSeverity = 'normal' | 'warning' | 'danger';

export interface TimerDisplay {
  text: string;
  seconds: number;
  severity: TimerSeverity;
  isOvertime: boolean;
}

function computeElapsedSeconds(timer: TimerState): number {
  if (timer.isRunning && timer.startedAt !== null) {
    return timer.elapsedAtPause + (Date.now() - timer.startedAt) / 1000;
  }
  return timer.elapsedAtPause;
}

export function formatMMSS(seconds: number): string {
  const sign = seconds < 0 ? '-' : '';
  const abs = Math.abs(seconds);
  const m = Math.floor(abs / 60);
  const s = Math.floor(abs % 60);
  return `${sign}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function deriveTimerDisplay(timer: TimerState, now: number = Date.now()): TimerDisplay {
  const elapsed = timer.isRunning && timer.startedAt !== null
    ? timer.elapsedAtPause + (now - timer.startedAt) / 1000
    : timer.elapsedAtPause;

  if (timer.mode === 'countup') {
    const secs = Math.floor(elapsed);
    return {
      text: formatMMSS(secs),
      seconds: secs,
      severity: 'normal',
      isOvertime: false,
    };
  }

  const remaining = Math.floor(timer.initialSeconds - elapsed);
  const isOvertime = remaining < 0;
  let severity: TimerSeverity = 'normal';
  if (isOvertime) severity = 'danger';
  else if (remaining < 5 * 60) severity = 'danger';
  else if (remaining < 15 * 60) severity = 'warning';
  return {
    text: formatMMSS(remaining),
    seconds: remaining,
    severity,
    isOvertime,
  };
}

/**
 * Tick once per second while the timer is running. Returns the live display
 * derived from the timer state every render.
 */
export function useTimer(timer: TimerState): TimerDisplay {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!timer.isRunning) return;
    const id = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [timer.isRunning]);

  return deriveTimerDisplay(timer);
}

export { computeElapsedSeconds };
