import { useEffect, useState } from 'react';
import { selectActiveSession, useSessionStore } from '@/store/sessionStore';
import { useScramble } from '@/hooks/useScramble';
import { svgToPngUrl } from '@/lib/svg-to-png';
import { cn } from '@/lib/cn';
import {
  IconEdit,
  IconEye,
  IconEyeOff,
  IconRefresh,
} from '@/components/common/Icons';

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
    setDraft(scrambleText);
    setEditing(true);
  };

  if (!session) return null;
  const { scramble } = session;

  const handleGenerate = async () => {
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
      <div className="mx-auto flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
        {/* 打乱图 */}
        <div className="flex shrink-0 items-start gap-2">
          {showImage ? (
            <div
              className={cn(
                'scramble-image--inline rounded-lg border border-primary-200 bg-white p-1',
              )}
            >
              <div className="svg-container">
                <img src={pngData!} alt={scramble.text || '打乱图'} />
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (scramble.image) toggleHidden();
              }}
              className={cn(
                'scramble-image--placeholder flex items-center justify-center rounded-lg',
                'border border-dashed border-primary-200 bg-primary-50/50',
                'text-primary-500 hover:bg-primary-50',
              )}
              title={scramble.image ? '显示打乱图' : '尚无打乱图'}
              aria-label="显示打乱图"
              disabled={!scramble.image}
            >
              <IconEye size={24} />
            </button>
          )}
        </div>

        {/* 打乱文本 */}
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
          {pngError && scramble.image && (
            <p className="mt-1 text-xs text-amber-600" role="status">
              打乱图渲染失败
            </p>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex shrink-0 items-center gap-1 self-start sm:self-center">
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={
              showImage
                ? toggleHidden
                : () => {
                    if (scramble.image) toggleHidden();
                  }
            }
            title={showImage ? '隐藏打乱图' : '显示打乱图'}
            aria-label={showImage ? '隐藏打乱图' : '显示打乱图'}
            disabled={!scramble.image}
          >
            {showImage ? <IconEyeOff size={16} /> : <IconEye size={16} />}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={editing ? () => setEditing(false) : startEdit}
            title="编辑打乱"
            aria-label="编辑打乱"
          >
            <IconEdit size={16} />
          </button>
          <button
            type="button"
            className="btn btn-primary btn-icon"
            onClick={handleGenerate}
            disabled={isLoading}
            title="生成新打乱"
            aria-label="生成新打乱"
          >
            <IconRefresh size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
    </section>
  );
}
