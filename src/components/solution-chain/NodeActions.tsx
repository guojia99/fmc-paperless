import { selectActiveChain, useSessionStore } from '@/store/sessionStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/cn';
import type { NodeColor } from '@/core/solution';
import {
  IconBracket,
  IconHash,
  IconPalette,
  IconPlus,
  IconShadow,
  IconTrash,
} from '@/components/common/Icons';

interface NodeActionsProps {
  nodeId: string;
  bracketed: boolean;
  color: NodeColor;
  isOnlyTopLevel: boolean;
  onToggleAnnotation: () => void;
  hasAnnotation: boolean;
}

const COLORS: NodeColor[] = ['none', 'sky', 'mint', 'lemon', 'rose', 'lilac'];
const COLOR_BTN: Record<NodeColor, string> = {
  none: 'bg-white border-slate-200',
  sky: 'bg-sky-200 border-sky-300',
  mint: 'bg-emerald-200 border-emerald-300',
  lemon: 'bg-amber-200 border-amber-300',
  rose: 'bg-rose-200 border-rose-300',
  lilac: 'bg-violet-200 border-violet-300',
};

export function NodeActions({
  nodeId,
  bracketed,
  color,
  isOnlyTopLevel,
  onToggleAnnotation,
  hasAnnotation,
}: NodeActionsProps) {
  const addChildNode = useSessionStore((s) => s.addChildNode);
  const addSiblingNode = useSessionStore((s) => s.addSiblingNode);
  const addShadowNode = useSessionStore((s) => s.addShadowNode);
  const deleteNode = useSessionStore((s) => s.deleteNode);
  const toggleBracket = useSessionStore((s) => s.toggleBracket);
  const setNodeColor = useSessionStore((s) => s.setNodeColor);
  const insertPlaceholder = useSessionStore((s) => s.insertPlaceholder);
  const addInsertion = useSessionStore((s) => s.addInsertion);
  const setActiveNode = useSessionStore((s) => s.setActiveNode);
  const openInsertionPicker = useUIStore((s) => s.openInsertionPicker);
  const chain = useSessionStore(selectActiveChain);
  const insertions = chain?.insertions ?? [];

  const handleInsert = () => {
    if (!chain) return;
    setActiveNode(nodeId);
    if (insertions.length === 0) {
      const ph = '#';
      addInsertion(chain.id, { placeholder: ph });
      insertPlaceholder(nodeId, ph);
    } else if (insertions.length > 1) {
      openInsertionPicker({ nodeId, chainId: chain.id });
    } else {
      insertPlaceholder(nodeId, insertions[0].placeholder);
    }
  };

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      <button
        type="button"
        className="btn btn-ghost text-xs"
        onClick={() => addChildNode(nodeId)}
        title="添加子步骤"
      >
        <IconPlus size={12} /> 子步骤
      </button>
      <button
        type="button"
        className="btn btn-ghost text-xs"
        onClick={() => addSiblingNode(nodeId)}
        title="在此步并列添加分支"
      >
        <IconPlus size={12} /> 分支
      </button>
      <button
        type="button"
        className="btn btn-ghost text-xs"
        onClick={() => addShadowNode(nodeId)}
        title="生成影子解法（仅反转最后一步）"
      >
        <IconShadow size={12} /> 影子
      </button>
      <button
        type="button"
        className="btn btn-ghost text-xs"
        onClick={handleInsert}
        title={
          insertions.length > 1
            ? '选择要插入的符号'
            : '插入占位符'
        }
      >
        <IconHash size={12} /> 插入
      </button>
      <button
        type="button"
        className={cn('btn text-xs', bracketed && 'btn-primary')}
        onClick={() => toggleBracket(nodeId)}
        title={bracketed ? '取消括号 (转换为正序)' : '加上括号 (转换为逆序)'}
      >
        <IconBracket size={12} /> {bracketed ? '反向' : '正向'}
      </button>
      <button
        type="button"
        className={cn('btn btn-ghost text-xs', hasAnnotation && 'text-primary-700')}
        onClick={onToggleAnnotation}
        title="注释"
      >
        注释
      </button>

      <div className="ml-auto flex items-center gap-1">
        <details className="relative">
          <summary className="btn btn-ghost text-xs">
            <IconPalette size={12} />
          </summary>
          <div className="absolute right-0 z-20 mt-1 flex gap-1 rounded-lg border border-primary-100 bg-white p-1 shadow-lg">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={cn(
                  'h-6 w-6 rounded-md border',
                  COLOR_BTN[c],
                  color === c && 'ring-2 ring-primary-400',
                )}
                aria-label={`color ${c}`}
                onClick={(e) => {
                  setNodeColor(nodeId, c);
                  (e.target as HTMLElement).closest('details')?.removeAttribute('open');
                }}
              />
            ))}
          </div>
        </details>

        {!isOnlyTopLevel && (
          <button
            type="button"
            className="btn btn-danger btn-icon text-xs"
            onClick={() => deleteNode(nodeId)}
            title="删除"
            aria-label="删除"
          >
            <IconTrash size={12} />
          </button>
        )}
      </div>
    </div>
  );
}
