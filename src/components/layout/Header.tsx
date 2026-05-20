import { ScrambleStrip } from '@/components/scramble/ScrambleStrip';
import { Timer } from '@/components/timer/Timer';
import { SessionsMenu } from '@/components/sessions/SessionsMenu';
import {
  ExportButton,
  ImportButton,
} from '@/components/import-export/ImportExport';

export function Header() {
  return (
    <header className="z-10 border-b border-primary-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex flex-wrap items-center gap-2 px-3 py-2">
        <div className="flex items-center gap-2 pr-2">
          <span className="rounded-lg bg-primary-500 px-2 py-1 text-xs font-bold tracking-widest text-white">
            FMC
          </span>
          <span className="hidden text-sm text-slate-500 md:inline">
            无纸化练习
          </span>
        </div>
        <ScrambleStrip />
        <div className="flex items-center gap-1">
          <Timer />
          <SessionsMenu />
          <ImportButton />
          <ExportButton />
        </div>
      </div>
    </header>
  );
}
