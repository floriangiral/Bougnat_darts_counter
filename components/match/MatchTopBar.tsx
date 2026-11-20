import { BarChart3, LogOut, Settings } from 'lucide-react';
import { IconButton } from '../ui/Button';

type MatchTopBarProps = {
  currentTime: string;
  elapsedTime: string;
  formatText: string;
  compactFormatText: string;
  onExit: () => void;
  onOpenSettings: () => void;
  onOpenStats: () => void;
};

export function MatchTopBar({
  currentTime,
  elapsedTime,
  formatText,
  compactFormatText,
  onExit,
  onOpenSettings,
  onOpenStats,
}: Readonly<MatchTopBarProps>) {
  return (
    <div className="x01-topbar laptop-compact-topbar z-20 flex min-h-[78px] shrink-0 items-center justify-between border-b border-border bg-surface px-3 py-2.5 sm:min-h-[88px] sm:px-4 sm:py-3">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="whitespace-nowrap text-base font-black italic sm:text-lg md:text-xl">
          <span className="text-fg">BOUGNAT</span> <span className="text-brand-fg">DARTS</span>
        </div>
        <div className="inline-flex w-fit items-center whitespace-nowrap rounded-full border border-border-strong/80 bg-surface-glass px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-fg-muted shadow-raised backdrop-blur-md sm:px-3 sm:text-[10px] sm:tracking-[0.12em] md:text-[11px]">
          <span className="sm:hidden">{compactFormatText}</span>
          <span className="hidden sm:inline">{formatText}</span>
        </div>
      </div>

      <div className="laptop-compact-timer flex min-w-[92px] flex-col items-center justify-center sm:min-w-[112px]">
        <div className="mb-1 font-mono text-[11px] leading-none text-fg-faint md:text-xs">{currentTime}</div>
        <div className="font-mono text-base font-bold leading-none tracking-[0.18em] text-brand-fg sm:text-lg md:text-xl">{elapsedTime}</div>
      </div>

      {/* Quitter est séparé des autres actions et confirmé par MatchView (spec 072 FR-07). */}
      <div className="laptop-compact-topbar-actions flex items-center gap-1.5 sm:gap-2">
        <IconButton label="Statistiques" onClick={onOpenStats} className="h-[38px] w-[38px] sm:h-[40px] sm:w-[40px]">
          <BarChart3 className="h-4 w-4" aria-hidden="true" />
        </IconButton>
        <IconButton label="Configuration" onClick={onOpenSettings} className="h-[38px] w-[38px] sm:h-[40px] sm:w-[40px]">
          <Settings className="h-4 w-4" aria-hidden="true" />
        </IconButton>
        <IconButton label="Quitter" tone="danger" onClick={onExit} className="ml-2 h-[38px] w-[38px] sm:ml-3 sm:h-[40px] sm:w-[40px]">
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </IconButton>
      </div>
    </div>
  );
}
