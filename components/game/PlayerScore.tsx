
import React from 'react';

interface PlayerScoreProps {
  name: string;
  subtitle?: string;
  showMatchStarterBadge?: boolean;
  currentThrowerName?: string;
  score: number;
  isActive: boolean;
  legsWon: number;
  setsWon?: number;
  stats?: {
    matchAvg: string;
    legAvg: string;
    legDarts: number;
    lastScore: number | null;
  };
}

export const PlayerScore: React.FC<PlayerScoreProps> = ({ name, subtitle, showMatchStarterBadge, currentThrowerName, score, isActive, legsWon, setsWon, stats }) => {
  const normalizedName = name.trim();
  const nameWrapperRef = React.useRef<HTMLDivElement | null>(null);
  const [nameFontSizePx, setNameFontSizePx] = React.useState(32);

  React.useLayoutEffect(() => {
    const wrapper = nameWrapperRef.current;
    if (!wrapper) return;

    const MIN_FONT = 14;
    const MAX_FONT = 44;
    const RIGHT_BADGE_SPACE = showMatchStarterBadge ? 34 : 4;
    const LETTER_WIDTH_FACTOR = 0.66;

    const fitName = () => {
      const availableWidth = wrapper.clientWidth - RIGHT_BADGE_SPACE;
      if (availableWidth <= 0) return;
      const letters = Math.max(1, normalizedName.length);
      const fittedFont = Math.floor(availableWidth / (letters * LETTER_WIDTH_FACTOR));
      setNameFontSizePx(Math.max(MIN_FONT, Math.min(MAX_FONT, fittedFont)));
    };

    fitName();
    const observer = new ResizeObserver(fitName);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [normalizedName, showMatchStarterBadge]);

  return (
    <div 
      className={`
        laptop-compact-player-score relative flex h-full min-h-0 w-full min-w-0 flex-col items-center justify-between overflow-hidden pb-1 pt-16 transition-colors duration-300 sm:pt-20 md:pt-24 md:pb-4 xl:pb-8
        ${isActive 
            ? 'bg-gray-800 text-white' 
            : 'bg-transparent text-gray-500'}
      `}
    >
      {/* Active Indicator Bar (Top) */}
      {isActive && (
        <div className="absolute top-0 inset-x-0 h-1 md:h-2 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.8)]"></div>
      )}

      {/* Name block: px instead of rem so system font-scale cannot inflate this fixed footprint. */}
      <div className="z-10 flex h-[88px] w-full shrink-0 flex-col items-center px-1 pt-2 text-center sm:px-2 md:h-[96px] xl:h-[104px]">
          <div className="relative flex h-[44px] w-full items-center justify-center md:h-[48px] xl:h-[52px]">
              <div ref={nameWrapperRef} className={`w-full overflow-hidden px-1 text-center ${showMatchStarterBadge ? 'pr-8' : ''}`}>
                <div
                  className={`inline-block whitespace-nowrap font-black uppercase leading-none tracking-[0.04em] ${isActive ? 'text-orange-500' : 'text-gray-600'}`}
                  style={{ fontSize: `${nameFontSizePx}px` }}
                >
                    {name}
                </div>
              </div>
              {showMatchStarterBadge && (
                  <span
                    title="A commencé la partie"
                    className={`absolute right-0 top-1/2 inline-flex h-5 min-w-5 -translate-y-1/2 items-center justify-center rounded-full border px-1.5 text-[9px] font-black uppercase tracking-[0.12em] md:h-6 md:min-w-6 md:text-[10px] ${
                      isActive
                        ? 'border-orange-400/70 bg-orange-500 text-black'
                        : 'border-orange-500/35 bg-orange-500/10 text-orange-300'
                    }`}
                  >
                    D
                  </span>
              )}
          </div>
          <div className={`mt-1 h-4 max-w-full truncate text-[10px] font-bold uppercase tracking-[0.14em] md:h-5 md:text-xs ${isActive ? 'text-white' : 'text-gray-500'}`}>
            {subtitle || ''}
          </div>
          <div className="mt-1 h-5 md:h-6">
            {isActive && currentThrowerName && (
                <div className="text-[10px] md:text-xs font-bold text-black bg-orange-500 px-2 py-0.5 rounded-full animate-pulse">
                    {currentThrowerName}
                </div>
            )}
          </div>
      </div>

      {/* Spec: spec:counter/score-layout-font-scale-resilience */}
      {/* Score font uses pure viewport units (vw+svh) — no rem — so system font-scale cannot cause overflow. */}
      <div className="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden pb-1 sm:pb-2 md:pb-0">
        <div className={`
            legacy-player-score-value laptop-compact-player-score-value z-10 font-mono font-black leading-none tracking-tighter transition-all duration-300
            text-[min(30vw,22svh)] md:text-[clamp(5.25rem,min(14vw,15vh),11.75rem)] lg:text-[clamp(5.75rem,min(15vw,16vh),12.75rem)] xl:text-[clamp(7rem,19vw,16.5rem)]
            ${isActive ? 'text-white drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]' : 'text-gray-700'}
        `}>
            {score}
        </div>
      </div>

      {/* Stats Row - 2 Lines on Mobile, 1 Line on Desktop */}
      <div className="z-10 w-full px-2 pb-1 md:px-6 md:pb-0">
        <div className={`grid grid-cols-2 gap-x-1 gap-y-2 border-t py-2 text-[10px] font-mono uppercase tracking-wider md:grid-cols-4 md:gap-4 md:py-3 md:text-xs ${isActive ? 'border-gray-600' : 'border-gray-800/50'}`}>
            
            {/* Leg Avg - Row 1 Col 1 */}
            <div className="flex flex-col items-center">
                 <span className="mb-1 text-gray-500 font-bold">Leg Avg</span>
                 <span className={`text-base md:text-lg font-black ${isActive ? 'text-white' : 'text-gray-500'}`}>{stats?.legAvg || '0.0'}</span>
            </div>

            {/* Match Avg - Row 1 Col 2 (Border Left) */}
            <div className="flex flex-col items-center border-l border-gray-700/50">
                 <span className="mb-1 text-gray-500 font-bold">Match Avg</span>
                 <span className={`text-base md:text-lg font-black ${isActive ? 'text-white' : 'text-gray-500'}`}>{stats?.matchAvg || '0.0'}</span>
            </div>

            {/* Darts Thrown - Row 2 Col 1 (No Border on Mobile, Border Left on Desktop) */}
            <div className="flex flex-col items-center md:border-l border-gray-700/50">
                 <span className="mb-1 text-gray-500 font-bold">Darts</span>
                 <span className={`text-base md:text-lg font-black ${isActive ? 'text-white' : 'text-gray-500'}`}>{stats?.legDarts || 0}</span>
            </div>

            {/* Last Score - Row 2 Col 2 (Border Left) */}
            <div className="flex flex-col items-center border-l border-gray-700/50">
                 <span className="mb-1 text-gray-500 font-bold">Last</span>
                 <span className={`text-base md:text-lg font-black ${isActive ? 'text-orange-500' : 'text-gray-500'}`}>{stats?.lastScore ?? '-'}</span>
            </div>
        </div>
      </div>
      
      {/* Background visual cue for inactive player to separate columns */}
      {!isActive && (
          <div className="absolute right-0 top-10 bottom-10 w-px bg-gray-800 md:hidden"></div>
      )}
    </div>
  );
};
