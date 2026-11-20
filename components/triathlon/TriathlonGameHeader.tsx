import React from 'react';
import { BarChart3, LogOut } from 'lucide-react';
import { IconButton } from '../ui/Button';
import { formatDuration } from '../../src/application/scoring/matchLifecycle';

interface TriathlonGameHeaderProps {
  currentTime: string;
  elapsedSeconds: number;
  onShowStats: () => void;
  onShowExitConfirm: () => void;
}

export const TriathlonGameHeader: React.FC<TriathlonGameHeaderProps> = ({
  currentTime,
  elapsedSeconds,
  onShowStats,
  onShowExitConfirm,
}) => (
  <div className="z-20 flex shrink-0 items-center justify-between gap-2 border-b border-border bg-surface px-3 py-2 sm:px-4 sm:py-3">
    <div className="font-black italic text-base sm:text-lg md:text-xl">
      <span className="text-fg">BOUGNAT</span> <span className="text-brand-fg">DARTS</span>
    </div>
    <div className="flex min-w-[92px] flex-col items-center justify-center sm:min-w-[112px]">
      <div className="mb-1 font-mono text-[11px] leading-none text-fg-faint md:text-xs">{currentTime}</div>
      <div className="font-mono text-base font-bold leading-none tracking-[0.18em] text-brand-fg sm:text-lg md:text-xl">{formatDuration(elapsedSeconds)}</div>
    </div>
    <div className="flex gap-1.5 sm:gap-2">
      <IconButton label="Statistiques" onClick={onShowStats}>
        <BarChart3 aria-hidden="true" className="h-5 w-5" />
      </IconButton>
      <IconButton label="Quitter" tone="danger" onClick={onShowExitConfirm}>
        <LogOut aria-hidden="true" className="h-5 w-5" />
      </IconButton>
    </div>
  </div>
);
