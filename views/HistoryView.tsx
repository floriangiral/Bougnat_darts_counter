import React, { useEffect, useState } from 'react';
import { AppPageBackground } from '../components/ui/AppPageBackground';
import { Button } from '../components/ui/Button';
import { MenuUserBadge } from '../components/ui/MenuUserBadge';
import { fetchUserMatches } from '../lib/supabase';
interface HistoryViewProps {
  user: any;
  onBack: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

interface MatchRecord {
  id: string;
  created_at: string;
  game_type: string;
  winner_id: string;
  game_name?: string;
  player_names?: string[];
  opponent_label?: string;
  is_win?: boolean;
  starting_score?: number;
  check_out?: string;
  match_mode?: string;
  score_for?: number;
  score_against?: number;
  game_data: any;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ user, onBack, onOpenProfile, onLogout }) => {
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (user?.id) {
        const data = await fetchUserMatches(user.id);
        setMatches(data as MatchRecord[]);
      }
      setIsLoading(false);
    };

    loadData();
  }, [user]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getResultBadge = (match: MatchRecord) => {
    const isWin = !!match.is_win;

    return (
      <span
        className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${
          isWin
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
            : 'border-red-500/30 bg-red-500/10 text-red-300'
        }`}
      >
        {isWin ? 'Victoire' : 'Defaite'}
      </span>
    );
  };

  return (
    <AppPageBackground contentClassName="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <Button variant="ghost" onClick={onBack} size="sm">
              ← Retour
            </Button>
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-orange-200">
                Historique Des Matchs
              </div>
              <div>
                <h1 className="text-3xl font-black uppercase tracking-[-0.05em] text-white sm:text-4xl">
                  Tes Sessions Recentes
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-gray-400 sm:text-base">
                  Revois tes derniers resultats, formats et schemas de finish avant de revenir au board.
                </p>
              </div>
            </div>
          </div>
          <MenuUserBadge user={user} onClick={onOpenProfile} onLogout={onLogout} />
        </div>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-orange-500" />
          </div>
        ) : matches.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-[#0d131d]/88 p-10 text-center shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-3xl">
                📜
              </div>
              <h2 className="text-2xl font-black uppercase tracking-[-0.04em] text-white">Aucun match enregistre pour le moment</h2>
              <p className="mt-3 text-sm text-gray-400">
                Lance une partie et ton historique recent apparaitra ici automatiquement.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <aside className="rounded-[2rem] border border-white/10 bg-[#0d131d]/88 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              <div className="text-[11px] font-black uppercase tracking-[0.28em] text-gray-500">Resume Historique</div>
              <div className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                <SummaryTile label="Matchs Enregistres" value={String(matches.length)} hint="Sur l'ensemble de tes sessions sauvegardees" />
                <SummaryTile
                  label="Dernier Mode"
                  value={matches[0]?.game_name || matches[0]?.game_data?.gameName || matches[0]?.game_type || 'X01'}
                  hint="Format joue le plus recemment"
                />
                <SummaryTile label="Derniere Session" value={formatDate(matches[0].created_at)} hint="Partie la plus recente enregistree" />
              </div>
            </aside>

            <section className="space-y-4 pb-8">
              {matches.map((match) => {
                const p1Name = match.player_names?.[0] || match.game_data?.players?.[0]?.name || 'Player';
                const p2Name = match.opponent_label || match.player_names?.slice(1).join(' / ') || 'Opponent';
                const scoreFor = match.score_for ?? '-';
                const scoreAgainst = match.score_against ?? '-';
                const gameLabel = match.game_name || match.game_data?.gameName || match.game_type;

                return (
                  <article
                    key={match.id}
                    className="rounded-[1.75rem] border border-white/10 bg-[#0d131d]/88 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)] transition-all hover:border-orange-400/20 hover:bg-[#111826]"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-orange-200">
                            {gameLabel}
                          </span>
                          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">
                            {formatDate(match.created_at)}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-2xl font-black uppercase tracking-[-0.04em] text-white">
                            {p1Name} <span className="text-gray-500">vs</span> {p2Name}
                          </h3>
                          <p className="mt-2 text-sm text-gray-400">
                            {match.starting_score ? `${match.starting_score} · ` : ''}
                            {match.check_out ? `${match.check_out} Out · ` : ''}
                            {match.match_mode || match.game_type}
                          </p>
                        </div>
                      </div>
                      {getResultBadge(match)}
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-[0.85fr_1.15fr]">
                      <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Score Final</div>
                        <div className="mt-3 text-4xl font-black tracking-[-0.05em] text-white">
                          {String(scoreFor)} <span className="text-gray-500">-</span> {String(scoreAgainst)}
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <DetailTile label="Resultat" value={match.is_win ? p1Name : p2Name} />
                        <DetailTile label="Format" value={match.match_mode || match.game_type} />
                        <DetailTile label="Score De Depart" value={match.starting_score ? String(match.starting_score) : '-'} />
                        <DetailTile label="Checkout" value={match.check_out ? `${match.check_out} Out` : '-'} />
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          </div>
        )}
    </AppPageBackground>
  );
};

const SummaryTile = ({ label, value, hint }: { label: string; value: string; hint: string }) => (
  <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">{label}</div>
    <div className="mt-3 text-2xl font-black tracking-[-0.04em] text-white">{value}</div>
    <div className="mt-2 text-sm text-gray-400">{hint}</div>
  </div>
);

const DetailTile = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">{label}</div>
    <div className="mt-2 text-sm font-bold uppercase tracking-[0.12em] text-white">{value}</div>
  </div>
);
