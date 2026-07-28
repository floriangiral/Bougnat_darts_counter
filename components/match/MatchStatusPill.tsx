import { CheckoutHint } from '../game/CheckoutHint';

type MatchStatusPillProps = {
  currentScore: number;
  isSetsMode: boolean;
  leftLegsWon: number;
  leftSetsWon: number;
  rightLegsWon: number;
  rightSetsWon: number;
  showHints: boolean;
};

export function MatchStatusPill({
  currentScore,
  isSetsMode,
  leftLegsWon,
  leftSetsWon,
  rightLegsWon,
  rightSetsWon,
  showHints,
}: MatchStatusPillProps) {
  return (
    <div className="pointer-events-none absolute left-1/2 top-2 z-20 flex -translate-x-1/2 transform flex-col items-center gap-2 sm:top-3">
      <div className="laptop-compact-status-pill pointer-events-auto grid w-[230px] max-w-[92vw] grid-cols-[1fr_auto_1fr] items-center rounded-full border border-gray-700/80 bg-gray-900/94 px-3 py-2 shadow-[0_0_22px_rgba(0,0,0,0.42)] backdrop-blur-md sm:w-[270px] sm:px-4 sm:py-2.5 md:w-[310px]">
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-[2.3rem] font-black leading-none text-orange-500 font-mono sm:text-[2.75rem] md:text-[3.1rem]">
            {isSetsMode ? leftSetsWon : leftLegsWon}
          </span>
          {isSetsMode && (
            <span className="text-xs font-bold text-gray-500 font-mono sm:text-sm md:text-base">({leftLegsWon})</span>
          )}
        </div>

        <span className="flex h-8 items-center px-3 text-[11px] font-black uppercase tracking-[0.18em] text-gray-300 sm:h-9 sm:px-4 sm:text-xs md:h-10 md:text-sm">
          {isSetsMode ? 'SETS' : 'MANCHES'}
        </span>

        <div className="flex items-center justify-center gap-1.5">
          {isSetsMode && (
            <span className="text-xs font-bold text-gray-500 font-mono sm:text-sm md:text-base">({rightLegsWon})</span>
          )}
          <span className="text-[2.3rem] font-black leading-none text-orange-500 font-mono sm:text-[2.75rem] md:text-[3.1rem]">
            {isSetsMode ? rightSetsWon : rightLegsWon}
          </span>
        </div>
      </div>
      {showHints && <CheckoutHint score={currentScore} />}
    </div>
  );
}
