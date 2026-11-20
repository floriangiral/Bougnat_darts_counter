import React from 'react';
import { CricketTarget } from '../../types';
import { BULL_LABELS, MULTIPLIER_TONES, type KeypadMultiplier } from './multiplierStyles';
import { GameActionButton, KeypadActionRow, KeypadGrid, KeypadKey, KeypadPanel } from './controls';

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

// Touches et rangée d'actions communes (components/game/controls) : Annuler à gauche, 3 MISS (fin du tour) à droite.
export const CricketKeypad: React.FC<CricketKeypadProps> = ({ onHit, onMiss, onTripleMiss, onUndo, canUndo }) => {
    return (
        <KeypadPanel
            className="cricket-keypad overflow-hidden border-t border-border-subtle bg-surface-glass shadow-up backdrop-blur-md"
            data-testid="cricket-keypad"
        >
            <div className="cricket-keypad-body grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] gap-1.5 sm:gap-2">
                <div className="cricket-keypad-panels grid min-h-0 grid-cols-3 gap-1.5 sm:gap-2">
                    {PANELS.map(({ multiplier, title, titleClassName, keyPrefix }) => (
                        <div key={title} className={panelClassName}>
                            <div className={`${headerClassName} ${titleClassName}`}>{title}</div>
                            <KeypadGrid columns={2} rows={3} label={title}>
                                {CRICKET_NUMBERS.map((n) => (
                                    <KeypadKey
                                        key={`${keyPrefix}${n}`}
                                        tone={MULTIPLIER_TONES[multiplier]}
                                        multiplier={multiplier}
                                        keyId={`${keyPrefix}${n}`}
                                        onClick={() => onHit(n, multiplier)}
                                        className="cricket-key"
                                    >
                                        {n}
                                    </KeypadKey>
                                ))}
                            </KeypadGrid>
                        </div>
                    ))}
                </div>

                <KeypadActionRow
                    className="cricket-keypad-actions"
                    data-testid="cricket-keypad-actions"
                    undo={(
                        <GameActionButton
                            action="undo"
                            onClick={onUndo}
                            disabled={!canUndo}
                            title="Annuler la dernière fléchette"
                            className="cricket-action-key cricket-undo-action"
                        />
                    )}
                    validate={<GameActionButton action="miss" label="3 MISS" title="Trois fléchettes hors cible" onClick={onTripleMiss} className="cricket-action-key" />}
                >
                    <KeypadKey tone="bull" multiplier={1} keyId="bull" size="label" onClick={() => onHit(25, 1)} className="cricket-action-key">
                        {BULL_LABELS[1]}
                    </KeypadKey>
                    <KeypadKey tone="dbull" multiplier={2} keyId="dbull" size="label" onClick={() => onHit(25, 2)} className="cricket-action-key">
                        {BULL_LABELS[2]}
                    </KeypadKey>
                    <GameActionButton action="miss" onClick={onMiss} className="cricket-action-key" />
                </KeypadActionRow>
            </div>
        </KeypadPanel>
    );
};
