import React from 'react';
import { Button } from '../ui/Button';
import { CricketTarget } from '../../types';

interface CricketKeypadProps {
    onHit: (target: CricketTarget, multiplier: 1 | 2 | 3) => void;
    onMiss: () => void;
    onTripleMiss: () => void;
    onUndo: () => void;
    canUndo: boolean;
}

const CRICKET_NUMBERS: CricketTarget[] = [20, 19, 18, 17, 16, 15];
const panelClassName = 'grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-1.5 sm:gap-2';
const headerClassName =
    'flex min-h-0 items-center justify-center rounded-xl border border-white/6 bg-slate-950/90 px-1 py-1 text-[9px] font-bold uppercase tracking-[0.12em] sm:text-[10px]';
const keysGridClassName = 'grid min-h-0 grid-cols-2 grid-rows-3 gap-1.5 sm:gap-2';
const keyClassName =
    'h-full min-h-0 select-none rounded-xl px-1 py-1 text-sm font-bold transition-colors active:scale-[0.98] sm:text-sm [touch-action:manipulation] [-webkit-tap-highlight-color:transparent]';

const releaseButtonFocus = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.blur();
};

export const CricketKeypad: React.FC<CricketKeypadProps> = ({ onHit, onMiss, onTripleMiss, onUndo, canUndo }) => {
    return (
        <div className="flex h-full min-h-0 flex-col gap-1.5 overflow-hidden border-t border-white/8 bg-[#0b1019]/95 p-2 shadow-[0_-12px_40px_rgba(0,0,0,0.42)] backdrop-blur-md sm:gap-2 sm:p-2.5">
            <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] gap-1.5 sm:gap-2">
                <div className="grid min-h-0 grid-cols-3 gap-1.5 sm:gap-2">
                <div className={panelClassName}>
                    <div className={`${headerClassName} text-white/70`}>Simples</div>
                    <div className={keysGridClassName}>
                        {CRICKET_NUMBERS.map((n) => (
                            <button
                                key={`s${n}`}
                                onClick={() => onHit(n, 1)}
                                onPointerUp={releaseButtonFocus}
                                className={`${keyClassName} border border-white/10 bg-slate-800 text-white hover:border-white/20 hover:bg-slate-700 focus:outline-none`}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={panelClassName}>
                    <div className={`${headerClassName} text-cyan-400`}>Doubles</div>
                    <div className={keysGridClassName}>
                        {CRICKET_NUMBERS.map((n) => (
                            <button
                                key={`d${n}`}
                                onClick={() => onHit(n, 2)}
                                onPointerUp={releaseButtonFocus}
                                className={`${keyClassName} border border-cyan-500/18 bg-slate-800 text-cyan-300 hover:border-cyan-400/35 hover:bg-cyan-900/25 focus:outline-none`}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={panelClassName}>
                    <div className={`${headerClassName} text-orange-400`}>Triples</div>
                    <div className={keysGridClassName}>
                        {CRICKET_NUMBERS.map((n) => (
                            <button
                                key={`t${n}`}
                                onClick={() => onHit(n, 3)}
                                onPointerUp={releaseButtonFocus}
                                className={`${keyClassName} border border-orange-500/18 bg-slate-800 text-orange-300 hover:border-orange-400/35 hover:bg-orange-900/25 focus:outline-none`}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                </div>
                </div>

                <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
                    <div className="col-span-3 grid grid-cols-2 gap-1.5 sm:gap-2">
                        <Button
                            onClick={() => onHit(25, 1)}
                            onPointerUp={releaseButtonFocus}
                            className="h-full min-h-0 select-none rounded-xl !border-emerald-300/55 !bg-gradient-to-r !from-emerald-700 !to-green-500 px-1 py-1 text-[11px] font-black !text-white shadow-[0_10px_24px_rgba(34,197,94,0.3)] transition-colors active:scale-[0.98] hover:!from-emerald-600 hover:!to-green-400 sm:text-sm [touch-action:manipulation] [-webkit-tap-highlight-color:transparent]"
                        >
                            BULL
                        </Button>
                        <button
                            onClick={() => onHit(25, 2)}
                            onPointerUp={releaseButtonFocus}
                            className="flex h-full min-h-0 select-none items-center justify-center rounded-xl border border-red-200/60 bg-[#d90416] px-1 py-1 text-[11px] font-black uppercase tracking-wide text-white shadow-[0_10px_24px_rgba(217,4,22,0.36)] transition-all duration-200 active:scale-[0.98] hover:bg-[#f20d20] sm:text-sm [touch-action:manipulation] [-webkit-tap-highlight-color:transparent]"
                            style={{
                                background: '#d90416',
                                borderColor: 'rgba(254, 202, 202, 0.6)',
                                color: '#ffffff',
                            }}
                        >
                            D-BULL
                        </button>
                    </div>
                    <Button
                        variant="danger"
                        onClick={onTripleMiss}
                        onPointerUp={releaseButtonFocus}
                        className="h-full min-h-0 select-none rounded-xl px-1 py-1 text-[11px] font-black active:scale-[0.98] sm:text-sm [touch-action:manipulation] [-webkit-tap-highlight-color:transparent]"
                    >
                        3 MISS
                    </Button>
                    <Button
                        variant="danger"
                        onClick={onMiss}
                        onPointerUp={releaseButtonFocus}
                        className="h-full min-h-0 select-none rounded-xl px-1 py-1 text-[11px] font-black active:scale-[0.98] sm:text-sm [touch-action:manipulation] [-webkit-tap-highlight-color:transparent]"
                    >
                        MISS
                    </Button>
                    <Button
                        variant="danger"
                        onClick={onUndo}
                        onPointerUp={releaseButtonFocus}
                        disabled={!canUndo}
                        className="h-full min-h-0 select-none rounded-xl px-1 py-1 text-sm font-bold shadow-sm active:scale-[0.98] sm:text-lg md:text-xl [touch-action:manipulation] [-webkit-tap-highlight-color:transparent]"
                    >
                        C
                    </Button>
                </div>
            </div>
        </div>
    );
};
