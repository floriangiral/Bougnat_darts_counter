
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
  hasVoiceSupport?: boolean;
  isVoiceEnabled?: boolean; 
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
  onMicClick,
  isListening,
  hasVoiceSupport,
  isVoiceEnabled = true,
  quickShortcutsLeft = [],
  quickShortcutsRight = [],
  onQuickAction
}) => {
  const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  // Le micro n'est désactivé que si pas de support ou option désactivée.
  // On autorise le clic même si 'isListening' pour permettre de couper (Toggle).
  const isMicDisabled = !isVoiceEnabled || !hasVoiceSupport;

  return (
    <div className="h-full flex gap-2">
      
      {/* LEFT SHORTCUTS */}
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
              <Button variant="danger" onClick={onClear} className="h-full text-lg font-bold shadow-sm">C</Button>
              <Button variant="secondary" onClick={() => onInput(0)} className="h-full text-2xl font-bold bg-gray-800 border-gray-700 shadow-inner">0</Button>
              
              {/* Mic Button */}
              <button 
                  onClick={onMicClick}
                  disabled={isMicDisabled}
                  className={`
                    relative h-full w-full rounded flex items-center justify-center transition-all duration-300 overflow-hidden border
                    ${isMicDisabled
                        ? 'bg-gray-900 border-gray-800 opacity-20 cursor-not-allowed' 
                        : isListening
                            ? 'bg-red-500/80 border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.6)] scale-[0.98]' // Red when active to indicate "Stop"
                            : 'bg-gradient-to-br from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 border-transparent shadow-lg shadow-cyan-900/50'
                    }
                  `}
              >
                  {isListening && hasVoiceSupport && isVoiceEnabled && (
                      <div className="absolute inset-0 bg-red-500 animate-pulse opacity-20"></div>
                  )}

                  <div className={`relative z-10 ${isMicDisabled ? 'text-gray-700' : 'text-white'}`}>
                      {isMicDisabled ? (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7 opacity-50">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                          </svg>
                      ) : isListening ? (
                          /* Stop Icon or Animated Waves when listening */
                           <div className="flex flex-col items-center">
                                <div className="flex items-center gap-1 h-3 mb-1">
                                    <div className="w-1 bg-white rounded-full animate-[music_1s_ease-in-out_infinite] h-2"></div>
                                    <div className="w-1 bg-white rounded-full animate-[music_1s_ease-in-out_infinite_0.1s] h-3"></div>
                                    <div className="w-1 bg-white rounded-full animate-[music_1s_ease-in-out_infinite_0.2s] h-2"></div>
                                </div>
                                {/* <span className="text-[8px] font-bold uppercase tracking-widest">STOP</span> */}
                           </div>
                      ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7 drop-shadow-md">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                          </svg>
                      )}
                  </div>
              </button>
          </div>
      </div>

      {/* RIGHT SHORTCUTS */}
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
