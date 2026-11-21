
import React from 'react';
import { CricketPlayerState, CricketTarget } from '../../types';
import { FitText } from '../ui/FitText';
import { CRICKET_TARGETS } from '../../utils/cricketLogic';

interface CricketScoreboardProps {
    players: CricketPlayerState[];
    currentPlayerId: string;
    displayedRound?: number;
    currentPlayerTurnDartsThrown?: number;
    startingCompetitorId?: string | null;
    memberNamesByCompetitor?: Record<string, string[]>;
    currentThrowerName?: string;
    isDoubles?: boolean;
    roundsLimit?: number;
}

type MarkState = 'open' | 'closed' | 'dead';

// Les colonnes se lisent dans des variables CSS : en stack, joueurs puis cibles à droite (rendu historique) ;
// en arène et en paysage téléphone, cricket.css place la colonne des cibles au centre (spec 072 FR-03).
const ROW_COLUMNS =
    'grid-cols-[repeat(var(--cricket-players),minmax(0,1fr))_2.125rem] md:grid-cols-[repeat(var(--cricket-players),minmax(0,1fr))_2.375rem]';

const getMarkState = (count: number, isClosedByAll: boolean): MarkState => {
    if (isClosedByAll) return 'dead';
    return count >= 3 ? 'closed' : 'open';
};

const MARK_STATE_CLASSES: Record<MarkState, string> = {
    open: 'text-fg',
    closed: 'text-game-closed-fg',
    dead: 'text-game-dead',
};

// Marques dessinées en SVG avec le même trait : « / » (1 marque), « X » (2 marques) et X cerclé (cible
// fermée, indice de forme ⊗, spec 066 FR-04). Le « / » est une branche de la croix : les trois états ont la
// même géométrie et la croix est exactement au centre du cercle, quelle que soit la police (des lettres
// « / » et « X » se décentraient sur PC et n'avaient pas la même forme que la croix cerclée).
const SLASH_PATH = 'M16.5 7.5l-9 9';
const CROSS_PATH = `M7.5 7.5l9 9${SLASH_PATH}`;
const MARK_CLASSES = { 1: 'cricket-mark-slash', 2: 'cricket-mark-cross', 3: 'cricket-mark-closed' } as const;

const MarkGlyph = ({ marks }: { marks: 1 | 2 | 3 }) => (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`${MARK_CLASSES[marks]} h-[1em] w-[1em]`} fill="none" stroke="currentColor" strokeLinecap="round">
        {marks === 3 && <circle className="cricket-mark-ring" cx="12" cy="12" r="10.6" strokeWidth="1.8" />}
        <path d={marks === 1 ? SLASH_PATH : CROSS_PATH} strokeWidth="3.2" />
    </svg>
);

const renderMark = (count: number, state: MarkState) => {
    let content: React.ReactNode = <span className="opacity-0">.</span>;
    if (count === 1) content = <MarkGlyph marks={1} />;
    else if (count === 2) content = <MarkGlyph marks={2} />;
    else if (count >= 3) content = <MarkGlyph marks={3} />;

    return (
        <div className={`cricket-mark flex h-full w-full items-center justify-center text-xl font-black leading-none transition-colors duration-300 sm:text-2xl md:text-3xl ${MARK_STATE_CLASSES[state]}`}>
            {content}
        </div>
    );
};

const getTargetLabel = (target: CricketTarget) => (target === 25 ? 'B' : target);

export const CricketScoreboard: React.FC<CricketScoreboardProps> = ({
    players,
    currentPlayerId,
    displayedRound,
    currentPlayerTurnDartsThrown = 0,
    startingCompetitorId = null,
    memberNamesByCompetitor = {},
    currentThrowerName,
    isDoubles = false,
    roundsLimit = 20,
}) => {
    // Colonne des cibles au centre seulement en duel (J1 | cibles | J2) ; à 3 joueurs et plus, elle suit
    // tous les joueurs comme sur téléphone et bureau (jamais entre le 2e et le 3e).
    const isCenteredDuel = players.length === 2;
    const leftCount = isCenteredDuel ? 1 : players.length;
    const rightCount = players.length - leftCount;
    const boardStyle = {
        '--cricket-players': Math.max(players.length, 1),
        '--cricket-left': Math.max(leftCount, 1),
        '--cricket-right': Math.max(rightCount, 1),
    } as React.CSSProperties;
    const getSide = (index: number) => (index < leftCount ? 'left' : 'right');
    const currentPlayer = players.find((player) => player.id === currentPlayerId) ?? players[0];
    const currentRound = displayedRound ?? (currentPlayer ? Math.min(Math.floor(currentPlayer.dartsThrown / 3) + 1, roundsLimit) : 1);

    return (
        <div
            className="cricket-board flex h-full w-full flex-1 flex-col overflow-hidden rounded-[1.5rem] border border-border-subtle bg-surface-glass p-1.5 shadow-panel backdrop-blur-md"
            data-testid="cricket-scoreboard"
            data-split={rightCount > 0 ? 'center' : 'none'}
            data-player-count={players.length}
            style={boardStyle}
        >
            <div className="cricket-board-progress-area mb-1 rounded-xl border border-border-subtle bg-surface-tint px-2 py-1 sm:rounded-none sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
                <div className="text-center text-[10px] font-black uppercase leading-none tracking-[0.14em] text-fg-soft sm:hidden">
                    TOUR {currentRound}/{roundsLimit}
                </div>
                <div className="cricket-board-progress mt-3 hidden grid-cols-[repeat(var(--cricket-players),minmax(0,1fr))] gap-2 sm:grid">
                    {players.map((player, index) => {
                        const isCurrent = player.id === currentPlayerId;
                        const dartsInCurrentRound = isCurrent ? currentPlayerTurnDartsThrown : player.dartsThrown % 3;
                        const roundNumber = Math.min(Math.floor((player.dartsThrown - dartsInCurrentRound) / 3) + 1, roundsLimit);
                        const progressPercent = Math.min((((roundNumber - 1) + dartsInCurrentRound / 3) / roundsLimit) * 100, 100);

                        return (
                            <div
                                key={`${player.id}-round-progress`}
                                data-side={getSide(index)}
                                className={`rounded-xl border px-2 py-1.5 ${isCurrent ? 'border-brand-border bg-brand-subtle' : 'border-border-subtle bg-surface-inset'}`}
                            >
                                <div className="flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-[0.14em]">
                                    <span className={isCurrent ? 'text-brand-fg-faint' : 'text-fg-subtle'}>Tour {roundNumber}/{roundsLimit}</span>
                                    <span className={isCurrent ? 'text-fg' : 'text-fg-faint'}>{dartsInCurrentRound}/3</span>
                                </div>
                                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-tint-strong">
                                    <div
                                        className={`h-full rounded-full transition-all duration-300 ${isCurrent ? 'bg-gradient-to-r from-brand to-brand-2' : 'bg-surface-strong'}`}
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                    <div className="cricket-board-spacer hidden" aria-hidden="true" />
                </div>
            </div>

            {/* Noms et points */}
            <div className={`cricket-board-row cricket-board-head mb-1 grid min-h-[32px] shrink-0 gap-1 md:min-h-[34px] ${ROW_COLUMNS}`}>
                {players.map((p, index) => {
                    const isCurrent = p.id === currentPlayerId;
                    return (
                        <div
                            key={p.id}
                            data-side={getSide(index)}
                            data-state={isCurrent ? 'active' : 'idle'}
                            aria-current={isCurrent ? 'true' : undefined}
                            className={`cricket-player-head flex min-h-[32px] w-full min-w-0 flex-col items-center justify-center self-stretch rounded-xl border px-1 py-1 transition-all md:min-h-[34px] ${
                                isCurrent ? 'border-game-active bg-brand-subtle' : 'border-border-subtle bg-surface-inset'
                            }`}
                        >
                            <div className={`cricket-player-name relative w-full px-5 text-[10px] font-bold uppercase leading-tight sm:px-6 sm:text-[11px] md:text-xs ${isCurrent ? 'text-brand-fg-soft' : 'text-fg-subtle'}`}>
                                {isCurrent && (
                                    <span aria-hidden="true" className="cricket-active-marker absolute left-0 top-1/2 -translate-y-1/2 text-[0.8em] text-game-active">▶</span>
                                )}
                                <FitText className="text-center" title={p.name}>{p.name}</FitText>
                                {startingCompetitorId === p.id && (
                                    <span
                                        title="A commencé la partie"
                                        className={`cricket-starter-badge absolute right-0 top-1/2 inline-flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full border text-[8px] font-black uppercase tracking-[0.12em] sm:h-5 sm:w-5 sm:text-[9px] ${
                                            isCurrent
                                                ? 'border-brand-border bg-brand text-on-brand'
                                                : 'border-brand-border bg-brand-subtle text-brand-fg-faint'
                                        }`}
                                    >
                                        D
                                    </span>
                                )}
                            </div>
                            {isDoubles && memberNamesByCompetitor[p.id] && (
                                <FitText as="div" className={`cricket-player-members mt-0.5 w-full text-center text-[8px] font-bold uppercase tracking-[0.08em] sm:text-[9px] ${isCurrent ? 'text-fg' : 'text-fg-faint'}`}>
                                    {isCurrent && currentThrowerName ? currentThrowerName : memberNamesByCompetitor[p.id].join(' / ')}
                                </FitText>
                            )}
                            <div
                                data-testid={`cricket-score-${p.id}`}
                                className={`cricket-player-score mt-0.5 font-mono text-sm font-black leading-none sm:text-base md:text-lg ${isCurrent ? 'text-game-score' : 'text-game-score-inactive'}`}
                            >
                                {p.score}
                            </div>
                        </div>
                    );
                })}
                <div className="cricket-target-cell rounded-xl border border-border-subtle bg-surface-raised" aria-hidden="true" />
            </div>

            {/* Les 7 cibles (15-20, Bull) */}
            <div className="cricket-board-rows flex min-h-0 flex-1 flex-col justify-evenly">
                {CRICKET_TARGETS.map((target) => {
                    const isClosedByAll = players.length > 0 && players.every((p) => p.marks[target] >= 3);

                    return (
                        <div
                            key={target}
                            data-target={target}
                            className={`cricket-board-row cricket-target-row mb-1 grid min-h-[32px] flex-1 gap-1 last:mb-0 md:min-h-[34px] ${ROW_COLUMNS}`}
                        >
                            {players.map((p, index) => {
                                const state = getMarkState(p.marks[target], isClosedByAll);
                                return (
                                    <div
                                        key={p.id}
                                        data-side={getSide(index)}
                                        data-state={state}
                                        data-marks={p.marks[target]}
                                        data-active={p.id === currentPlayerId ? 'true' : undefined}
                                        className={`cricket-mark-cell flex items-center justify-center rounded-xl border ${p.id === currentPlayerId ? 'border-brand-border bg-surface-glass' : 'border-transparent bg-surface-inset'}`}
                                    >
                                        {renderMark(p.marks[target], state)}
                                    </div>
                                );
                            })}

                            <div
                                className="cricket-target-cell flex items-center justify-center rounded-xl border border-border-subtle bg-surface-raised"
                                data-state={isClosedByAll ? 'dead' : 'open'}
                            >
                                <span className={`cricket-target-label text-base font-black sm:text-lg md:text-xl ${isClosedByAll ? 'text-game-dead line-through decoration-2' : 'text-brand-fg-soft'}`}>
                                    {getTargetLabel(target)}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
