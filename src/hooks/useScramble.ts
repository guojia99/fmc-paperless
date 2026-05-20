import '@/lib/cstimer-shim';
import { useCallback, useState } from 'react';

interface ScrambleGen {
  getScramble: (type: string) => string;
  getImage: (scramble: string, type: string) => string;
}

let modulePromise: Promise<ScrambleGen> | null = null;

async function loadCstimer(): Promise<ScrambleGen> {
  if (!modulePromise) {
    modulePromise = import('cstimer_module').then((m) => {
      const mod = (m.default ?? m) as unknown as ScrambleGen;
      return mod;
    });
  }
  return modulePromise;
}

export interface GeneratedScramble {
  text: string;
  image: string;
}

export async function generateScramble(): Promise<GeneratedScramble> {
  const cs = await loadCstimer();
  const text = cs.getScramble('333');
  const image = cs.getImage(text, '333');
  return { text, image };
}

export async function imageForScramble(text: string): Promise<string> {
  const cs = await loadCstimer();
  return cs.getImage(text, '333');
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
