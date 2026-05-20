import { useRef } from 'react';
import { selectActiveSession, useSessionStore } from '@/store/sessionStore';
import {
  downloadJson,
  parseImport,
  serializeForExport,
} from '@/lib/persistence';
import { IconDownload, IconUpload } from '@/components/common/Icons';

export function ExportButton() {
  const session = useSessionStore(selectActiveSession);
  const handleExport = () => {
    if (!session) return;
    const { filename, json } = serializeForExport(session);
    downloadJson(filename, json);
  };
  return (
    <button
      type="button"
      className="btn btn-icon"
      onClick={handleExport}
      disabled={!session}
      title="导出当前会话"
      aria-label="导出"
    >
      <IconDownload size={16} />
    </button>
  );
}

export function ImportButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const importSession = useSessionStore((s) => s.importSession);
  const handlePick = () => inputRef.current?.click();
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseImport(text);
      importSession(parsed);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '导入失败';
      alert(`导入失败：${msg}`);
    }
    e.target.value = '';
  };
  return (
    <>
      <button
        type="button"
        className="btn btn-icon"
        onClick={handlePick}
        title="导入会话 JSON"
        aria-label="导入"
      >
        <IconUpload size={16} />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFile}
      />
    </>
  );
}
