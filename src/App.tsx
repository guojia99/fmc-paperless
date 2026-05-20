import { useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ChainList } from '@/components/solution-chain/ChainList';
import { selectActiveSession, useSessionStore } from '@/store/sessionStore';
import { useScramble } from '@/hooks/useScramble';

function App() {
  const bootstrap = useSessionStore((s) => s.bootstrap);
  const sessionId = useSessionStore((s) => selectActiveSession(s)?.id);
  const hasScramble = useSessionStore(
    (s) => !!selectActiveSession(s)?.scramble.text,
  );
  const setScrambleText = useSessionStore((s) => s.setScrambleText);
  const { generate } = useScramble();

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (!sessionId || hasScramble) return;
    let cancelled = false;
    void (async () => {
      const result = await generate();
      if (!cancelled && result) {
        setScrambleText(result.text, result.image);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, hasScramble, generate, setScrambleText]);

  return (
    <AppShell>
      <ChainList />
    </AppShell>
  );
}

export default App;
