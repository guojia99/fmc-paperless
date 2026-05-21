import { useKeyboardInput } from '@/hooks/useKeyboardInput';
import { useKeyboardStore } from '@/store/keyboardStore';
import { useUIStore } from '@/store/uiStore';
import { getVariantActions } from '@/core/keyboard';
import { cn } from '@/lib/cn';
import { IconEyeOff, IconGear } from '@/components/common/Icons';
import { KeyboardKey } from './KeyboardKey';

interface VirtualKeyboardProps {
  orientation: 'horizontal' | 'vertical';
  compact?: boolean;
}

export function VirtualKeyboard({ orientation, compact }: VirtualKeyboardProps) {
  const layout = useKeyboardStore((s) => s.layout);
  const hide = useKeyboardStore((s) => s.hide);
  const setConfiguring = useUIStore((s) => s.setConfiguringKeyboard);
  const { press } = useKeyboardInput();

  return (
    <div
      data-virtual-keyboard
      className={cn(
        'flex',
        orientation === 'horizontal' ? 'flex-col' : 'h-full flex-row',
        compact ? 'p-1' : 'p-2',
      )}
    >
      <div
        className={cn(
          'flex gap-1',
          orientation === 'horizontal' ? 'flex-col' : 'flex-row',
        )}
      >
        {layout.rows
          .filter((r) => r.isVisible)
          .map((row) => (
            <div
              key={row.id}
              className={cn(
                'flex gap-1',
                orientation === 'horizontal' ? 'w-full' : 'h-full flex-col',
              )}
            >
              {row.keys.map((key) => {
                const variants =
                  key.variantGroup && key.type === 'move'
                    ? getVariantActions(key.action).filter(Boolean)
                    : undefined;
                return (
                  <KeyboardKey
                    key={key.id}
                    def={key}
                    onPress={press}
                    longPressVariants={variants}
                    compact={compact}
                  />
                );
              })}
            </div>
          ))}
      </div>

      <div
        className={cn(
          'flex items-center justify-center gap-1',
          orientation === 'horizontal' ? 'mt-1 flex-row' : 'ml-1 flex-col',
        )}
      >
        <button
          type="button"
          className="btn btn-ghost btn-icon"
          onClick={() => setConfiguring(true)}
          title="键盘配置"
          aria-label="键盘配置"
        >
          <IconGear size={14} />
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-icon"
          onClick={hide}
          title="隐藏键盘"
          aria-label="隐藏键盘"
        >
          <IconEyeOff size={14} />
        </button>
      </div>

    </div>
  );
}
