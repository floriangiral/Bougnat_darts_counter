import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Heart, LogOut, Skull, Target } from 'lucide-react';
import type { GameConfig, KillerMatchSummary, Player } from '../types';
import { Button } from '../components/ui/Button';
import { formatDuration, getOrderedPlayersAndStarter } from '../src/application/scoring/matchLifecycle';
import {
  KILLER_TARGETS,
  assignKillerTarget,
  createKillerState,
  formatKillerTarget,
  recordKillerDart,
  type KillerState,
  type KillerTarget,
} from '../src/domain/killer/killer';

interface KillerGameViewProps {
  players: Player[];
  config: GameConfig;
  onExit: () => void;
  onFinish: (summary: KillerMatchSummary) => void;
}

const cloneKillerState = (state: KillerState): KillerState => ({
  ...state,
  players: state.players.map((player) => ({ ...player })),
  log: [...state.log],
});

export const KillerGameView: React.FC<KillerGameViewProps> = ({ players, config, onExit, onFinish }) => {
  const initialRotation = useMemo(() => getOrderedPlayersAndStarter(players, config), [players, config]);
  const [state, setState] = useState<KillerState>(() =>
    createKillerState(initialRotation.orderedPlayers, initialRotation.startingPlayerIndex)
  );
  const [history, setHistory] = useState<KillerState[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [hasReportedFinish, setHasReportedFinish] = useState(false);

  const currentPlayer = state.players[state.currentPlayerIndex] ?? state.players[0];
  const assignedTargets = new Set(state.players.map((player) => player.target).filter((target): target is KillerTarget => target !== null));
  const winner = state.players.find((player) => player.id === state.winnerId) ?? null;
  const remainingDarts = Math.max(0, 3 - state.dartsInTurn);

  useEffect(() => {
    if (state.phase === 'FINISHED') return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [state.phase]);

  useEffect(() => {
    if (state.phase !== 'FINISHED' || hasReportedFinish) return;
    setHasReportedFinish(true);
    onFinish({
      players: state.players,
      winnerId: state.winnerId,
      duration: elapsedSeconds,
    });
  }, [elapsedSeconds, hasReportedFinish, onFinish, state]);

  const updateState = (nextState: KillerState) => {
    setHistory((previous) => [cloneKillerState(state), ...previous].slice(0, 20));
    setState(nextState);
  };

  const handleAssignTarget = (target: KillerTarget) => {
    if (!currentPlayer) return;
    updateState(assignKillerTarget(state, currentPlayer.id, target));
  };

  const handleDoubleHit = (targetPlayerId: string) => {
    updateState(recordKillerDart(state, { type: 'DOUBLE_HIT', targetPlayerId }));
  };

  const handleMiss = () => {
    updateState(recordKillerDart(state, { type: 'MISS' }));
  };

  const handlePassTurn = () => {
    let nextState = state;
    for (let dart = remainingDarts; dart > 0; dart -= 1) {
      nextState = recordKillerDart(nextState, { type: 'MISS' });
    }
    updateState(nextState);
  };

  const handleUndo = () => {
    const previousState = history[0];
    if (!previousState) return;
    setState(previousState);
    setHistory((previous) => previous.slice(1));
  };

  if (winner) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#06080d] px-4 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.18),transparent_25%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_20%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.04),transparent_30%)]" />
        <div className="relative z-10 w-full max-w-2xl text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-orange-500/30 bg-orange-500/10">
            <Skull className="h-10 w-10 text-orange-400" />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-400">Dernier survivant</p>
          <h1 className="mt-3 text-5xl font-black uppercase text-white sm:text-7xl">{winner.name}</h1>
          <p className="mt-4 text-sm font-bold uppercase tracking-[0.2em] text-gray-400">{formatDuration(elapsedSeconds)}</p>
          <div className="mt-10">
            <Button onClick={onExit} variant="primary">Retour aux jeux</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] overflow-hidden bg-[#06080d] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.18),transparent_25%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_20%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.04),transparent_30%)]" />
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:30px_30px]" />

      <div className="relative z-10 mx-auto flex h-[100dvh] min-h-0 w-full max-w-7xl flex-col px-2 py-2 sm:px-6 sm:py-5">
        <header className="mb-1 flex shrink-0 flex-wrap items-center justify-between gap-1 sm:mb-5 sm:gap-3">
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-gray-300 hover:border-red-400/40 hover:text-white sm:px-4 sm:text-xs sm:tracking-[0.2em]"
          >
            <LogOut className="h-4 w-4" />
            Quitter
          </button>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-gray-400 sm:gap-3 sm:text-xs sm:tracking-[0.22em]">
            <span>{formatDuration(elapsedSeconds)}</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Killer</span>
          </div>
        </header>

        <main className="grid min-h-0 flex-1 grid-rows-[minmax(0,0.9fr)_minmax(0,1.15fr)] gap-2 sm:gap-3 lg:grid-cols-[1.1fr_0.9fr] lg:grid-rows-1 lg:gap-5">
          <section className="order-2 flex min-h-0 flex-col rounded-2xl border border-white/10 bg-white/[0.045] p-2 shadow-[0_20px_55px_rgba(0,0,0,0.28)] sm:rounded-[1.5rem] sm:p-5 lg:order-1">
            <div className="mb-2 flex shrink-0 items-start justify-between gap-2 sm:mb-5 sm:gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300 sm:text-xs sm:tracking-[0.28em]">
                  {state.phase === 'ASSIGN_TARGETS' ? 'Phase 1' : 'Phase 2'}
                </p>
                <h1 className="mt-0.5 text-[clamp(1.3rem,6vw,1.9rem)] font-black uppercase leading-none text-white sm:mt-2 sm:text-5xl">
                  {state.phase === 'ASSIGN_TARGETS' ? 'Attribuer les numeros' : `${currentPlayer.name} joue`}
                </h1>
              </div>
              {state.phase === 'PLAYING' && (
                <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-right sm:rounded-2xl sm:px-4 sm:py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Fleches</p>
                  <p className="text-2xl font-black text-white sm:text-3xl">{remainingDarts}</p>
                </div>
              )}
            </div>

            <div className="mb-2 shrink-0 rounded-xl border border-white/10 bg-black/25 p-2.5 sm:mb-5 sm:rounded-2xl sm:p-4">
              {state.phase === 'ASSIGN_TARGETS' ? (
                <>
                  <p className="text-lg font-black text-white sm:text-lg">{currentPlayer.name}</p>
                  <p className="mt-1 text-xs font-semibold text-gray-300 sm:text-sm">Main faible. Choisis le numero touche.</p>
                </>
              ) : (
                <>
                  <p className="text-base font-black text-white sm:text-lg">
                    {currentPlayer.isKiller ? 'Vise un double adverse.' : 'Vise ton propre double.'}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-gray-300 sm:text-sm">
                    {currentPlayer.isKiller ? 'Attention : ton propre double te retire une vie.' : 'Ton double te donne le rang Killer.'}
                  </p>
                </>
              )}
            </div>

            {state.phase === 'ASSIGN_TARGETS' ? (
              <div className="grid min-h-0 flex-1 grid-cols-7 content-stretch gap-1.5 sm:gap-2">
                {KILLER_TARGETS.map((target) => {
                  const disabled = assignedTargets.has(target);
                  return (
                    <button
                      key={target}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleAssignTarget(target)}
                      className={`min-h-[clamp(2.6rem,7dvh,3.5rem)] rounded-xl border px-1 py-2 text-sm font-black transition-all sm:min-h-11 sm:rounded-2xl sm:py-3 sm:text-sm ${
                        disabled
                          ? 'cursor-not-allowed border-white/5 bg-white/[0.03] text-gray-600'
                          : 'border-white/10 bg-white/[0.06] text-white hover:border-orange-500/40 hover:bg-orange-500/[0.08]'
                      }`}
                    >
                      {formatKillerTarget(target)}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="min-h-0 flex-1 space-y-2 sm:space-y-4">
                <div className="grid grid-cols-2 gap-1 sm:gap-2">
                  {state.players.filter((player) => !player.isEliminated).map((player) => (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => handleDoubleHit(player.id)}
                      className={`min-h-14 rounded-xl border p-2 text-left transition-all sm:min-h-24 sm:rounded-2xl sm:p-4 ${
                        player.id === currentPlayer.id
                          ? 'border-amber-300/40 bg-amber-500/10'
                          : 'border-white/10 bg-white/[0.05] hover:border-red-300/40 hover:bg-red-500/10'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate text-sm font-black text-white sm:text-lg">{player.name}</span>
                        <span className="shrink-0 rounded-full border border-white/10 bg-black/25 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-gray-300 sm:px-3 sm:py-1 sm:text-xs sm:tracking-[0.18em]">
                          D{formatKillerTarget(player.target)}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] font-bold text-gray-400 sm:mt-2 sm:text-sm">
                        {player.id === currentPlayer.id ? 'Double personnel' : 'Double adverse'}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-1 sm:gap-2">
                  <Button onClick={handleMiss} variant="secondary" size="sm">Rate</Button>
                  <Button onClick={handlePassTurn} variant="secondary" size="sm">Passer</Button>
                  <Button onClick={handleUndo} variant="secondary" size="sm" disabled={history.length === 0}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </section>

          <aside className="order-1 flex min-h-0 lg:order-2">
            <section className="flex min-h-0 w-full flex-col rounded-2xl border border-white/10 bg-white/[0.045] p-2 sm:rounded-[1.5rem] sm:p-5">
              <div className="mb-2 flex shrink-0 items-center gap-2 sm:mb-4">
                <Target className="h-4 w-4 text-orange-400 sm:h-5 sm:w-5" />
                <h2 className="text-xs font-black uppercase tracking-[0.18em] text-white sm:text-sm sm:tracking-[0.22em]">Tableau</h2>
              </div>
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/10 sm:rounded-2xl">
                <div className="grid shrink-0 grid-cols-[1.25fr_0.6fr_0.45fr_0.8fr] bg-white/[0.06] px-2 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-gray-400 sm:grid-cols-[1.2fr_0.7fr_0.7fr_0.8fr] sm:px-3 sm:py-2 sm:text-[10px] sm:tracking-[0.18em]">
                  <span>Joueur</span>
                  <span>Numero</span>
                  <span>Rang</span>
                  <span>Vies</span>
                </div>
                <div className="grid min-h-0 flex-1" style={{ gridTemplateRows: `repeat(${state.players.length}, minmax(0, 1fr))` }}>
                  {state.players.map((player) => (
                    <div
                      key={player.id}
                      className={`grid min-h-9 grid-cols-[1.25fr_0.6fr_0.45fr_0.8fr] items-center border-t border-white/10 px-2 text-[15px] sm:grid-cols-[1.2fr_0.7fr_0.7fr_0.8fr] sm:px-3 sm:text-base ${
                        player.isEliminated ? 'text-red-300/70 line-through' : 'text-white'
                      }`}
                    >
                      <span className="truncate pr-1 font-black">{player.name}</span>
                      <span className="font-black">{formatKillerTarget(player.target)}</span>
                      <span className="font-black text-red-300">{player.isKiller ? 'K' : '-'}</span>
                      <span className="flex gap-1 sm:gap-1">
                        {Array.from({ length: 3 }, (_, index) => (
                          <Heart
                            key={index}
                            className={`h-4 w-4 sm:h-4 sm:w-4 ${index < player.lives ? 'fill-orange-400 text-orange-400' : 'text-white/15'}`}
                          />
                        ))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </aside>
        </main>
      </div>
    </div>
  );
};
