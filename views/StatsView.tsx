import React, { useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { StatsModal } from '../components/stats/StatsModal';
import { MatchState } from '../types';

interface StatsViewProps {
  winnerId: string;
  onHome: () => void;
  onRematch?: () => void;
  match: MatchState; 
}

export const StatsView: React.FC<StatsViewProps> = ({ winnerId, onHome, onRematch, match }) => {
  const winnerName = match.players.find(p => p.teamId === winnerId)?.name || 'Unknown';

  // Auto-exit after 2 minutes of inactivity (extended from 1m)
  useEffect(() => {
      const timer = setTimeout(() => {
          onHome();
      }, 120000); 
      return () => clearTimeout(timer);
  }, [onHome]);

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 to-black text-white flex flex-col overflow-hidden">
      
      {/* HEADER SECTION */}
      <div className="shrink-0 pt-6 pb-4 text-center">
         <h1 className="text-4xl md:text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-br from-orange-500 via-red-500 to-orange-500 drop-shadow-[0_5px_15px_rgba(234,88,12,0.4)]">
            MATCH OVER
         </h1>
         <h2 className="text-lg md:text-xl text-gray-400 font-bold uppercase tracking-widest mt-2 px-4">
            Vainqueur: <span className="text-white">{winnerName}</span>
         </h2>
      </div>
      
      {/* STATS CONTENT SECTION */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 overflow-hidden mb-4">
         <div className="bg-gray-900/50 rounded-2xl border border-gray-800 h-full flex flex-col overflow-hidden shadow-2xl">
             <StatsModal match={match} title="STATISTIQUES DU MATCH" inline />
         </div>
      </div>

      {/* FOOTER ACTIONS SECTION */}
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