
import React, { useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { ClockPlayerState } from '../types';

interface ClockStatsViewProps {
  results: ClockPlayerState[];
  mode: 'STANDARD' | '180';
  onHome: () => void;
  onRematch: () => void;
}

export const ClockStatsView: React.FC<ClockStatsViewProps> = ({ results, mode, onHome, onRematch }) => {
  // Sort players by rank (Winner first)
  const sortedPlayers = [...results].sort((a, b) => {
       if (mode === '180') return b.score - a.score;
       // For clock, completed target is primary, total darts secondary
       if (b.targetIndex !== a.targetIndex) return b.targetIndex - a.targetIndex;
       return a.totalDarts - b.totalDarts;
  });

  const winner = sortedPlayers[0];

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 to-black text-white flex flex-col overflow-hidden">
      
      {/* HEADER */}
      <div className="shrink-0 pt-6 pb-4 text-center">
         <h1 className="text-3xl md:text-5xl font-black italic text-transparent bg-clip-text bg-gradient-to-br from-orange-500 via-red-500 to-orange-500 drop-shadow-[0_5px_15px_rgba(234,88,12,0.4)]">
            {mode === '180' ? '180 ATTACK' : 'ROUND THE WORLD'}
         </h1>
         <h2 className="text-lg md:text-xl text-gray-400 font-bold uppercase tracking-widest mt-2 px-4">
            Vainqueur: <span className="text-white">{winner.name}</span>
         </h2>
      </div>
      
      {/* STATS CONTENT */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 overflow-y-auto custom-scrollbar mb-4">
         <div className="bg-gray-900/50 rounded-2xl border border-gray-800 p-4 space-y-6 shadow-2xl">
             
             {/* STATS GRID */}
             {sortedPlayers.map((p, index) => {
                 // Calculate Specific Stats
                 const totalHits = p.history.filter(h => h.hitType !== 'MISS').length;
                 const hitRate = p.totalDarts > 0 ? ((totalHits / p.totalDarts) * 100).toFixed(0) : '0';
                 
                 // 180 Specifics
                 const ppr = p.totalDarts > 0 ? ((p.score / p.totalDarts) * 3).toFixed(1) : '0.0'; // Points per Round (3 darts)
                 const triples = p.history.filter(h => h.hitType === 'TRIPLE').length;
                 const doubles = p.history.filter(h => h.hitType === 'DOUBLE').length;

                 return (
                    <div key={p.id} className="border-b border-gray-800 pb-4 last:border-0">
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${index === 0 ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-400'}`}>
                                    {index + 1}
                                </div>
                                <span className="font-bold text-lg">{p.name}</span>
                            </div>
                            <div className="text-2xl font-black text-orange-500">
                                {mode === '180' ? p.score : (p.targetIndex >= 20 ? 'WIN' : 'DNF')}
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                             {mode === '180' ? (
                                 <>
                                     <StatBox label="PPR" value={ppr} />
                                     <StatBox label="Hit %" value={`${hitRate}%`} />
                                     <StatBox label="Triples" value={triples} />
                                     <StatBox label="Doubles" value={doubles} />
                                 </>
                             ) : (
                                 <>
                                    <StatBox label="Total Darts" value={p.totalDarts} />
                                    <StatBox label="Hit %" value={`${hitRate}%`} />
                                    <StatBox label="Misses" value={p.totalDarts - totalHits} />
                                    <StatBox label="Avg/Num" value={(p.totalDarts / (p.targetIndex || 1)).toFixed(1)} />
                                 </>
                             )}
                        </div>
                    </div>
                 );
             })}

         </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="shrink-0 w-full max-w-lg mx-auto px-6 pb-8 grid grid-cols-2 gap-4">
        <Button onClick={onRematch} variant="secondary" size="lg" className="w-full border-orange-600 text-orange-500 hover:bg-orange-900/20">
            REVANCHE
        </Button>
        <Button onClick={onHome} variant="primary" size="lg" className="w-full shadow-orange-900/40">
            SORTIE
        </Button>
      </div>
    </div>
  );
};

const StatBox = ({ label, value }: { label: string, value: string | number }) => (
    <div className="bg-gray-800/40 p-2 rounded text-center">
        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">{label}</div>
        <div className="font-mono font-bold text-white">{value}</div>
    </div>
);
