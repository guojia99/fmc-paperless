import type { ReactNode } from 'react';
import { Header } from './Header';
import { SideDrawer } from './SideDrawer';
import { InsertionPicker } from '@/components/solution-chain/InsertionPicker';
import { VirtualKeyboard } from '@/components/virtual-keyboard/VirtualKeyboard';
import { useMoveInputKeyboardDismiss } from '@/hooks/useMoveInputKeyboard';
import { useKeyboardStore } from '@/store/keyboardStore';
import { cn } from '@/lib/cn';
import { IconKeyboard } from '@/components/common/Icons';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  useMoveInputKeyboardDismiss();
  const position = useKeyboardStore((s) => s.position);
  const show = useKeyboardStore((s) => s.show);

  const isSideKb = position === 'left' || position === 'right';
  const isHidden = position === 'hidden';
  const isFloat = position === 'float';

  return (
    <div className="flex h-screen flex-col bg-primary-50">
      <Header />
      <div
        className={cn(
          'flex min-h-0 flex-1',
          isSideKb && position === 'left' ? 'flex-row' : 'flex-row',
        )}
      >
        {isSideKb && position === 'left' && (
          <div className="border-r border-primary-100 bg-white">
            <VirtualKeyboard orientation="vertical" />
          </div>
        )}

        <main className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {children}
          </div>
          <SideDrawer />
        </main>

        {isSideKb && position === 'right' && (
          <div className="border-l border-primary-100 bg-white">
            <VirtualKeyboard orientation="vertical" />
          </div>
        )}
      </div>

      {!isHidden && !isSideKb && !isFloat && (
        <div className="flex-shrink-0 border-t border-primary-100 bg-white/95 backdrop-blur-sm">
          <VirtualKeyboard orientation="horizontal" />
        </div>
      )}
      {isFloat && (
        <div className="pointer-events-none fixed bottom-2 right-2 z-20">
          <div className="pointer-events-auto rounded-2xl border border-primary-100 bg-white/95 p-1 shadow-xl backdrop-blur-sm">
            <VirtualKeyboard orientation="horizontal" compact />
          </div>
        </div>
      )}

      <InsertionPicker />

      {isHidden && (
        <button
          type="button"
          className={cn(
            'fixed bottom-4 right-4 z-30 flex items-center gap-2 rounded-full',
            'border border-primary-200 bg-white px-4 py-2 text-sm font-semibold',
            'text-primary-700 shadow-lg hover:bg-primary-50',
          )}
          onClick={show}
          title="显示虚拟键盘"
        >
          <IconKeyboard size={18} />
          显示键盘
        </button>
      )}
    </div>
  );
}
