import { useState } from 'react';
import { selectActiveSession, useSessionStore } from '@/store/sessionStore';
import { useScramble } from '@/hooks/useScramble';
import { cn } from '@/lib/cn';
import {
  IconEdit,
  IconEye,
  IconEyeOff,
  IconRefresh,
} from '@/components/common/Icons';

export function ScrambleStrip() {
  const session = useSessionStore(selectActiveSession);
  const setScrambleText = useSessionStore((s) => s.setScrambleText);
  const toggleHidden = useSessionStore((s) => s.toggleScrambleImageHidden);
  const { generate, refreshImage, isLoading } = useScramble();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [showImage, setShowImage] = useState(false);

  const startEdit = () => {
    setDraft(session?.scramble.text ?? '');
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

  return (
    <div className="relative flex min-w-0 flex-1 items-center gap-2">
      {scramble.image && !scramble.imageHidden ? (
        <button
          type="button"
          onClick={toggleHidden}
          className="rounded-md p-1 text-primary-600 hover:bg-primary-100"
          title="隐藏打乱图"
          aria-label="隐藏打乱图"
        >
          <IconEyeOff size={16} />
        </button>
      ) : (
        <button
          type="button"
          onMouseEnter={() => setShowImage(true)}
          onMouseLeave={() => setShowImage(false)}
          onClick={() => {
            if (scramble.imageHidden) toggleHidden();
          }}
          className="rounded-md p-1 text-primary-600 hover:bg-primary-100"
          title="显示打乱图"
          aria-label="显示打乱图"
        >
          <IconEye size={16} />
        </button>
      )}

      <div className="flex min-w-0 flex-1 items-center gap-2">
        {editing ? (
          <input
            autoFocus
            className="input font-mono text-sm"
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
          <code
            className={cn(
              'truncate rounded-md border border-primary-100 bg-white px-2 py-1 font-mono text-sm shadow-sm',
              scramble.text ? 'text-slate-800' : 'text-slate-400 italic',
            )}
            title={scramble.text || '尚无打乱'}
          >
            {scramble.text || '尚无打乱，点击右侧按钮生成'}
          </code>
        )}
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

      {scramble.image && (!scramble.imageHidden || showImage) && (
        <div
          className={cn(
            'scramble-image absolute left-0 top-full z-20 mt-2 rounded-xl border border-primary-200 bg-white p-2 shadow-lg',
            scramble.imageHidden && 'pointer-events-none',
          )}
          dangerouslySetInnerHTML={{ __html: scramble.image }}
          style={{ maxWidth: '240px' }}
        />
      )}
    </div>
  );
}
