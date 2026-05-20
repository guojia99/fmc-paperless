import { useState } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { cn } from '@/lib/cn';
import {
  IconChevronDown,
  IconChevronRight,
  IconHash,
  IconPlus,
  IconTrash,
} from '@/components/common/Icons';
import {
  isPlaceholderTaken,
  PLACEHOLDER_CHARS,
  sanitizePlaceholder,
  type Insertion,
  type InsertionType,
} from '@/core/solution';

interface ChainInsertionsProps {
  chainId: string;
  insertions: Insertion[];
}

const TYPE_LABEL: Record<InsertionType, string> = {
  normal: '普通',
  wide: 'Wide',
  commutator: '交换子',
};

export function ChainInsertions({ chainId, insertions }: ChainInsertionsProps) {
  const addInsertion = useSessionStore((s) => s.addInsertion);
  const removeInsertion = useSessionStore((s) => s.removeInsertion);
  const updateInsertion = useSessionStore((s) => s.updateInsertion);
  const [open, setOpen] = useState(true);

  return (
    <div className="mb-2 rounded-xl border border-primary-100 bg-white/70 p-2">
      <div className="flex w-full items-center gap-1 text-xs font-semibold text-primary-700">
        <button
          type="button"
          className="flex items-center gap-1 text-primary-700"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
          <IconHash size={14} />
          <span>插入定义</span>
          {insertions.length > 0 && (
            <span className="ml-1 rounded-full bg-primary-500 px-1.5 text-[10px] text-white">
              {insertions.length}
            </span>
          )}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-icon ml-auto"
          onClick={() => {
            addInsertion(chainId);
            setOpen(true);
          }}
          title="新增插入"
        >
          <IconPlus size={12} />
        </button>
      </div>

      {open && (
        <div className="mt-2 flex flex-col gap-2">
          {insertions.length === 0 ? (
            <p className="rounded-lg border border-dashed border-primary-200 p-2 text-center text-[11px] text-slate-400">
              暂无插入。点击右上角 + 添加。
            </p>
          ) : (
            insertions.map((ins) => (
              <InsertionRow
                key={`${ins.id}:${ins.placeholder}`}
                insertion={ins}
                allInsertions={insertions}
                onChange={(patch) => updateInsertion(chainId, ins.id, patch)}
                onDelete={() => removeInsertion(chainId, ins.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

interface InsertionRowProps {
  insertion: Insertion;
  allInsertions: Insertion[];
  onChange: (patch: Partial<Insertion>) => void;
  onDelete: () => void;
}

function InsertionRow({
  insertion,
  allInsertions,
  onChange,
  onDelete,
}: InsertionRowProps) {
  const [phDraft, setPhDraft] = useState(insertion.placeholder);
  const [phError, setPhError] = useState<string | null>(null);

  const commitPlaceholder = () => {
    const next = sanitizePlaceholder(phDraft);
    if (next === insertion.placeholder) {
      setPhDraft(insertion.placeholder);
      setPhError(null);
      return;
    }
    if (isPlaceholderTaken(allInsertions, next, insertion.id)) {
      setPhError(`符号「${next}」已被其他插入使用`);
      setPhDraft(insertion.placeholder);
      return;
    }
    setPhError(null);
    setPhDraft(next);
    onChange({ placeholder: next });
  };

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-primary-100 bg-white p-2">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <label className="flex items-center gap-1">
          符号
          <input
            className={cn(
              'input w-12 py-0.5 text-center font-mono text-sm font-bold',
              phError && 'border-rose-400 ring-1 ring-rose-200',
            )}
            value={phDraft}
            maxLength={3}
            title={`可用：${PLACEHOLDER_CHARS.join(' ')} 或 $1、$2…`}
            onChange={(e) => {
              setPhDraft(e.target.value);
              setPhError(null);
            }}
            onBlur={commitPlaceholder}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitPlaceholder();
              }
              if (e.key === 'Escape') {
                setPhDraft(insertion.placeholder);
                setPhError(null);
              }
            }}
          />
        </label>
        {phError && (
          <span className="text-[10px] text-rose-600">{phError}</span>
        )}
        <label className="flex items-center gap-1">
          类型
          <select
            className="input w-auto py-0.5 text-xs"
            value={insertion.type}
            onChange={(e) => {
              const nextType = e.target.value as InsertionType;
              // Reset `moves` when switching type to a sensible default so the
              // body input doesn't show malformed content from another mode.
              if (nextType === 'wide') {
                onChange({ type: 'wide', moves: insertion.moves || 'w' });
              } else if (nextType === 'commutator') {
                onChange({ type: 'commutator', moves: insertion.moves || '' });
              } else {
                onChange({ type: 'normal', moves: insertion.moves || '' });
              }
            }}
          >
            {(['normal', 'wide', 'commutator'] as InsertionType[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn btn-danger btn-icon ml-auto"
          onClick={onDelete}
          aria-label="删除"
        >
          <IconTrash size={12} />
        </button>
      </div>

      {insertion.type === 'wide' ? (
        <WideBody value={insertion.moves} onChange={(moves) => onChange({ moves })} />
      ) : insertion.type === 'commutator' ? (
        <CommutatorBody
          value={insertion.moves}
          onChange={(moves) => onChange({ moves })}
        />
      ) : (
        <NormalBody value={insertion.moves} onChange={(moves) => onChange({ moves })} />
      )}
    </div>
  );
}

function NormalBody({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  return (
    <textarea
      className="textarea text-sm"
      rows={2}
      placeholder="示例：U2 B2 U2 L2 B2 U2 B2 L2"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const next = draft.trim();
        if (next !== value) onChange(next);
      }}
    />
  );
}

function CommutatorBody({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  return (
    <div className="flex flex-col gap-1">
      <textarea
        className="textarea font-mono text-sm"
        rows={2}
        placeholder="A:[B, C] 或 [B, C]（A 可为空）"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          const next = draft.trim();
          if (next !== value) onChange(next);
        }}
      />
      <span className="text-[10px] text-slate-400">
        语法参考 nbwzx/commutator：使用 <code>[B,C]</code> 表示 B C B' C'，
        前置 <code>A:</code> 表示共轭 A …… A'。
      </span>
    </div>
  );
}

const WIDE_OPTIONS: { value: string; label: string }[] = [
  { value: 'w', label: 'w' },
  { value: 'w2', label: 'w2' },
  { value: "w'", label: "w'" },
];

function WideBody({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {WIDE_OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          className={cn(
            'btn font-mono text-sm',
            value === o.value && 'btn-primary',
          )}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
      <span className="text-[10px] text-slate-400">
        在动作末尾拼接，例如 <code className="font-mono">F</code>+
        <code className="font-mono">{value || 'w'}</code>=
        <code className="font-mono">F{value || 'w'}</code>
      </span>
    </div>
  );
}
