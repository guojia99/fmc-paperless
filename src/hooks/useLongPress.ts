import { useCallback, useRef } from 'react';

interface UseLongPressOptions {
  thresholdMs?: number;
  onLongPress: () => void;
  onPress: () => void;
}

export function useLongPress({ thresholdMs = 400, onLongPress, onPress }: UseLongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  const start = useCallback(() => {
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      onLongPress();
    }, thresholdMs);
  }, [thresholdMs, onLongPress]);

  const end = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!isLongPress.current) {
      onPress();
    }
  }, [onPress]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    isLongPress.current = false;
  }, []);

  return { start, end, cancel, isLongPress };
}

interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  thresholdPx?: number;
}

export function useSwipe({ onSwipeLeft, onSwipeRight, thresholdPx = 30 }: UseSwipeOptions) {
  const startX = useRef(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const diff = e.touches[0].clientX - startX.current;
    if (diff > thresholdPx) onSwipeRight?.();
    else if (diff < -thresholdPx) onSwipeLeft?.();
  }, [onSwipeLeft, onSwipeRight, thresholdPx]);

  const onTouchEnd = useCallback(() => {
    startX.current = 0;
  }, []);

  return { onTouchStart, onTouchMove, onTouchEnd };
}
