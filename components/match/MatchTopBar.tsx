import { BarChart3, LogOut, Settings } from 'lucide-react';

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
}: MatchTopBarProps) {
  return (
    <div className="laptop-compact-topbar z-20 flex min-h-[78px] shrink-0 items-center justify-between border-b border-gray-800 bg-gray-900 px-3 py-2.5 sm:min-h-[88px] sm:px-4 sm:py-3">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="whitespace-nowrap font-black italic text-base sm:text-lg md:text-xl">
          <span className="text-white">BOUGNAT</span> <span className="text-orange-500">DARTS</span>
        </div>
        <div className="inline-flex w-fit items-center whitespace-nowrap rounded-full border border-gray-700/80 bg-gray-900/94 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-gray-300 shadow-[0_10px_24px_rgba(0,0,0,0.35)] backdrop-blur-md sm:px-3 sm:text-[10px] sm:tracking-[0.12em] md:text-[11px]">
          <span className="sm:hidden">{compactFormatText}</span>
          <span className="hidden sm:inline">{formatText}</span>
        </div>
      </div>

      <div className="laptop-compact-timer flex min-w-[92px] flex-col items-center justify-center sm:min-w-[112px]">
        <div className="mb-1 text-[11px] leading-none text-gray-500 font-mono md:text-xs">{currentTime}</div>
        <div className="text-base font-bold leading-none tracking-[0.18em] text-orange-500 font-mono sm:text-lg md:text-xl">{elapsedTime}</div>
      </div>

      <div className="laptop-compact-topbar-actions flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={onOpenStats}
          className="inline-flex h-[38px] w-[38px] items-center justify-center rounded border border-gray-700 bg-gray-800 text-[11px] font-bold uppercase text-white transition-colors hover:bg-gray-700 sm:h-[40px] sm:w-[40px] sm:text-xs"
          aria-label="Statistiques"
          title="Statistiques"
        >
          <BarChart3 className="h-4 w-4" />
        </button>
        <button
          onClick={onOpenSettings}
          className="inline-flex h-[38px] w-[38px] items-center justify-center rounded border border-gray-700 bg-gray-800 text-white transition-colors hover:bg-gray-700 sm:h-[40px] sm:w-[40px]"
          aria-label="Configuration"
          title="Configuration"
        >
          <Settings className="h-4 w-4" />
        </button>
        <button
          onClick={onExit}
          className="inline-flex h-[38px] w-[38px] items-center justify-center rounded border border-red-900/30 text-red-500 transition-colors hover:bg-red-950/30 sm:h-[40px] sm:w-[40px]"
          aria-label="Quitter"
          title="Quitter"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
