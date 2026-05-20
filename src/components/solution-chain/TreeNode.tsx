import { useEffect, useRef, useState } from 'react';
import type { SolutionNode } from '@/core/solution';
import { useSessionStore } from '@/store/sessionStore';
import { useKeyboardStore } from '@/store/keyboardStore';
import { cn } from '@/lib/cn';
import { AnnotationEditor } from './AnnotationEditor';
import { NodeActions } from './NodeActions';

interface TreeNodeRowProps {
  node: SolutionNode;
  isActive: boolean;
  isOnActivePath: boolean;
  isChainActive: boolean;
  stepCount: number;
  cumulativeCount: number;
  isOnlyTopLevel: boolean;
}

const COLOR_CLASS: Record<string, string> = {
  none: '',
  sky: 'node-color-sky',
  mint: 'node-color-mint',
  lemon: 'node-color-lemon',
  rose: 'node-color-rose',
  lilac: 'node-color-lilac',
};

export function TreeNodeRow({
  node,
  isActive,
  isOnActivePath,
  isChainActive,
  stepCount,
  cumulativeCount,
  isOnlyTopLevel,
}: TreeNodeRowProps) {
  const setActive = useSessionStore((s) => s.setActiveNode);
  const setNodeMoves = useSessionStore((s) => s.setNodeMoves);
  const setNodeLabel = useSessionStore((s) => s.setNodeLabel);
  const showForInput = useKeyboardStore((s) => s.showForInput);
  const hideForInput = useKeyboardStore((s) => s.hideForInput);
  const [editingMoves, setEditingMoves] = useState(false);
  const [editingLabel, setEditingLabel] = useState(false);
  const [showAnnotation, setShowAnnotation] = useState(node.annotation.length > 0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if ((editingMoves || editingLabel) && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingMoves, editingLabel]);

  const handleSelect = () => {
    setActive(node.id);
  };

  return (
    <div
      className={cn(
        'tree-node-row rounded-xl border p-2 transition-colors cursor-text',
        isActive
          ? 'border-primary-400 bg-white ring-2 ring-primary-200'
          : isOnActivePath
            ? 'border-primary-200 bg-white'
            : 'border-slate-200 bg-white/60 hover:border-primary-200',
        COLOR_CLASS[node.color] ?? '',
      )}
      onClick={handleSelect}
      role="button"
      tabIndex={0}
    >
      <div className="flex flex-wrap items-baseline gap-2">
        {editingLabel ? (
          <input
            ref={inputRef}
            className="input min-w-0 max-w-24 px-1 py-0 text-xs"
            defaultValue={node.label}
            onBlur={(e) => {
              setNodeLabel(node.id, e.currentTarget.value);
              setEditingLabel(false);
              if (isActive) showForInput();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setNodeLabel(node.id, e.currentTarget.value);
                setEditingLabel(false);
              }
              if (e.key === 'Escape') setEditingLabel(false);
            }}
          />
        ) : (
          <button
            type="button"
            className={cn(
              'chip text-xs',
              node.label ? 'chip-primary' : 'chip-amber italic opacity-60',
            )}
            onClick={(e) => {
              e.stopPropagation();
              hideForInput();
              setEditingLabel(true);
            }}
            title="点击编辑步骤名"
          >
            {node.label || '未命名'}
          </button>
        )}

        {node.bracketed && (
          <span className="font-mono text-base font-bold text-primary-600">(</span>
        )}

        {editingMoves ? (
          <input
            ref={inputRef}
            className="input min-w-0 flex-1 font-mono text-base"
            defaultValue={node.moves}
            onBlur={(e) => {
              setNodeMoves(node.id, e.currentTarget.value);
              setEditingMoves(false);
              if (isActive) showForInput();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setNodeMoves(node.id, e.currentTarget.value);
                setEditingMoves(false);
              }
              if (e.key === 'Escape') setEditingMoves(false);
            }}
          />
        ) : (
          <div
            className="min-w-0 flex-1 cursor-text break-all font-mono text-base text-slate-800"
            onDoubleClick={(e) => {
              e.stopPropagation();
              hideForInput();
              setEditingMoves(true);
            }}
          >
            {node.moves || (
              <span className="text-slate-300 italic">
                {isActive ? '点击虚拟键盘输入...' : '点击此处激活并输入'}
              </span>
            )}
          </div>
        )}

        {node.bracketed && (
          <span className="font-mono text-base font-bold text-primary-600">)</span>
        )}

        <span className="ml-auto whitespace-nowrap font-mono text-xs text-slate-500">
          {stepCount}/{cumulativeCount}
        </span>
      </div>

      {(showAnnotation || node.annotation) && (
        <AnnotationEditor nodeId={node.id} value={node.annotation} />
      )}

      {isActive && isChainActive && (
        <NodeActions
          nodeId={node.id}
          bracketed={node.bracketed}
          color={node.color}
          isOnlyTopLevel={isOnlyTopLevel}
          hasAnnotation={!!node.annotation}
          onToggleAnnotation={() => setShowAnnotation((v) => !v)}
        />
      )}
    </div>
  );
}
