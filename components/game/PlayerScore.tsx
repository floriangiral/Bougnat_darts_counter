import React from 'react';

interface PlayerScoreProps {
  name: string;
  currentThrowerName?: string; // New: For doubles
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
        flex flex-col items-center justify-center p-3 md:p-4 rounded-xl border-2 transition-all duration-300 relative overflow-hidden
        ${isActive 
            ? 'bg-gray-800 border-orange-500 shadow-[0_0_25px_rgba(234,88,12,0.3)] scale-[1.02] z-10' 
            : 'bg-gray-900 border-gray-800 opacity-60 scale-100'}
      `}
    >
      {/* Background decoration for active player */}
      {isActive && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 animate-pulse"></div>
      )}

      {/* Score Indicators (Legs or Sets) */}
      <div className="absolute top-3 right-3 flex flex-col items-end space-y-1">
          {/* Sets Number (if applicable) */}
          {setsWon !== undefined && (
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
               {setsWon} Sets
            </div>
          )}

          {/* Legs Dots */}
          <div className="flex space-x-1">
            {Array.from({length: legsWon}).map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-[0_0_5px_rgba(234,179,8,0.8)]"></div>
            ))}
          </div>
      </div>

      <div className={`text-sm font-black uppercase tracking-wider mb-1 ${isActive ? 'text-orange-500' : 'text-gray-500'}`}>
          {name}
      </div>
      
      {/* Current Thrower Subtext (Doubles) */}
      {isActive && currentThrowerName && (
          <div className="text-xs font-bold text-white bg-orange-600/80 px-2 py-0.5 rounded-full mb-1 animate-pulse">
              {currentThrowerName}
          </div>
      )}

      <div className={`text-6xl md:text-7xl font-mono font-black my-2 tracking-tighter ${isActive ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]' : 'text-gray-600'}`}>
        {score}
      </div>

      {/* Darts Count for Current Leg (Not fully implemented for team, so maybe hide if 0) */}
      {stats && stats.legDarts > 0 && (
          <div className={`text-xs font-mono mb-2 ${isActive ? 'text-orange-200' : 'text-gray-600'}`}>
             {stats.legDarts} Darts
          </div>
      )}

      <div className="w-full grid grid-cols-3 gap-2 text-xs md:text-xs mt-2 px-1 border-t border-gray-700/50 pt-3">
        <div className="flex flex-col items-center">
             <span className="text-[10px] uppercase text-gray-500 font-bold">Last</span>
             <span className={`font-mono font-bold ${isActive ? 'text-white' : 'text-gray-500'}`}>{stats?.lastScore ?? '-'}</span>
        </div>
        <div className="flex flex-col items-center">
             <span className="text-[10px] uppercase text-gray-500 font-bold">Leg Ø</span>
             <span className={`font-mono font-bold ${isActive ? 'text-white' : 'text-gray-500'}`}>{stats?.legAvg || '0.0'}</span>
        </div>
        <div className="flex flex-col items-center">
             <span className="text-[10px] uppercase text-gray-500 font-bold">Match Ø</span>
             <span className={`font-mono font-bold ${isActive ? 'text-white' : 'text-gray-500'}`}>{stats?.matchAvg || '0.0'}</span>
        </div>
      </div>
    </div>
  );
};