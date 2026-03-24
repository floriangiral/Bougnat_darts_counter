import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { CapitalDart } from '../../types';

interface CapitalKeypadProps {
  onDartInput: (dart: CapitalDart) => void;
  onUndo: () => void;
  canUndo: boolean;
}

export const CapitalKeypad: React.FC<CapitalKeypadProps> = ({ onDartInput, onUndo, canUndo }) => {
  const [multiplier, setMultiplier] = useState<1 | 2 | 3>(1);

  const handleHit = (value: number) => {
    // If Bull (25) and multiplier is 3, treat as Single Bull (or maybe ignore, but let's just cap at 2)
    let finalMultiplier = multiplier;
    if (value === 25 && multiplier === 3) {
      finalMultiplier = 1;
    }
    onDartInput({ value, multiplier: finalMultiplier as 1 | 2 | 3 });
    setMultiplier(1); // Reset to single after hit
  };

  const handleMiss = () => {
    onDartInput({ value: 0, multiplier: 1 });
    setMultiplier(1);
  };

  const numbers = [
    20, 1, 18, 4, 13,
    6, 10, 15, 2, 17,
    3, 19, 7, 16, 8,
    11, 14, 9, 12, 5
  ];

  return (
    <div className="flex flex-col h-full gap-2 p-2 bg-gray-950 border-t border-gray-800 shadow-2xl">
      {/* Multiplier Toggles */}
      <div className="flex gap-2 h-12">
        <Button 
          variant={multiplier === 1 ? 'primary' : 'secondary'}
          onClick={() => setMultiplier(1)}
          className={`flex-1 font-bold text-lg ${multiplier === 1 ? 'bg-white text-black' : 'bg-gray-800 text-gray-400'}`}
        >
          SINGLE
        </Button>
        <Button 
          variant={multiplier === 2 ? 'primary' : 'secondary'}
          onClick={() => setMultiplier(2)}
          className={`flex-1 font-bold text-lg ${multiplier === 2 ? 'bg-cyan-500 text-black' : 'bg-gray-800 text-cyan-500'}`}
        >
          DOUBLE
        </Button>
        <Button 
          variant={multiplier === 3 ? 'primary' : 'secondary'}
          onClick={() => setMultiplier(3)}
          className={`flex-1 font-bold text-lg ${multiplier === 3 ? 'bg-orange-500 text-black' : 'bg-gray-800 text-orange-500'}`}
        >
          TRIPLE
        </Button>
      </div>

      {/* Numbers Grid */}
      <div className="flex-1 grid grid-cols-5 gap-1">
        {numbers.map(num => (
          <Button
            key={num}
            onClick={() => handleHit(num)}
            className={`
              text-xl font-black border-b-4 active:border-b-0 active:translate-y-1 transition-all
              ${multiplier === 1 ? 'bg-gray-800 hover:bg-gray-700 text-white border-gray-900' : ''}
              ${multiplier === 2 ? 'bg-cyan-900/50 hover:bg-cyan-800 text-cyan-400 border-cyan-900' : ''}
              ${multiplier === 3 ? 'bg-orange-900/50 hover:bg-orange-800 text-orange-400 border-orange-900' : ''}
            `}
          >
            {num}
          </Button>
        ))}
      </div>

      {/* Bottom Row: Bull, Miss, Undo */}
      <div className="h-14 grid grid-cols-4 gap-2">
        <Button 
          onClick={() => handleHit(25)}
          className={`
            col-span-2 font-black text-xl border-b-4 active:border-b-0 active:translate-y-1 transition-all
            ${multiplier === 2 ? 'bg-red-600 hover:bg-red-500 text-white border-red-800' : 'bg-green-700 hover:bg-green-600 text-white border-green-900'}
          `}
        >
          {multiplier === 2 ? 'D-BULL (50)' : 'BULL (25)'}
        </Button>
        <Button 
          variant="danger" 
          onClick={handleMiss} 
          className="font-bold text-lg"
        >
          MISS
        </Button>
        <Button 
          variant="secondary" 
          onClick={onUndo} 
          disabled={!canUndo} 
          className="font-bold text-sm text-gray-400"
        >
          UNDO
        </Button>
      </div>
    </div>
  );
};
