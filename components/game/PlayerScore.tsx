import React from 'react';

interface PlayerScoreProps {
  name: string;
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

export const PlayerScore: React.FC<PlayerScoreProps> = ({ name, currentThrowerName, score, isActive, legsWon, setsWon, stats }) => {
  return (
    <div 
      className={`
        relative flex flex-col items-center justify-center h-full w-full transition-colors duration-300
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
      <div className="flex flex-col items-center mb-2 z-10">
          <div className={`text-sm md:text-xl font-black uppercase tracking-widest ${isActive ? 'text-orange-500' : 'text-gray-600'}`}>
              {name}
          </div>
          {isActive && currentThrowerName && (
              <div className="text-[10px] md:text-xs font-bold text-black bg-orange-500 px-2 py-0.5 rounded-full mt-1 animate-pulse">
                  {currentThrowerName}
              </div>
          )}
      </div>

      {/* THE SCORE - Massive Font */}
      <div className={`
        font-mono font-black leading-none tracking-tighter z-10 transition-all duration-300
        text-[20vw] md:text-[12vw] lg:text-[160px]
        ${isActive ? 'text-white drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]' : 'text-gray-700'}
      `}>
        {score}
      </div>

      {/* Stats Row - Compacted */}
      <div className="mt-4 flex space-x-4 md:space-x-8 text-[10px] md:text-xs font-mono uppercase tracking-wider opacity-80">
        <div className="flex flex-col items-center">
             <span className="text-gray-600 font-bold mb-0.5">Last</span>
             <span className={`${isActive ? 'text-white' : 'text-gray-500'}`}>{stats?.lastScore ?? '-'}</span>
        </div>
        <div className="flex flex-col items-center">
             <span className="text-gray-600 font-bold mb-0.5">Avg</span>
             <span className={`${isActive ? 'text-white' : 'text-gray-500'}`}>{stats?.matchAvg || '0.0'}</span>
        </div>
        {/* Only show Darts count on tablet/desktop to save space on phone */}
        <div className="hidden md:flex flex-col items-center">
             <span className="text-gray-600 font-bold mb-0.5">Darts</span>
             <span className={`${isActive ? 'text-white' : 'text-gray-500'}`}>{stats?.legDarts || 0}</span>
        </div>
      </div>
      
      {/* Background visual cue for inactive player to separate columns */}
      {!isActive && (
          <div className="absolute right-0 top-10 bottom-10 w-px bg-gray-800 md:hidden"></div>
      )}
    </div>
  );
};