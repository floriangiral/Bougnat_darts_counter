import React, { useState } from 'react';
import { CapitalPlayerState } from '../types';
import { CAPITAL_TARGET_NAMES } from '../utils/capitalLogic';
import { Button } from '../components/ui/Button';

interface CapitalStatsViewProps {
  results: CapitalPlayerState[];
  onHome: () => void;
  onRematch: () => void;
}

export const CapitalStatsView: React.FC<CapitalStatsViewProps> = ({ results, onHome, onRematch }) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(results[0].id);
  const selectedPlayer = results.find(p => p.id === selectedPlayerId)!;

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-gradient-to-br from-gray-900 to-black p-3 text-white sm:p-4">
      <h2 className="mb-5 text-center text-2xl font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500 sm:mb-6 sm:text-3xl">
        Statistiques Capital
      </h2>

      {/* Player Tabs */}
      <div className="no-scrollbar mb-4 flex shrink-0 gap-2 overflow-x-auto pb-2">
        {results.map(p => (
          <button
            key={p.id}
            onClick={() => setSelectedPlayerId(p.id)}
            className={`
              whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-all
              ${selectedPlayerId === p.id 
                ? 'bg-orange-600 text-white shadow-[0_0_10px_rgba(234,88,12,0.5)]' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}
            `}
          >
            {p.name} ({p.score})
          </button>
        ))}
      </div>

      {/* Stats Content */}
      <div className="mb-4 flex-1 overflow-y-auto rounded-xl border border-gray-800 bg-gray-900/50 p-3 sm:p-4">
        <div className="mb-6 flex items-center justify-between gap-3 border-b border-gray-800 pb-4">
          <div className="text-gray-400 font-bold uppercase">Score Final</div>
          <div className="text-3xl font-black text-orange-500 sm:text-4xl">{selectedPlayer.score}</div>
        </div>

        <h3 className="text-lg font-bold text-gray-300 mb-4 uppercase tracking-wider">Historique des Objectifs</h3>
        <div className="flex flex-col gap-2">
          {selectedPlayer.history.map((h, idx) => (
            <div key={idx} className={`p-3 rounded-lg border ${h.isSuccess ? 'bg-green-900/20 border-green-900/50' : 'bg-red-900/20 border-red-900/50'}`}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="font-bold text-white">{CAPITAL_TARGET_NAMES[h.target]}</span>
                <span className={`font-black ${h.isSuccess ? 'text-green-400' : 'text-red-400'}`}>
                  {h.isSuccess ? `+${h.pointsScored}` : 'DIVISÉ PAR 2'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {h.darts.map((d, i) => (
                  <span key={i} className="text-xs font-mono bg-gray-800 px-2 py-1 rounded text-gray-300">
                    {d.value === 0 ? 'MISS' : d.value === 25 ? (d.multiplier === 2 ? 'DB' : 'B') : `${d.multiplier === 1 ? 'S' : d.multiplier === 2 ? 'D' : 'T'}${d.value}`}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <Button variant="secondary" onClick={onHome} className="h-14 text-lg">Menu Principal</Button>
        <Button onClick={onRematch} className="h-14 text-lg bg-gradient-to-r from-orange-600 to-red-600 border-none shadow-lg shadow-orange-900/50 hover:from-orange-500 hover:to-red-500">
          Rejouer
        </Button>
      </div>
    </div>
  );
};
