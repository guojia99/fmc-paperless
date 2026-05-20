/**
 * cstimer_module is a compiled Closure Library IIFE that expects bare `$` and `kernel`
 * globals (not `window.$`, but the identifier `$` itself via sloppy-mode global lookup).
 *
 * Its internal `tb()` guard skips initialization in browser ESM context because it only
 * runs when `WorkerGlobalScope` or Node.js `process` is detected. We must pre-set these
 * globals so the IIFE's top-level `$.svg = ...` and `kernel.getProp(...)` assignments work.
 *
 * This module MUST be statically imported before any dynamic `import('cstimer_module')`.
 */

const g = globalThis as Record<string, unknown>;

if (!g.$) {
  g.$ = {
    isArray: Array.isArray,
    noop() {},
    now() {
      return +new Date();
    },
  };
}

if (!g.kernel) {
  g.kernel = {
    getProp(key: string, fallback: string) {
      const v = g[key];
      return v === undefined ? fallback : (v as string);
    },
    setProp(key: string, value: string) {
      g[key] = value;
    },
  };

  const colors: Record<string, string> = {
    colcube: '#ff0#fa0#00f#fff#f00#0d0',
    colpyr: '#0f0#f00#00f#ff0',
    colskb: '#fff#00f#f00#ff0#0f0#f80',
    colmgm: '#fff#d00#060#81f#fc0#00b#ffb#8df#f83#7e0#f9f#999',
    colsq1: '#ff0#f80#0f0#fff#f00#00f',
    colclk: '#f00#37b#5cf#ff0#850',
    col15p: '#f99#9f9#99f#fff',
    colfto: '#fff#808#0d0#f00#00f#bbb#ff0#fa0',
    colico:
      '#fff#084#b36#a85#088#811#e71#b9b#05a#ed1#888#6a3#e8b#a52#6cb#c10#fa0#536#49c#ec9',
  };

  const kernel = g.kernel as { setProp: (k: string, v: string) => void };
  for (const [k, v] of Object.entries(colors)) {
    kernel.setProp(k, v);
  }
}
