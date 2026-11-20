import React from 'react';
import { CricketTarget } from '../../types';
import type { KeypadTone } from '../ui/Button';
import {
    BULL_LABELS,
    getKeyDataAttributes,
    getKeypadKeyClass,
    MULTIPLIER_TONES,
    type KeypadMultiplier,
} from './multiplierStyles';

interface CricketKeypadProps {
    onHit: (target: CricketTarget, multiplier: 1 | 2 | 3) => void;
    onMiss: () => void;
    onTripleMiss: () => void;
    onUndo: () => void;
    canUndo: boolean;
}

const CRICKET_NUMBERS: CricketTarget[] = [20, 19, 18, 17, 16, 15];

const PANELS: Array<{ multiplier: KeypadMultiplier; title: string; titleClassName: string; keyPrefix: string }> = [
    { multiplier: 1, title: 'Simples', titleClassName: 'text-fg-muted', keyPrefix: 's' },
    { multiplier: 2, title: 'Doubles', titleClassName: 'text-game-double-fg', keyPrefix: 'd' },
    { multiplier: 3, title: 'Triples', titleClassName: 'text-game-triple-fg', keyPrefix: 't' },
];

const panelClassName = 'cricket-keypad-panel grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-1.5 sm:gap-2';
const headerClassName =
    'cricket-keypad-panel-title flex min-h-0 items-center justify-center rounded-xl border border-border-subtle bg-surface-glass px-1 py-1 text-[9px] font-bold uppercase tracking-[0.12em] sm:text-[10px]';
const keysGridClassName = 'grid min-h-0 grid-cols-2 grid-rows-3 gap-1.5 sm:gap-2';
const numberKeyClassName = 'cricket-key h-full min-h-0 rounded-xl px-1 py-1 text-sm font-bold';
const actionKeyClassName = 'cricket-action-key h-full min-h-12 rounded-xl px-1 py-1 text-[11px] font-black uppercase sm:text-sm';

const ActionKey: React.FC<{
    tone: KeypadTone;
    multiplier?: KeypadMultiplier;
    onClick: () => void;
    disabled?: boolean;
    className?: string;
    title?: string;
    children: React.ReactNode;
}> = ({ tone, multiplier, onClick, disabled, className = actionKeyClassName, title, children }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={title}
        data-variant="keypad"
        data-tone={tone}
        data-multiplier={multiplier === undefined ? undefined : String(multiplier)}
        className={getKeypadKeyClass(tone, className)}
    >
        {children}
    </button>
);

export const CricketKeypad: React.FC<CricketKeypadProps> = ({ onHit, onMiss, onTripleMiss, onUndo, canUndo }) => {
    return (
        <div
            className="cricket-keypad flex h-full min-h-0 flex-col gap-1.5 overflow-hidden border-t border-border-subtle bg-surface-glass p-2 shadow-up backdrop-blur-md sm:gap-2 sm:p-2.5"
            data-testid="cricket-keypad"
        >
            <div className="cricket-keypad-body grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] gap-1.5 sm:gap-2">
                <div className="cricket-keypad-panels grid min-h-0 grid-cols-3 gap-1.5 sm:gap-2">
                    {PANELS.map(({ multiplier, title, titleClassName, keyPrefix }) => (
                        <div key={title} className={panelClassName}>
                            <div className={`${headerClassName} ${titleClassName}`}>{title}</div>
                            <div className={keysGridClassName}>
                                {CRICKET_NUMBERS.map((n) => (
                                    <button
                                        key={`${keyPrefix}${n}`}
                                        type="button"
                                        onClick={() => onHit(n, multiplier)}
                                        {...getKeyDataAttributes(MULTIPLIER_TONES[multiplier], multiplier)}
                                        className={getKeypadKeyClass(MULTIPLIER_TONES[multiplier], numberKeyClassName)}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="cricket-keypad-actions grid grid-cols-6 gap-1.5 sm:gap-2" data-testid="cricket-keypad-actions">
                    <div className="col-span-3 grid grid-cols-2 gap-1.5 sm:gap-2">
                        <ActionKey tone="bull" multiplier={1} onClick={() => onHit(25, 1)}>
                            {BULL_LABELS[1]}
                        </ActionKey>
                        <ActionKey tone="dbull" multiplier={2} onClick={() => onHit(25, 2)}>
                            {BULL_LABELS[2]}
                        </ActionKey>
                    </div>
                    <ActionKey tone="danger" onClick={onTripleMiss}>
                        3 MISS
                    </ActionKey>
                    <ActionKey tone="danger" onClick={onMiss}>
                        MISS
                    </ActionKey>
                    <ActionKey
                        tone="danger"
                        onClick={onUndo}
                        disabled={!canUndo}
                        title="Annuler la dernière fléchette"
                        className="cricket-action-key cricket-undo-key h-full min-h-12 rounded-xl px-1 py-1 text-sm font-bold sm:text-lg md:text-xl"
                    >
                        C
                    </ActionKey>
                </div>
            </div>
        </div>
    );
};
