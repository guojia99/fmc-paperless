import type { ExportedSession, SolveSession } from '@/types';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function timestampFilename(prefix = 'fmc', now: Date = new Date()): string {
  const stamp =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `${prefix}-${stamp}.json`;
}

export function serializeForExport(session: SolveSession): {
  filename: string;
  json: string;
} {
  const payload: ExportedSession = {
    version: 1,
    exportedAt: Date.now(),
    session: {
      ...session,
      timer: { ...session.timer, isRunning: false, startedAt: null },
    },
  };
  return {
    filename: timestampFilename('fmc'),
    json: JSON.stringify(payload, null, 2),
  };
}

export function parseImport(raw: string): ExportedSession {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error('JSON 解析失败');
  }
  if (!data || typeof data !== 'object') {
    throw new Error('文件格式无效');
  }
  const obj = data as Partial<ExportedSession>;
  if (obj.version !== 1) {
    throw new Error('版本不支持');
  }
  if (!obj.session || typeof obj.session !== 'object') {
    throw new Error('缺少 session 数据');
  }
  return obj as ExportedSession;
}

export function downloadJson(filename: string, json: string): void {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
