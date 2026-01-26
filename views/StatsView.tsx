import React from 'react';
import { Button } from '../components/ui/Button';
import { StatsModal } from '../components/stats/StatsModal';
import { MatchState } from '../types';

interface StatsViewProps {
  winnerId: string;
  onHome: () => void;
  // In a real app we'd pass the full match object here, 
  // but for now we assume it's available or we pass it via props
  match?: MatchState; 
}

// NOTE: To make this work without prop drilling hell in App.tsx, 
// we'll assume the parent component passes the match state.
// If you are copy-pasting this into App.tsx, update <StatsView /> usage there.

export const StatsView: React.FC<StatsViewProps & { match: MatchState }> = ({ winnerId, onHome, match }) => {
  const winnerName = match.players.find(p => p.id === winnerId)?.name || 'Unknown';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex flex-col items-center p-4">
      
      <div className="mt-8 mb-4 text-center">
         <span className="text-6xl animate-bounce block mb-2">🏆</span>
         <h1 className="text-4xl md:text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-br from-orange-500 via-red-500 to-orange-500 drop-shadow-[0_5px_15px_rgba(234,88,12,0.4)]">
            GAME SHOT
         </h1>
         <h2 className="text-xl md:text-2xl text-gray-400 font-bold uppercase tracking-widest mt-2">
            Winner: <span className="text-white">{winnerName}</span>
         </h2>
      </div>
      
      {/* Container for the Stats Modal content, but displayed inline */}
      <div className="w-full max-w-4xl flex-1 relative min-h-[500px] mb-8">
         {/* We reuse the StatsModal structure but position it relative here */}
         <div className="absolute inset-0">
             <StatsModal match={match} title="FINAL MATCH STATISTICS" />
         </div>
      </div>

      <div className="w-full max-w-xs z-10 pb-8">
        <Button onClick={onHome} variant="primary" size="lg" className="w-full shadow-orange-900/40">
            Main Menu
        </Button>
      </div>
    </div>
  );
};