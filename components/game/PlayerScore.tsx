
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
  return (
    <div 
      className={`
        relative flex h-full min-h-0 w-full flex-col items-center justify-between pb-1 pt-16 transition-colors duration-300 md:pb-8 md:pt-20
        ${isActive 
            ? 'bg-gray-800 text-white' 
            : 'bg-transparent text-gray-500'}
      `}
    >
      {/* Active Indicator Bar (Top) */}
      {isActive && (
        <div className="absolute top-0 inset-x-0 h-1 md:h-2 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.8)]"></div>
      )}

      {/* Name & Thrower */}
      <div className="z-10 flex max-w-full shrink-0 flex-col items-center px-2 pt-2 text-center">
          <div className="flex max-w-full items-center justify-center gap-2">
              <div className={`max-w-full truncate text-base font-black uppercase tracking-[0.2em] sm:text-lg md:text-[1.75rem] md:tracking-[0.28em] ${isActive ? 'text-orange-500' : 'text-gray-600'}`}>
                  {name}
              </div>
              {showMatchStarterBadge && (
                  <span
                    title="A commencé la partie"
                    className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full border px-1.5 text-[9px] font-black uppercase tracking-[0.12em] md:h-6 md:min-w-6 md:text-[10px] ${
                      isActive
                        ? 'border-orange-400/70 bg-orange-500 text-black'
                        : 'border-orange-500/35 bg-orange-500/10 text-orange-300'
                    }`}
                  >
                    D
                  </span>
              )}
          </div>
          {subtitle && (
              <div className={`mt-1 max-w-full truncate text-[10px] font-bold uppercase tracking-[0.14em] md:text-xs ${isActive ? 'text-white' : 'text-gray-500'}`}>
                  {subtitle}
              </div>
          )}
          {isActive && currentThrowerName && (
              <div className="text-[10px] md:text-xs font-bold text-black bg-orange-500 px-2 py-0.5 rounded-full mt-1 animate-pulse">
                  {currentThrowerName}
              </div>
          )}
      </div>

      {/* THE SCORE - Massive scaling on Mobile (30vw) and Tablet (30vw) to fill 90% width of column */}
      <div className="flex min-h-0 w-full flex-1 items-center justify-center pb-1 sm:pb-2 md:pb-0">
        <div className={`
            z-10 font-mono font-black leading-none tracking-tighter transition-all duration-300
            text-[clamp(5.5rem,30vw,13rem)] md:text-[clamp(7rem,19vw,16.5rem)]
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
