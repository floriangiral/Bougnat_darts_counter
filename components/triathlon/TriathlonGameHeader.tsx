import React from 'react';
import { Button } from '../ui/Button';
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
  <div className="z-20 flex min-h-[78px] shrink-0 items-center justify-between border-b border-border bg-surface px-3 py-3 sm:min-h-[88px] sm:px-4 sm:py-4">
    <div className="flex flex-col gap-1">
      <div className="font-black italic text-base sm:text-lg md:text-xl">
        <span className="text-fg">BOUGNAT</span> <span className="text-brand-fg">DARTS</span>
      </div>
    </div>
    <div className="flex min-w-[92px] flex-col items-center justify-center sm:min-w-[112px]">
      <div className="mb-1 text-[11px] leading-none font-mono text-fg-faint md:text-xs">{currentTime}</div>
      <div className="text-base font-bold leading-none tracking-[0.18em] font-mono text-brand-fg sm:text-lg md:text-xl">{formatDuration(elapsedSeconds)}</div>
    </div>
    <div className="flex gap-1.5 sm:gap-2">
      <Button onClick={onShowStats} className="rounded border border-border-strong bg-surface-raised px-3 py-2 text-[11px] font-bold uppercase text-fg sm:px-3.5 sm:py-2 sm:text-xs">
        Stats
      </Button>
      <Button onClick={onShowExitConfirm} variant="danger" className="rounded border border-danger-border px-3 py-2 text-[11px] font-bold uppercase text-danger-fg sm:px-3.5 sm:py-2 sm:text-xs">
        Quitter
      </Button>
    </div>
  </div>
);
