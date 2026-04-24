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
  <div className="z-20 flex min-h-[78px] shrink-0 items-center justify-between border-b border-gray-800 bg-gray-900 px-3 py-3 sm:min-h-[88px] sm:px-4 sm:py-4">
    <div className="flex flex-col gap-1">
      <div className="font-black italic text-base sm:text-lg md:text-xl">
        <span className="text-white">BOUGNAT</span> <span className="text-orange-500">DARTS</span>
      </div>
    </div>
    <div className="flex min-w-[92px] flex-col items-center justify-center sm:min-w-[112px]">
      <div className="mb-1 text-[11px] leading-none font-mono text-gray-500 md:text-xs">{currentTime}</div>
      <div className="text-base font-bold leading-none tracking-[0.18em] font-mono text-orange-500 sm:text-lg md:text-xl">{formatDuration(elapsedSeconds)}</div>
    </div>
    <div className="flex gap-1.5 sm:gap-2">
      <Button onClick={onShowStats} className="rounded border border-gray-700 bg-gray-800 px-3 py-2 text-[11px] font-bold uppercase text-white sm:px-3.5 sm:py-2 sm:text-xs">
        Stats
      </Button>
      <Button onClick={onShowExitConfirm} variant="danger" className="rounded border border-red-900/30 px-3 py-2 text-[11px] font-bold uppercase text-red-500 sm:px-3.5 sm:py-2 sm:text-xs">
        Quitter
      </Button>
    </div>
  </div>
);
