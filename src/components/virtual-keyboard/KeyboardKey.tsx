import { useRef, useState } from 'react';
import type { KeyDef } from '@/core/keyboard';
import { cn } from '@/lib/cn';
import { LongPressPopup } from './LongPressPopup';

interface KeyboardKeyProps {
  def: KeyDef;
  onPress: (action: string) => void;
  longPressVariants?: string[];
  compact?: boolean;
}

const LONG_PRESS_MS = 350;

export function KeyboardKey({
  def,
  onPress,
  longPressVariants,
  compact,
}: KeyboardKeyProps) {
  const [showVariants, setShowVariants] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressedRef = useRef(false);

  const cancelTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleDown = () => {
    longPressedRef.current = false;
    if (longPressVariants && longPressVariants.length > 0) {
      timerRef.current = setTimeout(() => {
        longPressedRef.current = true;
        setShowVariants(true);
      }, LONG_PRESS_MS);
    }
  };

  const handleUp = () => {
    cancelTimer();
    if (longPressedRef.current) return;
    onPress(def.action);
  };

  const handleLeave = () => {
    cancelTimer();
  };

  const handlePickVariant = (variant: string) => {
    setShowVariants(false);
    onPress(variant);
  };

  const handleCancelVariant = () => {
    setShowVariants(false);
  };

  return (
    <div className="relative flex-1">
      <button
        type="button"
        className={cn(
          'kb-key w-full',
          compact && 'h-10 min-w-10 text-sm',
          def.type === 'modifier' && 'kb-key-modifier',
          def.type === 'special' && 'kb-key-special',
        )}
        onPointerDown={(e) => {
          e.preventDefault();
          handleDown();
        }}
        onPointerUp={(e) => {
          e.preventDefault();
          handleUp();
        }}
        onPointerCancel={handleLeave}
        onPointerLeave={handleLeave}
      >
        {def.label}
      </button>
      {showVariants && longPressVariants && (
        <LongPressPopup
          variants={longPressVariants}
          onPick={handlePickVariant}
          onCancel={handleCancelVariant}
        />
      )}
    </div>
  );
}
