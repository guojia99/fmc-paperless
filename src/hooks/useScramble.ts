import { useCallback, useState } from 'react';
import { getImage, getScramble } from '@/lib/cstimer-worker';

export interface GeneratedScramble {
  text: string;
  image: string;
}

export async function generateScramble(): Promise<GeneratedScramble> {
  const text = await getScramble('333fm');
  const image = await getImage(text, '333fm');
  return { text, image };
}

export async function imageForScramble(text: string): Promise<string> {
  return getImage(text, '333fm');
}

/**
 * Imperative scramble hook — exposes a generator that the caller can wire
 * into a button. State (text + image) lives in the session store; this
 * hook just provides the side-effecting generator with a loading flag.
 */
export function useScramble() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (): Promise<GeneratedScramble | null> => {
    setIsLoading(true);
    setError(null);
    try {
      return await generateScramble();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '生成打乱失败';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshImage = useCallback(async (text: string): Promise<string | null> => {
    if (!text.trim()) return null;
    try {
      return await imageForScramble(text);
    } catch {
      return null;
    }
  }, []);

  return { generate, refreshImage, isLoading, error };
}
