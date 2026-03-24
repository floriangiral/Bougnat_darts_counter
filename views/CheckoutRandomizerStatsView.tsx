import React from 'react';
import { Button } from '../components/ui/Button';
import { RandomizerPlayerState } from '../types';

interface CheckoutRandomizerStatsViewProps {
  results: RandomizerPlayerState[];
  onHome: () => void;
  onRematch: () => void;
}

export const CheckoutRandomizerStatsView: React.FC<CheckoutRandomizerStatsViewProps> = ({ results, onHome, onRematch }) => {
  // Sort by score descending
  const sortedResults = [...results].sort((a, b) => b.score - a.score);
  const winner = sortedResults[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6 flex flex-col relative overflow-y-auto">
      <div className="max-w-3xl mx-auto w-full space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500 drop-shadow-[0_0_15px_rgba(234,88,12,0.4)] uppercase">
            Game Over
          </h1>
          <p className="text-gray-400 text-lg">Checkout Randomizer</p>
        </div>

        {/* Winner Card */}
        <div className="bg-gray-800/40 border border-orange-500/30 rounded-2xl p-8 text-center relative overflow-hidden shadow-[0_0_30px_rgba(234,88,12,0.15)]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-500"></div>
          <h2 className="text-2xl text-orange-400 font-bold uppercase tracking-widest mb-2">Winner</h2>
          <div className="text-5xl font-black text-white mb-4 drop-shadow-lg">{winner.name}</div>
          <div className="text-3xl font-mono text-gray-300">Score: <span className="text-orange-400">{winner.score}</span></div>
        </div>

        {/* Leaderboard */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-400 uppercase tracking-wider border-b border-gray-800 pb-2">Final Standings</h3>
          {sortedResults.map((player, index) => (
            <div key={player.id} className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${index === 0 ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                  {index + 1}
                </div>
                <div className="text-xl font-bold text-gray-200">{player.name}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-mono font-black text-white">{player.score} <span className="text-sm text-gray-500 font-normal">pts</span></div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Final Tier: {player.currentTier}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-8">
          <Button variant="secondary" size="lg" onClick={onHome} className="w-full h-16 text-xl border-gray-700 hover:bg-gray-800">
            Home
          </Button>
          <Button variant="primary" size="lg" onClick={onRematch} className="w-full h-16 text-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 border-none shadow-[0_5px_15px_rgba(234,88,12,0.4)]">
            Rematch
          </Button>
        </div>

      </div>
    </div>
  );
};
