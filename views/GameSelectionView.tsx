
import React from 'react';
import { Button } from '../components/ui/Button';

export type GameType = 'X01' | 'CLOCK' | '180' | 'CRICKET' | 'RANDOMIZER' | 'CAPITAL' | 'TRIATHLON';

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
      id: 'CRICKET' as GameType,
      title: 'Cricket',
      desc: 'Close numbers 15-20 + Bull and score points.',
      active: true,
      color: 'from-green-600 to-emerald-600'
    },
    {
      id: '180' as GameType,
      title: "180 Around the Clock",
      desc: 'Score Attack! 3 darts per number (1-20+B).',
      active: true,
      color: 'from-purple-600 to-fuchsia-600'
    },
    {
      id: 'CLOCK' as GameType,
      title: "Around the world",
      desc: 'Race 1 to 20 + Bull. Hit to advance.',
      active: true,
      color: 'from-blue-600 to-cyan-600'
    },
    {
      id: 'RANDOMIZER' as GameType,
      title: 'Checkout Randomizer',
      desc: 'Finish random checkouts. Level up tiers, save with Bull!',
      active: true,
      color: 'from-orange-600 to-red-600'
    },
    {
      id: 'CAPITAL' as GameType,
      title: 'Capital',
      desc: '15 objectifs. Réussissez ou votre score est divisé par 2 !',
      active: true,
      color: 'from-orange-600 to-red-600'
    },
    {
      id: 'TRIATHLON' as GameType,
      title: 'Le Triathlon',
      desc: 'L\'épreuve ultime : 501 (BO3) ➔ Cricket ➔ Capital. Cumulez des points pour gagner !',
      active: true,
      color: 'from-yellow-600 to-amber-600'
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
            onClick={() => game.active && onSelect(game.id)}
            className={`
              relative group overflow-hidden rounded-xl p-6 text-left border border-gray-800 transition-all duration-300
              ${game.active ? 'bg-gray-800/40 hover:border-orange-500/50 hover:scale-[1.02] hover:shadow-2xl cursor-pointer' : 'bg-gray-900/20 opacity-70 cursor-not-allowed'}
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
