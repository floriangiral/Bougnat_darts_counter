import React from 'react';
import { Button } from '../ui/Button';

interface KeypadProps {
  onInput: (val: number) => void;
  onClear: () => void;
  onEnter: () => void;
  currentInput: string;
  isCheckoutPossible: boolean;
  // Voice Props
  onMicClick?: () => void;
  isListening?: boolean;
  isLoadingModel?: boolean;
  hasVoiceSupport?: boolean;
  isModelMissing?: boolean;
  // Quick Actions (New)
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
  onMicClick,
  isListening,
  isLoadingModel,
  hasVoiceSupport,
  isModelMissing,
  quickShortcutsLeft = [],
  quickShortcutsRight = [],
  onQuickAction
}) => {
  const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className="h-full flex gap-2">
      
      {/* LEFT SHORTCUTS (Hidden on Mobile) - THEME CYAN (20s) */}
      {quickShortcutsLeft.length > 0 && (
        <div className="hidden md:flex flex-col gap-2 w-24 shrink-0">
           {quickShortcutsLeft.map((val, idx) => (
               <Button 
                  key={`L-${idx}`} 
                  variant="secondary" 
                  onClick={() => onQuickAction && onQuickAction(val)}
                  className="flex-1 text-xl font-black bg-gray-900/80 border-gray-800 text-cyan-500 hover:text-white hover:bg-cyan-900 hover:border-cyan-500/50 shadow-lg transition-all"
               >
                  {val}
               </Button>
           ))}
        </div>
      )}

      {/* CENTER NUMPAD */}
      <div className="flex-1 flex flex-col gap-2">
          <div className="flex-1 grid grid-cols-3 gap-2">
              {keys.map((k) => (
                <Button 
                  key={k} 
                  variant="secondary" 
                  onClick={() => onInput(k)}
                  className="text-2xl font-bold bg-gray-800 hover:bg-gray-700 border-gray-700 h-full shadow-inner active:scale-95 transition-transform"
                >
                  {k}
                </Button>
              ))}
          </div>
          <div className="h-1/4 grid grid-cols-3 gap-2">
              {/* Slot 1: Clear */}
              <Button variant="danger" onClick={onClear} className="h-full text-lg font-bold shadow-sm">C</Button>
              
              {/* Slot 2: Zero */}
              <Button variant="secondary" onClick={() => onInput(0)} className="h-full text-2xl font-bold bg-gray-800 border-gray-700 shadow-inner">0</Button>
              
              {/* Slot 3: Voice */}
              {hasVoiceSupport ? (
                  <button 
                      onClick={onMicClick}
                      disabled={isLoadingModel || isListening || isModelMissing}
                      className={`
                        relative h-full w-full rounded flex items-center justify-center transition-all duration-300 overflow-hidden border
                        ${isModelMissing 
                            ? 'bg-gray-900 border-gray-800 opacity-50 cursor-not-allowed' // Grisé si absent
                            : isLoadingModel 
                                ? 'bg-gray-800 border-cyan-500/30 cursor-wait' 
                                : isListening
                                    ? 'bg-cyan-500 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.6)] scale-[0.98]'
                                    : 'bg-gradient-to-br from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 border-transparent shadow-lg shadow-cyan-900/50'
                        }
                      `}
                  >
                      {/* Background Glow Effect for listening */}
                      {isListening && !isModelMissing && (
                          <div className="absolute inset-0 bg-cyan-400 animate-pulse opacity-50"></div>
                      )}

                      <div className="relative z-10 text-white">
                          {isModelMissing ? (
                              // Disabled / Missing Icon
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7 text-gray-600">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                          ) : isLoadingModel ? (
                              <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : isListening ? (
                              // Waveform Icon
                              <div className="flex items-center gap-1 h-4">
                                  <div className="w-1 bg-white rounded-full animate-[music_1s_ease-in-out_infinite] h-2"></div>
                                  <div className="w-1 bg-white rounded-full animate-[music_1s_ease-in-out_infinite_0.1s] h-4"></div>
                                  <div className="w-1 bg-white rounded-full animate-[music_1s_ease-in-out_infinite_0.2s] h-2"></div>
                              </div>
                          ) : (
                              // Mic Icon
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7 drop-shadow-md">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                              </svg>
                          )}
                      </div>
                  </button>
              ) : (
                  <div className="bg-transparent"></div>
              )}
          </div>
      </div>

      {/* RIGHT SHORTCUTS (Hidden on Mobile) - THEME ORANGE (19s) */}
      {quickShortcutsRight.length > 0 && (
        <div className="hidden md:flex flex-col gap-2 w-24 shrink-0">
           {quickShortcutsRight.map((val, idx) => (
               <Button 
                  key={`R-${idx}`} 
                  variant="secondary" 
                  onClick={() => onQuickAction && onQuickAction(val)}
                  className="flex-1 text-xl font-black bg-gray-900/80 border-gray-800 text-orange-500 hover:text-white hover:bg-orange-900 hover:border-orange-500/50 shadow-lg transition-all"
               >
                  {val}
               </Button>
           ))}
        </div>
      )}

    </div>
  );
};