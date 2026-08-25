import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Calculator, Crosshair, LogOut, Trophy } from 'lucide-react';
import type { GameConfig, GotchaMatchSummary, Player } from '../types';
import { Button } from '../components/ui/Button';
import { formatDuration, getOrderedPlayersAndStarter } from '../src/application/scoring/matchLifecycle';
import {
  GOTCHA_MAX_VISIT_SCORE,
  createGotchaState,
  recordGotchaTurn,
  type GotchaState,
} from '../src/domain/gotcha/gotcha';

interface GotchaGameViewProps {
  players: Player[];
  config: GameConfig;
  onExit: () => void;
  onFinish: (summary: GotchaMatchSummary) => void;
}

const cloneGotchaState = (state: GotchaState): GotchaState => ({
  ...state,
  players: state.players.map((player) => ({
    ...player,
    history: player.history.map((turn) => ({ ...turn, gotchaVictimIds: [...turn.gotchaVictimIds] })),
  })),
  log: [...state.log],
});

export const GotchaGameView: React.FC<GotchaGameViewProps> = ({ players, config, onExit, onFinish }) => {
  const initialRotation = useMemo(() => getOrderedPlayersAndStarter(players, config), [players, config]);
  const targetScore = config.startingScore > 0 ? config.startingScore : 301;
  const [state, setState] = useState<GotchaState>(() =>
    createGotchaState(initialRotation.orderedPlayers, targetScore, initialRotation.startingPlayerIndex)
  );
  const [history, setHistory] = useState<GotchaState[]>([]);
  const [input, setInput] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [hasReportedFinish, setHasReportedFinish] = useState(false);

  const currentPlayer = state.players[state.currentPlayerIndex] ?? state.players[0];
  const winner = state.players.find((player) => player.id === state.winnerId) ?? null;
  const inputValue = parseInt(input || '0', 10);
  const projectedScore = currentPlayer ? currentPlayer.score + inputValue : 0;
  const remainingToTarget = currentPlayer ? Math.max(0, state.targetScore - currentPlayer.score) : state.targetScore;
  const wouldBust = input.length > 0 && projectedScore > state.targetScore;
  const wouldWin = input.length > 0 && projectedScore === state.targetScore;
  const gotchaTargets = input.length > 0 && projectedScore > 0
    ? state.players.filter((player) => player.id !== currentPlayer?.id && player.score === projectedScore)
    : [];

  useEffect(() => {
    if (state.winnerId) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [state.winnerId]);

  useEffect(() => {
    if (!winner || hasReportedFinish) return;
    setHasReportedFinish(true);
    onFinish({
      players: state.players,
      winnerId: winner.id,
      targetScore: state.targetScore,
      duration: elapsedSeconds,
    });
  }, [elapsedSeconds, hasReportedFinish, onFinish, state.players, state.targetScore, winner]);

  const updateState = (nextState: GotchaState) => {
    setHistory((previous) => [cloneGotchaState(state), ...previous].slice(0, 30));
    setState(nextState);
    setInput('');
  };

  const handleDigit = (digit: string) => {
    setInput((current) => {
      const nextValue = `${current}${digit}`.replace(/^0+(?=\d)/, '').slice(0, 3);
      const parsed = parseInt(nextValue || '0', 10);
      return parsed > GOTCHA_MAX_VISIT_SCORE ? current : nextValue;
    });
  };

  const handleSubmit = () => {
    const points = parseInt(input || '0', 10);
    updateState(recordGotchaTurn(state, points));
  };

  const handleUndo = () => {
    const previous = history[0];
    if (!previous) return;
    setState(previous);
    setHistory((items) => items.slice(1));
    setInput('');
  };

  if (winner) {
    return (
      <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[#06080d] px-4 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.18),transparent_25%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_20%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.04),transparent_30%)]" />
        <div className="relative z-10 w-full max-w-2xl text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-orange-500/30 bg-orange-500/10">
            <Trophy className="h-10 w-10 text-orange-400" />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-400">Score exact</p>
          <h1 className="mt-3 text-5xl font-black uppercase text-white sm:text-7xl">{winner.name}</h1>
          <p className="mt-4 text-sm font-bold uppercase tracking-[0.2em] text-gray-400">
            {state.targetScore} points · {formatDuration(elapsedSeconds)}
          </p>
          <div className="mt-10">
            <Button onClick={onExit} variant="primary">Retour aux jeux</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] overflow-y-auto bg-[#06080d] text-white xl:h-[100dvh] xl:overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.18),transparent_25%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_20%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.04),transparent_30%)]" />
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:30px_30px]" />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-7xl flex-col px-2 py-2 sm:px-6 sm:py-5 xl:h-[100dvh] xl:min-h-0">
        <header className="mb-1 flex shrink-0 flex-wrap items-center justify-between gap-1 sm:mb-5 sm:gap-2">
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-gray-300 hover:border-red-400/40 hover:text-white sm:px-4 sm:text-xs"
          >
            <LogOut className="h-4 w-4" />
            Quitter
          </button>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-gray-400 sm:text-xs">
            <span>{formatDuration(elapsedSeconds)}</span>
            <span className="rounded-full border border-orange-500/25 bg-orange-500/[0.06] px-3 py-1 text-orange-300">
              Cible {state.targetScore}
            </span>
          </div>
        </header>

        <main className="grid flex-1 grid-rows-[minmax(16rem,auto)_minmax(24rem,auto)] gap-2 sm:gap-3 xl:min-h-0 xl:grid-cols-[0.95fr_1.05fr] xl:grid-rows-1 xl:gap-5">
          <section className="order-1 flex min-h-0 flex-col rounded-2xl border border-white/10 bg-white/[0.045] p-2 sm:rounded-[1.5rem] sm:p-5">
            <div className="mb-2 flex shrink-0 items-center gap-2 sm:mb-4">
              <Crosshair className="h-4 w-4 text-orange-400 sm:h-5 sm:w-5" />
              <h2 className="text-xs font-black uppercase tracking-[0.18em] text-white sm:text-sm">Tableau</h2>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/10">
              <div className="grid shrink-0 grid-cols-[1.15fr_0.7fr_0.7fr] bg-white/[0.06] px-2 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-gray-400 sm:px-3 sm:py-2 sm:text-[10px]">
                <span>Joueur</span>
                <span>Score</span>
                <span>Reste</span>
              </div>
              <div className="grid min-h-0 flex-1" style={{ gridTemplateRows: `repeat(${state.players.length}, minmax(0, 1fr))` }}>
                {state.players.map((player, index) => {
                  const isCurrent = player.id === currentPlayer?.id;
                  return (
                    <div
                      key={player.id}
                      className={`grid min-h-9 grid-cols-[1.15fr_0.7fr_0.7fr] items-center border-t border-white/10 px-2 text-[15px] sm:px-3 sm:text-base ${
                        isCurrent ? 'bg-orange-500/[0.08] text-white' : 'text-gray-200'
                      }`}
                    >
                      <span className="truncate pr-1 font-black">
                        {index + 1}. {player.name}
                      </span>
                      <span className="font-black text-orange-300">{player.score}</span>
                      <span className="font-black text-orange-200">{state.targetScore - player.score}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="order-2 flex flex-col rounded-2xl border border-white/10 bg-white/[0.045] p-2 shadow-[0_20px_55px_rgba(0,0,0,0.28)] sm:rounded-[1.5rem] sm:p-5 xl:min-h-0 xl:overflow-hidden">
            <div className="mb-2 flex shrink-0 items-start justify-between gap-2 sm:mb-5 sm:gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300 sm:text-xs">
                  Tour {state.turnNumber}
                </p>
                <h1 className="mt-1 truncate text-2xl font-black uppercase leading-tight text-white sm:text-5xl">
                  {currentPlayer?.name}
                </h1>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-right sm:rounded-2xl sm:px-4 sm:py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Reste</p>
                <p className="text-2xl font-black text-white sm:text-3xl">{remainingToTarget}</p>
              </div>
            </div>

            <div className={`mb-2 shrink-0 rounded-xl border p-2 sm:mb-5 sm:rounded-2xl sm:p-4 ${
              wouldWin
                ? 'border-orange-500/40 bg-orange-500/[0.08]'
                : wouldBust
                  ? 'border-red-300/35 bg-red-500/12'
                  : gotchaTargets.length > 0
                    ? 'border-orange-300/35 bg-orange-500/12'
                    : 'border-white/10 bg-black/25'
            }`}>
              <div className="flex items-center justify-between gap-2 sm:gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">Visite</p>
                  <p className="mt-1 text-4xl font-black text-white sm:text-5xl">{input || '0'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">Apres tour</p>
                  <p className={`mt-1 text-3xl font-black sm:text-4xl ${wouldBust ? 'text-red-300' : 'text-orange-300'}`}>
                    {wouldBust ? currentPlayer?.score : projectedScore}
                  </p>
                </div>
              </div>
              <p className="mt-1 min-h-5 text-sm font-bold text-gray-300 sm:mt-3">
                {wouldWin
                  ? 'Score exact : victoire.'
                  : wouldBust
                    ? 'Bust : ton score restera identique.'
                    : gotchaTargets.length > 0
                      ? `Gotcha possible sur ${gotchaTargets.map((player) => player.name).join(', ')}.`
                      : 'Saisis le total de tes 3 flechettes.'}
              </p>
            </div>

            <div className="grid grid-cols-3 grid-rows-4 gap-1.5 sm:gap-2 xl:min-h-0 xl:flex-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigit(digit)}
                  className="h-full min-h-0 rounded-xl border border-white/10 bg-white/[0.06] text-2xl font-black text-white transition hover:border-orange-500/40 hover:bg-orange-500/[0.08] sm:min-h-14"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setInput('')}
                className="h-full min-h-0 rounded-xl border border-red-800 bg-red-900/50 text-xs font-black uppercase tracking-[0.14em] text-red-200 transition hover:bg-red-800 sm:min-h-14"
              >
                C
              </button>
              <button
                type="button"
                onClick={() => handleDigit('0')}
                className="h-full min-h-0 rounded-xl border border-white/10 bg-white/[0.06] text-2xl font-black text-white transition hover:border-orange-500/40 hover:bg-orange-500/[0.08] sm:min-h-14"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleUndo}
                disabled={history.length === 0}
                className="inline-flex h-full min-h-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-xs font-black uppercase tracking-[0.14em] text-gray-300 transition hover:text-white disabled:opacity-40 sm:min-h-14"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Retour
              </button>
            </div>

            <div className="mt-2 shrink-0 sm:mt-3">
              <Button onClick={handleSubmit} className="h-11 w-full rounded-xl text-xs sm:h-14 sm:rounded-2xl sm:text-sm">
                <Calculator className="mr-2 h-5 w-5" />
                Valider
              </Button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};
