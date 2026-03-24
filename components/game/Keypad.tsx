
import React from 'react';
import { Button } from '../ui/Button';

interface KeypadProps {
  onInput: (val: number) => void;
  onClear: () => void;
  onEnter: () => void;
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
  currentInput, 
  isCheckoutPossible,
  quickShortcutsLeft = [],
  quickShortcutsRight = [],
  onQuickAction
}) => {
  const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9];

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
                  className="h-full min-h-10 text-base font-black bg-gray-900/80 border-gray-800 text-cyan-500 hover:text-white hover:bg-cyan-900 hover:border-cyan-500/50 shadow-lg transition-all sm:min-h-11 md:min-h-12 lg:text-xl"
               >
                  {val}
               </Button>
           ))}
        </div>
      )}

      {/* CENTER NUMPAD */}
      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] gap-1.5 sm:gap-2">
          <div className="grid min-h-0 grid-cols-3 grid-rows-3 gap-1.5 sm:gap-2">
              {keys.map((k) => (
                <Button 
                  key={k} 
                  variant="secondary" 
                  onClick={() => onInput(k)}
                  className="h-full min-h-10 text-lg font-bold bg-gray-800 hover:bg-gray-700 border-gray-700 shadow-inner active:scale-95 transition-transform sm:min-h-11 sm:text-xl md:min-h-12 md:text-2xl"
                >
                  {k}
                </Button>
              ))}
          </div>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              <Button variant="danger" onClick={onClear} className="h-full min-h-10 text-sm font-bold shadow-sm sm:min-h-11 sm:text-base md:min-h-12 md:text-lg">C</Button>
              <Button variant="secondary" onClick={() => onInput(0)} className="h-full min-h-10 text-lg font-bold bg-gray-800 border-gray-700 shadow-inner sm:min-h-11 sm:text-xl md:min-h-12 md:text-2xl">0</Button>
              <Button variant="secondary" onClick={onEnter} className="h-full min-h-10 text-sm font-black bg-gray-800 border-gray-700 shadow-inner sm:min-h-11 sm:text-base md:min-h-12 md:text-lg">OK</Button>
          </div>
      </div>

      {/* RIGHT SHORTCUTS */}
      {quickShortcutsRight.length > 0 && (
        <div className="hidden md:grid w-20 shrink-0 grid-rows-4 gap-1.5 sm:gap-2 lg:w-24">
           {quickShortcutsRight.map((val, idx) => (
               <Button 
                  key={`R-${idx}`} 
                  variant="secondary" 
                  onClick={() => onQuickAction && onQuickAction(val)}
                  className="h-full min-h-10 text-base font-black bg-gray-900/80 border-gray-800 text-orange-500 hover:text-white hover:bg-orange-900 hover:border-orange-500/50 shadow-lg transition-all sm:min-h-11 md:min-h-12 lg:text-xl"
               >
                  {val}
               </Button>
           ))}
        </div>
      )}

    </div>
  );
};
