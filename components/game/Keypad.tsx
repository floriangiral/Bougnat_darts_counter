
import React from 'react';
import { Mic } from 'lucide-react';
import { Button } from '../ui/Button';

interface KeypadProps {
  onInput: (val: number) => void;
  onClear: () => void;
  onEnter: () => void;
  onRemaining?: () => void;
  currentInput: string;
  isCheckoutPossible: boolean;
  // Quick Actions
  quickShortcutsLeft?: number[];
  quickShortcutsRight?: number[];
  onQuickAction?: (val: number) => void;
}

export const Keypad: React.FC<KeypadProps> = ({ 
  onInput, 
  onClear, 
  onEnter, 
  onRemaining,
  currentInput, 
  isCheckoutPossible,
  quickShortcutsLeft = [],
  quickShortcutsRight = [],
  onQuickAction
}) => {
  const voicePlaceholder = (
    <Button
      variant="secondary"
      disabled
      aria-label="Scoring vocal bientot disponible"
      title="Scoring vocal bientot disponible"
      className="row-span-2 h-full min-h-0 border-dashed border-gray-700 bg-gray-900/60 px-1 py-1 text-gray-500 shadow-inner hover:bg-gray-900/60 hover:border-gray-700 disabled:cursor-not-allowed disabled:border-gray-700 disabled:bg-gray-900/60 disabled:text-gray-500 disabled:opacity-100"
    >
      <div className="flex flex-col items-center justify-center gap-1.5 px-1 text-center">
        <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
        <span className="text-[8px] font-black uppercase tracking-[0.12em] sm:text-[9px]">Scoring</span>
        <span className="text-[8px] font-black uppercase tracking-[0.12em] sm:text-[9px]">Vocal IA</span>
      </div>
    </Button>
  );

  return (
    <div className="flex h-full min-h-0 gap-1.5 sm:gap-2">
      
      {/* LEFT SHORTCUTS */}
      {quickShortcutsLeft.length > 0 && (
        <div className="hidden md:grid w-20 shrink-0 grid-rows-4 gap-1.5 sm:gap-2 lg:w-24">
           {quickShortcutsLeft.map((val, idx) => (
               <Button 
                  key={`L-${idx}`} 
                  variant="secondary" 
                  onClick={() => onQuickAction && onQuickAction(val)}
                  className="h-full min-h-0 px-1 py-1 text-sm font-black bg-gray-900/80 border-gray-800 text-cyan-500 hover:text-white hover:bg-cyan-900 hover:border-cyan-500/50 shadow-lg transition-all sm:text-base lg:text-xl"
               >
                  {val}
               </Button>
           ))}
        </div>
      )}

      {/* CENTER NUMPAD */}
      <div className="grid min-h-0 flex-1 grid-cols-4 grid-rows-4 gap-1.5 sm:gap-2">
        <Button
          variant="secondary"
          onClick={() => onInput(1)}
          className="h-full min-h-0 px-1 py-1 text-lg font-bold bg-gray-800 border-gray-700 shadow-inner transition-transform active:scale-95 hover:bg-gray-700 sm:text-2xl md:text-3xl"
        >
          1
        </Button>
        <Button
          variant="secondary"
          onClick={() => onInput(2)}
          className="h-full min-h-0 px-1 py-1 text-lg font-bold bg-gray-800 border-gray-700 shadow-inner transition-transform active:scale-95 hover:bg-gray-700 sm:text-2xl md:text-3xl"
        >
          2
        </Button>
        <Button
          variant="secondary"
          onClick={() => onInput(3)}
          className="h-full min-h-0 px-1 py-1 text-lg font-bold bg-gray-800 border-gray-700 shadow-inner transition-transform active:scale-95 hover:bg-gray-700 sm:text-2xl md:text-3xl"
        >
          3
        </Button>
        <Button
          variant="secondary"
          onClick={onRemaining}
          className="h-full min-h-0 border-cyan-500/35 bg-cyan-950/40 px-1 py-1 text-xs font-black text-cyan-300 shadow-inner hover:border-cyan-400/60 hover:bg-cyan-900/50 hover:text-white sm:text-sm md:text-base"
          title="Indiquer le score restant"
        >
          RESTE
        </Button>
        <Button
          variant="secondary"
          onClick={() => onInput(4)}
          className="h-full min-h-0 px-1 py-1 text-lg font-bold bg-gray-800 border-gray-700 shadow-inner transition-transform active:scale-95 hover:bg-gray-700 sm:text-2xl md:text-3xl"
        >
          4
        </Button>
        <Button
          variant="secondary"
          onClick={() => onInput(5)}
          className="h-full min-h-0 px-1 py-1 text-lg font-bold bg-gray-800 border-gray-700 shadow-inner transition-transform active:scale-95 hover:bg-gray-700 sm:text-2xl md:text-3xl"
        >
          5
        </Button>
        <Button
          variant="secondary"
          onClick={() => onInput(6)}
          className="h-full min-h-0 px-1 py-1 text-lg font-bold bg-gray-800 border-gray-700 shadow-inner transition-transform active:scale-95 hover:bg-gray-700 sm:text-2xl md:text-3xl"
        >
          6
        </Button>
        {voicePlaceholder}
        <Button
          variant="secondary"
          onClick={() => onInput(7)}
          className="h-full min-h-0 px-1 py-1 text-lg font-bold bg-gray-800 border-gray-700 shadow-inner transition-transform active:scale-95 hover:bg-gray-700 sm:text-2xl md:text-3xl"
        >
          7
        </Button>
        <Button
          variant="secondary"
          onClick={() => onInput(8)}
          className="h-full min-h-0 px-1 py-1 text-lg font-bold bg-gray-800 border-gray-700 shadow-inner transition-transform active:scale-95 hover:bg-gray-700 sm:text-2xl md:text-3xl"
        >
          8
        </Button>
        <Button
          variant="secondary"
          onClick={() => onInput(9)}
          className="h-full min-h-0 px-1 py-1 text-lg font-bold bg-gray-800 border-gray-700 shadow-inner transition-transform active:scale-95 hover:bg-gray-700 sm:text-2xl md:text-3xl"
        >
          9
        </Button>
        <Button variant="danger" onClick={onClear} className="h-full min-h-0 px-1 py-1 text-sm font-bold shadow-sm sm:text-lg md:text-xl">C</Button>
        <Button
          variant="secondary"
          onClick={() => onInput(0)}
          className="h-full min-h-0 px-1 py-1 text-lg font-bold bg-gray-800 border-gray-700 shadow-inner transition-transform active:scale-95 hover:bg-gray-700 sm:text-2xl md:text-3xl"
        >
          0
        </Button>
        <Button onClick={onEnter} className="col-span-2 h-full min-h-0 px-1 py-1 text-lg font-black shadow-lg shadow-orange-900/30 sm:text-2xl md:text-3xl">OK</Button>
      </div>

      {/* RIGHT SHORTCUTS */}
      {quickShortcutsRight.length > 0 && (
        <div className="hidden md:grid w-20 shrink-0 grid-rows-4 gap-1.5 sm:gap-2 lg:w-24">
           {quickShortcutsRight.map((val, idx) => (
               <Button 
                  key={`R-${idx}`} 
                  variant="secondary" 
                  onClick={() => onQuickAction && onQuickAction(val)}
                  className="h-full min-h-0 px-1 py-1 text-sm font-black bg-gray-900/80 border-gray-800 text-orange-500 hover:text-white hover:bg-orange-900 hover:border-orange-500/50 shadow-lg transition-all sm:text-base lg:text-xl"
               >
                  {val}
               </Button>
           ))}
        </div>
      )}

    </div>
  );
};
