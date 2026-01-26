import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { GameConfig, Player } from '../types';

interface SetupViewProps {
  onStart: (players: Player[], config: GameConfig) => void;
  onBack: () => void;
}

export const SetupView: React.FC<SetupViewProps> = ({ onStart, onBack }) => {
  const [startingScore, setStartingScore] = useState(501);
  const [legsToWin, setLegsToWin] = useState(3);
  const [playerNames, setPlayerNames] = useState<string[]>(['Player 1', 'Player 2']);
  const [checkOut, setCheckOut] = useState<'Open' | 'Double' | 'Master'>('Double');

  const updatePlayerCount = (delta: number) => {
    const currentCount = playerNames.length;
    const newCount = Math.max(1, Math.min(4, currentCount + delta));
    
    if (newCount === currentCount) return;

    setPlayerNames(prev => {
      if (newCount > prev.length) {
        return [...prev, `Player ${newCount}`];
      } else {
        return prev.slice(0, newCount);
      }
    });
  };

  const updatePlayerName = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const handleStart = () => {
    const players: Player[] = playerNames.map((name, i) => ({
      id: `p${i+1}`,
      name: name.trim() || `Player ${i+1}`
    }));

    const config: GameConfig = {
      startingScore,
      checkIn: 'Open',
      checkOut,
      legsToWin
    };

    onStart(players, config);
  };

  const activeOptionClass = "bg-gradient-to-r from-orange-600 to-red-600 text-white border-transparent shadow-[0_0_10px_rgba(234,88,12,0.3)]";
  const inactiveOptionClass = "bg-gray-800 border-gray-700 text-gray-400 hover:border-orange-500/50 hover:text-gray-200";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6 flex flex-col">
      <div className="flex items-center mb-8">
        <Button variant="ghost" onClick={onBack} size="sm">← Back</Button>
        <h2 className="text-2xl font-black italic ml-4 text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
            MATCH SETUP
        </h2>
      </div>

      <div className="flex-1 space-y-8 max-w-md mx-auto w-full">
        
        {/* Score Selection */}
        <section>
          <label className="block text-orange-500 mb-2 text-xs font-bold uppercase tracking-widest">Starting Score</label>
          <div className="grid grid-cols-4 gap-2">
            {[301, 501, 701, 1001].map(score => (
              <button
                key={score}
                onClick={() => setStartingScore(score)}
                className={`py-3 rounded font-black border transition-all duration-200 ${startingScore === score ? activeOptionClass : inactiveOptionClass}`}
              >
                {score}
              </button>
            ))}
          </div>
        </section>

        {/* Players Configuration */}
        <section>
          <label className="block text-orange-500 mb-2 text-xs font-bold uppercase tracking-widest">Players</label>
          <div className="flex items-center space-x-4 bg-gray-800/50 p-2 rounded-lg mb-4 border border-gray-700">
             <button onClick={() => updatePlayerCount(-1)} className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded text-xl font-bold transition-colors">-</button>
             <span className="flex-1 text-center font-black text-2xl text-white">{playerNames.length}</span>
             <button onClick={() => updatePlayerCount(1)} className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded text-xl font-bold transition-colors">+</button>
          </div>
          
          <div className="space-y-2">
            {playerNames.map((name, index) => (
              <div key={index} className="flex items-center group">
                <span className="w-8 text-gray-500 text-xs font-bold group-hover:text-orange-500 transition-colors">#{index + 1}</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => updatePlayerName(index, e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="flex-1 bg-gray-800 border border-gray-700 text-white px-3 py-3 rounded font-bold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                  placeholder={`Player ${index + 1}`}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Format */}
        <section>
          <label className="block text-orange-500 mb-2 text-xs font-bold uppercase tracking-widest">Legs to Win</label>
          <div className="grid grid-cols-3 gap-2">
            {[1, 3, 5].map(legs => (
              <button
                key={legs}
                onClick={() => setLegsToWin(legs)}
                className={`py-3 rounded font-bold text-sm border transition-all duration-200 ${legsToWin === legs ? activeOptionClass : inactiveOptionClass}`}
              >
                {legs === 1 ? '1 Leg' : `First to ${legs}`}
              </button>
            ))}
          </div>
        </section>

        {/* Checkout Rule */}
        <section>
           <label className="block text-orange-500 mb-2 text-xs font-bold uppercase tracking-widest">Checkout Rule</label>
           <div className="flex p-1 bg-gray-800 rounded-lg border border-gray-700">
             {(['Open', 'Double', 'Master'] as const).map(rule => (
                <button
                  key={rule}
                  onClick={() => setCheckOut(rule)}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all duration-200 ${checkOut === rule ? 'bg-gray-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  {rule} Out
                </button>
             ))}
           </div>
        </section>

      </div>

      <div className="mt-8">
        <Button onClick={handleStart} className="w-full py-5 text-2xl shadow-orange-900/20">GAME ON</Button>
      </div>
    </div>
  );
};