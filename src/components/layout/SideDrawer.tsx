import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/cn';
import { IconClose } from '@/components/common/Icons';
import { ArrangementBoard } from '@/components/arrangement-board/ArrangementBoard';

const TITLES = {
  none: '',
  arrangement: '手动整理板',
  sessions: '会话',
} as const;

export function SideDrawer() {
  const drawer = useUIStore((s) => s.drawer);
  const close = useUIStore((s) => s.closeDrawer);

  if (drawer === 'none' || drawer === 'sessions') return null;

  return (
    <aside
      className={cn(
        'fixed right-0 top-0 z-30 flex h-full w-full max-w-md flex-col',
        'border-l border-primary-100 bg-white shadow-xl',
        'md:relative md:max-w-sm md:shadow-none',
      )}
    >
      <div className="flex items-center justify-between border-b border-primary-100 px-3 py-2">
        <h2 className="text-sm font-semibold text-primary-700">{TITLES[drawer]}</h2>
        <button
          type="button"
          className="btn btn-ghost btn-icon"
          onClick={close}
          aria-label="关闭"
        >
          <IconClose size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-auto p-3">
        {drawer === 'arrangement' && <ArrangementBoard />}
      </div>
    </aside>
  );
}
