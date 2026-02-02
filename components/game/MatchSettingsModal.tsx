
import React, { useState } from 'react';
import { Button } from '../ui/Button';

interface MatchSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcutsLeft: number[];
  shortcutsRight: number[];
  onUpdateShortcuts: (side: 'left' | 'right', newValues: number[]) => void;
  showHints: boolean;
  onToggleHints: () => void;
}

export const MatchSettingsModal: React.FC<MatchSettingsModalProps> = ({
  isOpen,
  onClose,
  shortcutsLeft,
  shortcutsRight,
  onUpdateShortcuts,
  showHints,
  onToggleHints
}) => {
  if (!isOpen) return null;

  // Helper to update a specific index in the array
  const handleInputChange = (side: 'left' | 'right', index: number, valStr: string) => {
    const val = parseInt(valStr);
    if (isNaN(val)) return;
    
    const newArr = side === 'left' ? [...shortcutsLeft] : [...shortcutsRight];
    newArr[index] = Math.min(180, Math.max(0, val)); // Clamp 0-180
    onUpdateShortcuts(side, newArr);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gray-950 p-4 border-b border-gray-800 flex justify-between items-center">
            <h3 className="text-lg font-black italic text-white uppercase tracking-wider">Options du Match</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-2xl leading-none">×</button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
            
            {/* Toggles */}
            <section>
                <h4 className="text-orange-500 text-xs font-bold uppercase tracking-widest mb-3">Affichage & Aides</h4>
                <div className="bg-gray-800/50 p-3 rounded-lg flex items-center justify-between border border-gray-700">
                    <span className="text-sm font-bold text-gray-300">Aides à la sortie (Checkout Hints)</span>
                    <button 
                        onClick={onToggleHints}
                        className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${showHints ? 'bg-cyan-600' : 'bg-gray-600'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${showHints ? 'left-7' : 'left-1'}`}></div>
                    </button>
                </div>
            </section>

            {/* Shortcuts Config */}
            <section>
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-cyan-500 text-xs font-bold uppercase tracking-widest">Raccourcis Clavier (Desktop)</h4>
                    <span className="text-[9px] bg-gray-800 text-gray-500 px-2 py-0.5 rounded border border-gray-700">Masqué sur mobile</span>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div>
                        <div className="text-[10px] text-gray-500 font-mono text-center mb-2 uppercase">Gauche</div>
                        <div className="space-y-2">
                            {shortcutsLeft.map((val, idx) => (
                                <div key={`L-${idx}`} className="flex items-center bg-gray-800 rounded border border-gray-700 px-2">
                                    <span className="text-gray-500 text-xs font-mono mr-2">#{idx+1}</span>
                                    <input 
                                        type="number" 
                                        value={val}
                                        onChange={(e) => handleInputChange('left', idx, e.target.value)}
                                        className="w-full bg-transparent text-white font-bold py-2 focus:outline-none text-center"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column */}
                    <div>
                        <div className="text-[10px] text-gray-500 font-mono text-center mb-2 uppercase">Droite</div>
                        <div className="space-y-2">
                            {shortcutsRight.map((val, idx) => (
                                <div key={`R-${idx}`} className="flex items-center bg-gray-800 rounded border border-gray-700 px-2">
                                    <span className="text-gray-500 text-xs font-mono mr-2">#{idx+1}</span>
                                    <input 
                                        type="number" 
                                        value={val}
                                        onChange={(e) => handleInputChange('right', idx, e.target.value)}
                                        className="w-full bg-transparent text-white font-bold py-2 focus:outline-none text-center"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <p className="text-[10px] text-gray-600 mt-3 italic text-center">
                    Ces boutons s'affichent uniquement sur les écrans larges.
                </p>
            </section>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-950">
            <Button onClick={onClose} className="w-full">Valider</Button>
        </div>
      </div>
    </div>
  );
};
