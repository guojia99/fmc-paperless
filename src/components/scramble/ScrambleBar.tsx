import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { selectActiveSession, useSessionStore } from '@/store/sessionStore';
import { useScramble } from '@/hooks/useScramble';
import { svgToPngUrl } from '@/lib/svg-to-png';
import { cn } from '@/lib/cn';
import { IconEdit, IconEye, IconEyeOff } from '@/components/common/Icons';

export function ScrambleBar() {
  const session = useSessionStore(selectActiveSession);
  const setScrambleText = useSessionStore((s) => s.setScrambleText);
  const toggleHidden = useSessionStore((s) => s.toggleScrambleImageHidden);
  const { generate, refreshImage, isLoading, error } = useScramble();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [pngData, setPngData] = useState<string | null>(null);
  const [pngError, setPngError] = useState(false);

  const scrambleImage = session?.scramble.image ?? null;
  const scrambleText = session?.scramble.text ?? '';
  const timerRunning = session?.timer.isRunning ?? false;
  const scrambleLocked = timerRunning;

  useEffect(() => {
    if (!scrambleImage) {
      setPngData(null);
      setPngError(false);
      return;
    }
    let cancelled = false;
    setPngError(false);
    void svgToPngUrl(scrambleImage)
      .then((data) => {
        if (!cancelled) setPngData(data);
      })
      .catch(() => {
        if (!cancelled) {
          setPngData(null);
          setPngError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [scrambleImage]);

  const startEdit = () => {
    if (scrambleLocked) return;
    setDraft(scrambleText);
    setEditing(true);
  };

  if (!session) return null;
  const { scramble } = session;

  const handleGenerate = async () => {
    if (scrambleLocked) return;
    const result = await generate();
    if (result) {
      setScrambleText(result.text, result.image);
    }
  };

  const handleCommitEdit = async () => {
    setEditing(false);
    if (draft.trim() === scramble.text.trim()) return;
    setScrambleText(draft.trim());
    const image = await refreshImage(draft.trim());
    if (image !== null) {
      setScrambleText(draft.trim(), image);
    }
  };

  const showImage =
    !scramble.imageHidden && !!scramble.image && !!pngData && !pngError;

  return (
    <section
      className="flex-shrink-0 border-b border-primary-100 bg-white/90 px-3 py-2 backdrop-blur-sm"
      aria-label="打乱"
    >
      <div
        className={cn(
          'mx-auto flex flex-col gap-2',
          showImage ? 'sm:flex-row sm:items-start sm:gap-3' : '',
        )}
      >
        {showImage && (
          <div className="flex shrink-0 items-start">
            <div
              className={cn(
                'scramble-image--inline rounded-lg border border-primary-200 bg-white p-1',
              )}
            >
              <div className="svg-container">
                <img src={pngData!} alt={scramble.text || '打乱图'} />
              </div>
            </div>
          </div>
        )}

        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              autoFocus
              className="input w-full font-mono text-sm"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={handleCommitEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCommitEdit();
                if (e.key === 'Escape') {
                  setDraft(scramble.text);
                  setEditing(false);
                }
              }}
            />
          ) : (
            <p
              className={cn(
                'rounded-md border border-primary-100 bg-white px-2 py-1.5 font-mono text-sm shadow-sm',
                'whitespace-pre-wrap break-words',
                scramble.text ? 'text-slate-800' : 'text-slate-400 italic',
              )}
            >
              {scramble.text || '尚无打乱，点击右侧按钮生成'}
            </p>
          )}
          {error && (
            <p className="mt-1 text-xs text-red-600" role="alert">
              {error}
            </p>
          )}
          {pngError && scramble.image && !scramble.imageHidden && (
            <p className="mt-1 text-xs text-amber-600" role="status">
              打乱图渲染失败
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 self-start sm:self-center">
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={toggleHidden}
            title={scramble.imageHidden ? '显示打乱图' : '隐藏打乱图'}
            aria-label={scramble.imageHidden ? '显示打乱图' : '隐藏打乱图'}
            disabled={!scramble.image}
          >
            {scramble.imageHidden ? (
              <IconEye size={16} />
            ) : (
              <IconEyeOff size={16} />
            )}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={editing ? () => setEditing(false) : startEdit}
            title={scrambleLocked ? '计时中不可编辑打乱' : '编辑打乱'}
            aria-label="编辑打乱"
            disabled={scrambleLocked}
          >
            <IconEdit size={16} />
          </button>
          <button
            type="button"
            className="btn btn-primary btn-icon"
            onClick={handleGenerate}
            disabled={isLoading || scrambleLocked}
            title={scrambleLocked ? '计时中不可刷新打乱' : '生成新打乱'}
            aria-label="生成新打乱"
          >
            <RefreshCw
              size={16}
              className={isLoading ? 'animate-spin' : undefined}
            />
          </button>
        </div>
      </div>
    </section>
  );
}
