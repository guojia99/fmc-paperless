/**
 * cstimer_module is shipped as a Closure-compiled IIFE that only initializes
 * its `self.onmessage`/`module.exports` bindings when running inside a Web
 * Worker or Node.js. Importing it directly from the main thread leaves the
 * exports unset, which previously caused `getScramble is not a function`.
 *
 * The official README explicitly recommends running it as a classic Worker
 * in browsers. Load the raw file via `?url` so Vite emits it as a static asset
 * instead of bundling it (bundling adds `export` and breaks classic workers).
 *
 *   postMessage([msgid, type, args])  →  onmessage [msgid, type, result]
 *
 * Supported types we use: 'scramble' (args: [scrType]) and 'image' (args: [scr, scrType]).
 */

import cstimerModuleUrl from 'cstimer_module/cstimer_module.js?url';

type WorkerMessage = [msgid: number, type: string, payload: unknown];

interface PendingCall {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}

let worker: Worker | null = null;
let nextMsgId = 0;
const pending = new Map<number, PendingCall>();

function getWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(cstimerModuleUrl, { type: 'classic' });
  worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
    const [id, , result] = e.data;
    const call = pending.get(id);
    if (!call) return;
    pending.delete(id);
    call.resolve(result);
  };
  worker.onerror = (event) => {
    const err = new Error(`cstimer worker error: ${event.message ?? 'unknown'}`);
    for (const call of pending.values()) {
      call.reject(err);
    }
    pending.clear();
  };
  return worker;
}

function call<T>(type: string, args: unknown[]): Promise<T> {
  const w = getWorker();
  const id = ++nextMsgId;
  return new Promise<T>((resolve, reject) => {
    pending.set(id, {
      resolve: resolve as (v: unknown) => void,
      reject,
    });
    w.postMessage([id, type, args]);
  });
}

export function getScramble(type = '333fm'): Promise<string> {
  return call<string>('scramble', [type]);
}

export function getImage(scramble: string, type = '333fm'): Promise<string> {
  return call<string>('image', [scramble, type]);
}
