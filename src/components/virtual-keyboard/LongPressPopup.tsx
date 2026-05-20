import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

interface LongPressPopupProps {
  variants: string[];
  onPick: (variant: string) => void;
  onCancel: () => void;
}

/**
 * Floating popup shown above a key while the user holds it down. The user
 * can either tap one of the variant chips, OR slide their finger over the
 * desired chip and release (gesture).
 */
export function LongPressPopup({ variants, onPick, onCancel }: LongPressPopupProps) {
  const [hover, setHover] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleMove(e: TouchEvent | MouseEvent) {
      if (!containerRef.current) return;
      const x = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
      const y = 'touches' in e ? e.touches[0]?.clientY : e.clientY;
      if (x == null || y == null) return;
      const buttons = containerRef.current.querySelectorAll('button[data-variant-idx]');
      let next: number | null = null;
      buttons.forEach((btn) => {
        const r = btn.getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
          next = Number(btn.getAttribute('data-variant-idx'));
        }
      });
      setHover(next);
    }
    function handleEnd() {
      if (hover != null) onPick(variants[hover]);
      else onCancel();
    }
    window.addEventListener('touchmove', handleMove, { passive: true });
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchend', handleEnd);
    window.addEventListener('mouseup', handleEnd);
    return () => {
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('mouseup', handleEnd);
    };
  }, [hover, onPick, onCancel, variants]);

  return (
    <div
      ref={containerRef}
      className="absolute bottom-full left-1/2 z-40 mb-2 -translate-x-1/2 rounded-xl border border-primary-200 bg-white p-1 shadow-xl"
    >
      <div className="flex gap-1">
        {variants.map((v, i) => (
          <button
            key={v + i}
            type="button"
            data-variant-idx={i}
            className={cn(
              'min-w-12 rounded-lg border px-3 py-2 font-mono text-sm font-semibold',
              hover === i
                ? 'border-primary-500 bg-primary-500 text-white'
                : 'border-primary-200 bg-white text-slate-800',
            )}
            onClick={() => onPick(v)}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
