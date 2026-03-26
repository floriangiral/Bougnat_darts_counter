
import React from 'react';
import { Button } from '../ui/Button';
import { CricketTarget } from '../../types';

interface CricketKeypadProps {
    onHit: (target: CricketTarget, multiplier: 1 | 2 | 3) => void;
    onMiss: () => void;
    onUndo: () => void;
    canUndo: boolean;
}

export const CricketKeypad: React.FC<CricketKeypadProps> = ({ onHit, onMiss, onUndo, canUndo }) => {
    return (
        <div className="flex h-full min-h-0 flex-col gap-1.5 overflow-hidden border-t border-white/8 bg-[#0b1019]/95 p-2 shadow-[0_-12px_40px_rgba(0,0,0,0.42)] backdrop-blur-md sm:gap-2 sm:p-2.5">
             <div className="grid min-h-0 flex-1 grid-cols-3 gap-1.5 sm:gap-2">
                {/* Double Strip */}
                <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-1">
                     <div className="flex min-h-0 items-center justify-center rounded-xl border border-white/6 bg-slate-950/90 px-1 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-cyan-400 sm:text-[10px]">Doubles</div>
                     <div className="grid min-h-0 grid-cols-3 grid-rows-2 gap-1">
                        {[20,19,18,17,16,15].map(n => (
                            <button key={`d${n}`} onClick={() => onHit(n as CricketTarget, 2)} className="h-full min-h-0 rounded-xl border border-cyan-500/18 bg-slate-800 px-1 py-1 text-[11px] font-bold text-cyan-300 transition-colors hover:border-cyan-400/35 hover:bg-cyan-900/25 sm:text-sm">{n}</button>
                        ))}
                     </div>
                     <Button
                        variant="danger"
                        onClick={onMiss}
                        className="min-h-[34px] rounded-xl px-2 py-1 text-[11px] font-black sm:min-h-[40px] sm:text-sm"
                     >
                        Miss
                     </Button>
                </div>

                {/* Triple Strip */}
                <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-1">
                     <div className="flex min-h-0 items-center justify-center rounded-xl border border-white/6 bg-slate-950/90 px-1 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-orange-400 sm:text-[10px]">Triples</div>
                     <div className="grid min-h-0 grid-cols-3 grid-rows-2 gap-1">
                        {[20,19,18,17,16,15].map(n => (
                            <button key={`t${n}`} onClick={() => onHit(n as CricketTarget, 3)} className="h-full min-h-0 rounded-xl border border-orange-500/18 bg-slate-800 px-1 py-1 text-[11px] font-bold text-orange-300 transition-colors hover:border-orange-400/35 hover:bg-orange-900/25 sm:text-sm">{n}</button>
                        ))}
                     </div>
                     <Button
                        variant="secondary"
                        onClick={onUndo}
                        disabled={!canUndo}
                        className="min-h-[34px] rounded-xl px-2 py-1 text-[11px] font-black text-gray-300 sm:min-h-[40px] sm:text-sm"
                     >
                        Undo
                     </Button>
                </div>

                 {/* Singles reminder / quick lane */}
                 <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-1">
                    <div className="flex min-h-0 items-center justify-center rounded-xl border border-white/6 bg-slate-950/90 px-1 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white/70 sm:text-[10px]">Simples</div>
                    <div className="grid min-h-0 grid-cols-2 grid-rows-3 gap-1">
                        {[20, 19, 18, 17, 16, 15].map(n => (
                            <button key={`s${n}`} onClick={() => onHit(n as CricketTarget, 1)} className="h-full min-h-0 rounded-xl border border-white/10 bg-slate-800 px-1 py-1 text-xs font-bold text-white transition-colors hover:border-white/20 hover:bg-slate-700 sm:text-sm">
                                {n}
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                        <Button
                            onClick={() => onHit(25, 1)}
                            className="min-h-[34px] rounded-xl border border-orange-500/30 bg-gradient-to-r from-orange-600 to-red-600 px-2 py-1 text-[11px] font-black text-white shadow-[0_10px_24px_rgba(234,88,12,0.28)] sm:min-h-[40px] sm:text-sm"
                        >
                            Bull
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => onHit(25, 2)}
                            className="min-h-[34px] rounded-xl border border-red-400/40 bg-gradient-to-r from-red-600 to-rose-600 px-2 py-1 text-[10px] font-black text-white shadow-[0_10px_24px_rgba(220,38,38,0.24)] sm:min-h-[40px] sm:text-xs"
                        >
                            D-Bull
                        </Button>
                    </div>
                 </div>
            </div>
        </div>
    );
};
