import React from 'react';
import { Button } from '../components/ui/Button';

export type GameType = 'X01' | 'CLOCK' | 'CRICKET' | '121' | 'SHANGHAI';

interface GameSelectionViewProps {
  onSelect: (type: GameType) => void;
  onBack: () => void;
}

export const GameSelectionView: React.FC<GameSelectionViewProps> = ({ onSelect, onBack }) => {
  
  const games = [
    {
      id: 'X01' as GameType,
      title: 'Match X01',
      desc: 'Classic 301, 501, 701. Race to zero with double out.',
      active: true,
      color: 'from-orange-600 to-red-600'
    },
    {
      id: 'CLOCK' as GameType,
      title: "Tour d'Horloge",
      desc: 'Hit 1 to 20 + Bull. Points: S=1, D=2, T=3.',
      active: false,
      color: 'from-blue-600 to-indigo-600'
    },
    {
      id: 'CRICKET' as GameType,
      title: 'Cricket',
      desc: 'Close numbers 15-20 + Bull and score points.',
      active: false,
      color: 'from-green-600 to-emerald-600'
    },
    {
      id: '121' as GameType,
      title: 'Finish 121',
      desc: 'Checkout practice. Finish 121-170 in 9 darts.',
      active: false,
      color: 'from-purple-600 to-violet-600'
    },
    {
      id: 'SHANGHAI' as GameType,
      title: 'Shanghai',
      desc: 'Hit Single, Double, Triple of the same number.',
      active: false,
      color: 'from-pink-600 to-rose-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6 flex flex-col">
      <div className="flex items-center mb-8">
        <Button variant="ghost" onClick={onBack} size="sm">← Back</Button>
        <h2 className="text-2xl font-black italic ml-4 text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500 uppercase">
            Select Game
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto w-full">
        {games.map((game) => (
          <button
            key={game.id}
            onClick={() => onSelect(game.id)}
            className={`
              relative group overflow-hidden rounded-xl p-6 text-left border border-gray-800 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl
              ${game.active ? 'bg-gray-800/40 hover:border-orange-500/50' : 'bg-gray-900/20 opacity-70 hover:opacity-100 cursor-not-allowed'}
            `}
          >
            {/* Background Gradient on Hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-2">
                <h3 className={`text-2xl font-black italic uppercase ${game.active ? 'text-white' : 'text-gray-400'}`}>
                  {game.title}
                </h3>
                {!game.active && (
                   <span className="text-[10px] uppercase font-bold bg-gray-800 text-gray-500 px-2 py-1 rounded border border-gray-700">Coming Soon</span>
                )}
              </div>
              
              <p className="text-sm text-gray-400 font-medium leading-relaxed">
                {game.desc}
              </p>
            </div>

            {/* Decoration */}
            <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br ${game.color} blur-2xl opacity-20 group-hover:opacity-30 transition-opacity`}></div>
          </button>
        ))}
      </div>
    </div>
  );
};
