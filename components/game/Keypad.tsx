import React from 'react';
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
  voiceControl?: React.ReactNode;
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
  onQuickAction,
  voiceControl,
}) => {
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
          data-testid="x01-keypad-1"
          className="h-full min-h-0 px-1 py-1 text-lg font-bold bg-gray-800 border-gray-700 shadow-inner transition-transform active:scale-95 hover:bg-gray-700 sm:text-2xl md:text-3xl"
        >
          1
        </Button>
        <Button
          variant="secondary"
          onClick={() => onInput(2)}
          data-testid="x01-keypad-2"
          className="h-full min-h-0 px-1 py-1 text-lg font-bold bg-gray-800 border-gray-700 shadow-inner transition-transform active:scale-95 hover:bg-gray-700 sm:text-2xl md:text-3xl"
        >
          2
        </Button>
        <Button
          variant="secondary"
          onClick={() => onInput(3)}
          data-testid="x01-keypad-3"
          className="h-full min-h-0 px-1 py-1 text-lg font-bold bg-gray-800 border-gray-700 shadow-inner transition-transform active:scale-95 hover:bg-gray-700 sm:text-2xl md:text-3xl"
        >
          3
        </Button>
        <Button
          variant="secondary"
          onClick={onRemaining}
          data-testid="x01-keypad-remaining"
          className="h-full min-h-0 !border-cyan-500/45 !bg-cyan-950/60 px-1 py-1 text-xs font-black !text-cyan-200 shadow-inner hover:!border-cyan-400/70 hover:!bg-cyan-900/70 hover:!text-white sm:text-sm md:text-base"
          title="Indiquer le score restant"
        >
          RESTE
        </Button>
        <Button
          variant="secondary"
          onClick={() => onInput(4)}
          data-testid="x01-keypad-4"
          className="h-full min-h-0 px-1 py-1 text-lg font-bold bg-gray-800 border-gray-700 shadow-inner transition-transform active:scale-95 hover:bg-gray-700 sm:text-2xl md:text-3xl"
        >
          4
        </Button>
        <Button
          variant="secondary"
          onClick={() => onInput(5)}
          data-testid="x01-keypad-5"
          className="h-full min-h-0 px-1 py-1 text-lg font-bold bg-gray-800 border-gray-700 shadow-inner transition-transform active:scale-95 hover:bg-gray-700 sm:text-2xl md:text-3xl"
        >
          5
        </Button>
        <Button
          variant="secondary"
          onClick={() => onInput(6)}
          data-testid="x01-keypad-6"
          className="h-full min-h-0 px-1 py-1 text-lg font-bold bg-gray-800 border-gray-700 shadow-inner transition-transform active:scale-95 hover:bg-gray-700 sm:text-2xl md:text-3xl"
        >
          6
        </Button>
        {voiceControl ?? <div className="row-span-2" />}
        <Button
          variant="secondary"
          onClick={() => onInput(7)}
          data-testid="x01-keypad-7"
          className="h-full min-h-0 px-1 py-1 text-lg font-bold bg-gray-800 border-gray-700 shadow-inner transition-transform active:scale-95 hover:bg-gray-700 sm:text-2xl md:text-3xl"
        >
          7
        </Button>
        <Button
          variant="secondary"
          onClick={() => onInput(8)}
          data-testid="x01-keypad-8"
          className="h-full min-h-0 px-1 py-1 text-lg font-bold bg-gray-800 border-gray-700 shadow-inner transition-transform active:scale-95 hover:bg-gray-700 sm:text-2xl md:text-3xl"
        >
          8
        </Button>
        <Button
          variant="secondary"
          onClick={() => onInput(9)}
          data-testid="x01-keypad-9"
          className="h-full min-h-0 px-1 py-1 text-lg font-bold bg-gray-800 border-gray-700 shadow-inner transition-transform active:scale-95 hover:bg-gray-700 sm:text-2xl md:text-3xl"
        >
          9
        </Button>
        <Button variant="danger" onClick={onClear} data-testid="x01-keypad-clear" className="h-full min-h-0 px-1 py-1 text-sm font-bold shadow-sm sm:text-lg md:text-xl">C</Button>
        <Button
          variant="secondary"
          onClick={() => onInput(0)}
          data-testid="x01-keypad-0"
          className="h-full min-h-0 px-1 py-1 text-lg font-bold bg-gray-800 border-gray-700 shadow-inner transition-transform active:scale-95 hover:bg-gray-700 sm:text-2xl md:text-3xl"
        >
          0
        </Button>
        <Button onClick={onEnter} data-testid="x01-keypad-ok" className="col-span-2 h-full min-h-0 px-1 py-1 text-lg font-black shadow-lg shadow-orange-900/30 sm:text-2xl md:text-3xl">OK</Button>
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
