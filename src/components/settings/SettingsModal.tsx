import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ExportButton,
  ImportButton,
} from '@/components/import-export/ImportExport';
import { IconClose } from '@/components/common/Icons';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card w-full max-w-sm p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="settings-title"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2
            id="settings-title"
            className="text-base font-semibold text-primary-700"
          >
            设置
          </h2>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            aria-label="关闭"
          >
            <IconClose size={16} />
          </button>
        </div>

        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-medium text-slate-500">数据</h3>
          <div className="flex flex-col gap-2">
            <ImportButton labeled />
            <ExportButton labeled />
          </div>
        </section>
      </div>
    </div>,
    document.body,
  );
}
