import React, { useMemo, useState } from 'react';
import { DoorOpen, PlusCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { MenuUserBadge } from '../components/ui/MenuUserBadge';
import { createOpenLobby } from '../lib/supabase';
import type { InOutRule, MatchMode } from '../types';
import type { LobbyGameMode } from '../src/types/lobby';

interface CreateLobbyViewProps {
  user: any;
  onBack: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  onCreated: (lobbyCode: string) => void;
}

const MODES: LobbyGameMode[] = ['X01', 'Cricket', 'Capital', 'Triathlon', 'Randomizer'];
const SCORE_PRESETS = [170, 301, 501, 701, 1001];

export const CreateLobbyView: React.FC<CreateLobbyViewProps> = ({
  user,
  onBack,
  onOpenProfile,
  onLogout,
  onCreated,
}) => {
  const [mode, setMode] = useState<LobbyGameMode>('X01');
  const [title, setTitle] = useState('Set 501 du Soir');
  const [stakes, setStakes] = useState('BO5 · Double Out');
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [startingScore, setStartingScore] = useState(501);
  const [matchMode, setMatchMode] = useState<MatchMode>('LEGS');
  const [legsToWin, setLegsToWin] = useState(3);
  const [setsToWin, setSetsToWin] = useState(1);
  const [checkIn, setCheckIn] = useState<InOutRule>('Open');
  const [checkOut, setCheckOut] = useState<InOutRule>('Double');
  const [isDoubles, setIsDoubles] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const inferredGameConfig = useMemo(() => {
    if (mode !== 'X01') return {};
    return {
      startingScore,
      matchMode,
      legsToWin,
      setsToWin,
      checkIn,
      checkOut,
      isDoubles,
    };
  }, [mode, startingScore, matchMode, legsToWin, setsToWin, checkIn, checkOut, isDoubles]);

  const handleCreate = async () => {
    setIsSubmitting(true);
    setFeedback(null);

    const { data, error } = await createOpenLobby(user.id, {
      mode,
      title,
      stakes,
      maxPlayers,
      gameConfig: inferredGameConfig,
    });

    if (error || !data) {
      setFeedback({ type: 'error', text: error?.message || 'Impossible de creer le salon.' });
      setIsSubmitting(false);
      return;
    }

    setFeedback({ type: 'success', text: `Salon ${data.lobby_code} cree.` });
    setIsSubmitting(false);
    onCreated(data.lobby_code);
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#06080d] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.18),transparent_25%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_22%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.04),transparent_35%)]" />
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:30px_30px]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <Button variant="ghost" onClick={onBack} size="sm">
              ← Retour
            </Button>
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-orange-200">
                Configuration Hote
              </div>
              <div>
                <h1 className="text-3xl font-black uppercase tracking-[-0.05em] text-white sm:text-4xl">
                  Creer Un Salon
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-gray-400 sm:text-base">
                  Prepare un lobby partage, choisis le mode et publie un code propre pour faire rejoindre les autres joueurs.
                </p>
              </div>
            </div>
          </div>
          <MenuUserBadge user={user} onClick={onOpenProfile} onLogout={onLogout} />
        </div>

        {feedback && (
          <div
            className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${
              feedback.type === 'success'
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                : 'border-red-500/20 bg-red-500/10 text-red-300'
            }`}
          >
            {feedback.text}
          </div>
        )}

        <div className="grid gap-5 xl:grid-cols-[1fr_0.92fr]">
          <section className="space-y-5">
            <div className="rounded-[2rem] border border-white/10 bg-[#101722]/86 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-6">
              <div className="mb-5">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-300">Mode</p>
                <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-white">Quel salon veux-tu ouvrir ?</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {MODES.map((entry) => (
                  <button
                    key={entry}
                    type="button"
                    onClick={() => setMode(entry)}
                    className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                      mode === entry
                        ? 'border-orange-400/30 bg-orange-500/10 text-white'
                        : 'border-white/8 bg-black/20 text-gray-400 hover:border-orange-400/20 hover:text-white'
                    }`}
                  >
                    <div className="text-sm font-black uppercase tracking-[0.14em]">{entry}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#101722]/86 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-6">
              <div className="mb-5">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-300">Presentation</p>
                <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-white">Titre et description</h2>
              </div>
              <div className="space-y-4">
                <div className="rounded-[1.4rem] border border-white/8 bg-black/20 px-4 py-3">
                  <div className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Titre</div>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-transparent text-base font-black text-white outline-none"
                    placeholder="Set 501 du Soir"
                  />
                </div>
                <div className="rounded-[1.4rem] border border-white/8 bg-black/20 px-4 py-3">
                  <div className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Format</div>
                  <input
                    type="text"
                    value={stakes}
                    onChange={(e) => setStakes(e.target.value)}
                    className="w-full bg-transparent text-base font-bold text-white outline-none"
                    placeholder="BO5 · Double Out"
                  />
                </div>
              </div>
            </div>

            {mode === 'X01' && (
              <div className="rounded-[2rem] border border-white/10 bg-[#101722]/86 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-6">
                <div className="mb-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-300">Configuration Du Jeu</p>
                  <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-white">Regles X01</h2>
                </div>

                <div className="space-y-5">
                  <div>
                    <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Starting Score</div>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                      {SCORE_PRESETS.map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => setStartingScore(score)}
                          className={`rounded-xl border py-2 text-sm font-black ${
                            startingScore === score
                              ? 'border-transparent bg-gradient-to-r from-orange-600 to-red-600 text-white'
                              : 'border-white/10 bg-black/20 text-gray-400 hover:border-orange-400/30 hover:text-white'
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Check In</div>
                      <div className="flex flex-wrap gap-2">
                        {(['Open', 'Double', 'Master'] as const).map((rule) => (
                          <button
                            key={rule}
                            type="button"
                            onClick={() => setCheckIn(rule)}
                            className={`rounded-xl border px-4 py-2 text-xs font-black uppercase tracking-[0.18em] ${
                              checkIn === rule
                                ? 'border-transparent bg-gradient-to-r from-orange-600 to-red-600 text-white'
                                : 'border-white/10 bg-black/20 text-gray-400 hover:border-orange-400/30 hover:text-white'
                            }`}
                          >
                            {rule}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Check Out</div>
                      <div className="flex flex-wrap gap-2">
                        {(['Open', 'Double', 'Master'] as const).map((rule) => (
                          <button
                            key={rule}
                            type="button"
                            onClick={() => setCheckOut(rule)}
                            className={`rounded-xl border px-4 py-2 text-xs font-black uppercase tracking-[0.18em] ${
                              checkOut === rule
                                ? 'border-transparent bg-gradient-to-r from-orange-600 to-red-600 text-white'
                                : 'border-white/10 bg-black/20 text-gray-400 hover:border-orange-400/30 hover:text-white'
                            }`}
                          >
                            {rule}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Format</div>
                      <div className="inline-flex rounded-2xl border border-white/10 bg-black/20 p-1">
                        <button
                          type="button"
                          onClick={() => setMatchMode('LEGS')}
                          className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.18em] ${matchMode === 'LEGS' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                        >
                          Legs
                        </button>
                        <button
                          type="button"
                          onClick={() => setMatchMode('SETS')}
                          className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.18em] ${matchMode === 'SETS' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                        >
                          Sets
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Players</div>
                      <div className="inline-flex rounded-2xl border border-white/10 bg-black/20 p-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsDoubles(false);
                            setMaxPlayers(2);
                          }}
                          className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.18em] ${!isDoubles ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                        >
                          1v1
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsDoubles(true);
                            setMaxPlayers(4);
                          }}
                          className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.18em] ${isDoubles ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                        >
                          2v2
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Legs to Win</div>
                      <div className="grid grid-cols-3 gap-2">
                        {[1, 3, 5].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setLegsToWin(value)}
                            className={`rounded-xl border py-2 text-sm font-black ${
                              legsToWin === value
                                ? 'border-transparent bg-gradient-to-r from-orange-600 to-red-600 text-white'
                                : 'border-white/10 bg-black/20 text-gray-400 hover:border-orange-400/30 hover:text-white'
                            }`}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Sets to Win</div>
                      <div className="grid grid-cols-3 gap-2">
                        {[1, 3, 5].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setSetsToWin(value)}
                            className={`rounded-xl border py-2 text-sm font-black ${
                              setsToWin === value
                                ? 'border-transparent bg-gradient-to-r from-orange-600 to-red-600 text-white'
                                : 'border-white/10 bg-black/20 text-gray-400 hover:border-orange-400/30 hover:text-white'
                            }`}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          <aside className="space-y-5">
            <section className="rounded-[2rem] border border-white/10 bg-[#101722]/86 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-6">
              <div className="mb-5">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-300">Lobby Preview</p>
                <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-white">Ce que les joueurs verront</h2>
              </div>

              <div className="space-y-3">
                <div className="rounded-[1.4rem] border border-white/8 bg-black/20 p-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Mode</div>
                  <div className="mt-2 text-lg font-black uppercase tracking-[0.08em] text-white">{mode}</div>
                </div>
                <div className="rounded-[1.4rem] border border-white/8 bg-black/20 p-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Titre</div>
                  <div className="mt-2 text-lg font-black text-white">{title || 'Match Ouvert'}</div>
                </div>
                <div className="rounded-[1.4rem] border border-white/8 bg-black/20 p-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Stakes</div>
                  <div className="mt-2 text-sm text-gray-300">{stakes || 'Match ouvert'}</div>
                </div>
                <div className="rounded-[1.4rem] border border-white/8 bg-black/20 p-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Capacity</div>
                  <div className="mt-2 text-lg font-black uppercase tracking-[0.08em] text-white">1 / {maxPlayers}</div>
                </div>
              </div>

              <Button onClick={handleCreate} disabled={isSubmitting} className="mt-5 h-14 w-full rounded-2xl text-sm shadow-[0_18px_40px_rgba(234,88,12,0.28)]">
                <span className="inline-flex items-center gap-3">
                  <PlusCircle className="h-4 w-4" />
                  <span>{isSubmitting ? 'Creation...' : 'Creer Le Salon'}</span>
                </span>
              </Button>

              <Button variant="secondary" onClick={onBack} className="mt-3 h-14 w-full rounded-2xl text-sm">
                <span className="inline-flex items-center gap-3">
                  <DoorOpen className="h-4 w-4" />
                  <span>Retour Lobby</span>
                </span>
              </Button>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};
