import { useState } from 'react';
import { Settings } from 'lucide-react';
import { Timer } from '@/components/timer/Timer';
import { SessionsMenu } from '@/components/sessions/SessionsMenu';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { HelpGuide } from '@/components/settings/HelpGuide';
import { IconGithub } from '@/components/common/Icons';

const GITHUB_URL = 'https://github.com/guojia99/fmc-paperless';

export function Header() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <>
      <header className="border-b border-primary-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex flex-wrap items-center gap-2 px-3 py-2">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-icon shrink-0"
            title="GitHub 仓库"
            aria-label="GitHub 仓库"
          >
            <IconGithub size={18} />
          </a>
          <div className="flex items-center gap-2 pr-2">
            <span className="rounded-lg bg-primary-500 px-2 py-1 text-xs font-bold tracking-widest text-white">
              FMC Paperless
            </span>
            <span className="hidden text-sm text-slate-500 md:inline">
              无纸化练习
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Timer />
            <SessionsMenu />
            <button
              type="button"
              className="btn btn-icon"
              onClick={() => setHelpOpen(true)}
              title="使用指南"
              aria-label="使用指南"
            >
              ?
            </button>
            <button
              type="button"
              className="btn btn-icon"
              onClick={() => setSettingsOpen(true)}
              title="设置"
              aria-label="设置"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
      </header>
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      <HelpGuide
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
      />
    </>
  );
}
