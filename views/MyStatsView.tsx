import React, { useEffect, useState } from 'react';
import { AppPageBackground } from '../components/ui/AppPageBackground';
import { Button } from '../components/ui/Button';
import { MenuUserBadge } from '../components/ui/MenuUserBadge';
import { fetchUserMatches } from '../lib/supabase';
interface MyStatsViewProps {
  user: any;
  onBack: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

interface AggregatedStats {
  totalMatches: number;
  wins: number;
  losses: number;
  globalAvg: string;
  highestCheckout: number;
  bestLeg: number | null;
  total180s: number;
  total140s: number;
  total100s: number;
}

export const MyStatsView: React.FC<MyStatsViewProps> = ({ user, onBack, onOpenProfile, onLogout }) => {
  const [stats, setStats] = useState<AggregatedStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const processStats = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      const matches = await fetchUserMatches(user.id);

      let totalMatches = 0;
      let wins = 0;
      let losses = 0;
      let grandTotalScore = 0;
      let grandTotalDarts = 0;
      let maxCheckout = 0;
      let globalBestLeg: number | null = null;
      let count180 = 0;
      let count140 = 0;
      let count100 = 0;

      matches.forEach((record: any) => {
        totalMatches++;
        if (record.is_win) wins++;
        else losses++;

        if (typeof record.total_points === 'number') grandTotalScore += record.total_points;
        if (typeof record.total_darts === 'number') grandTotalDarts += record.total_darts;

        if (typeof record.highest_checkout === 'number' && record.highest_checkout > maxCheckout) {
          maxCheckout = record.highest_checkout;
        }

        if (typeof record.best_leg_darts === 'number') {
          if (globalBestLeg === null || record.best_leg_darts < globalBestLeg) {
            globalBestLeg = record.best_leg_darts;
          }
        }

        count180 += record.count_180 || 0;
        count140 += record.count_140_plus || 0;
        count100 += record.count_100_plus || 0;
      });

      const avg = grandTotalDarts > 0 ? ((grandTotalScore / grandTotalDarts) * 3).toFixed(1) : '0.0';

      setStats({
        totalMatches,
        wins,
        losses,
        globalAvg: avg,
        highestCheckout: maxCheckout,
        bestLeg: globalBestLeg,
        total180s: count180,
        total140s: count140,
        total100s: count100,
      });

      setIsLoading(false);
    };

    processStats();
  }, [user]);

  const winRate = stats && stats.totalMatches > 0 ? Math.round((stats.wins / stats.totalMatches) * 100) : 0;

  return (
    <AppPageBackground contentClassName="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <Button variant="ghost" onClick={onBack} size="sm">
              ← Retour
            </Button>
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-orange-200">
                Vue D'Ensemble
              </div>
              <div>
                <h1 className="text-3xl font-black uppercase tracking-[-0.05em] text-white sm:text-4xl">
                  Mes Stats
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-gray-400 sm:text-base">
                  Suis ton rythme de score, ta qualite de finish et tes resultats sur tous les matchs enregistres.
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
        ) : !stats || stats.totalMatches === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-[#0d131d]/88 p-10 text-center shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-3xl">
                📊
              </div>
              <h2 className="text-2xl font-black uppercase tracking-[-0.04em] text-white">Aucune statistique pour le moment</h2>
              <p className="mt-3 text-sm text-gray-400">
                Termine un match et ton profil de score commencera a se construire automatiquement.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 pb-8">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Moyenne Generale" value={stats.globalAvg} accent="orange" large />
              <StatCard label="Taux De Victoire" value={`${winRate}%`} accent="green" large />
              <StatCard label="Matchs Joues" value={String(stats.totalMatches)} accent="white" />
              <StatCard label="Victoires" value={String(stats.wins)} accent="orange" />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[2rem] border border-white/10 bg-[#0d131d]/88 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
                <div className="mb-5 text-[11px] font-black uppercase tracking-[0.28em] text-gray-500">Meilleur Finish</div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <HighlightCard label="Plus Haut Checkout" value={String(stats.highestCheckout)} suffix="" />
                  <HighlightCard label="Meilleure Manche" value={stats.bestLeg ? String(stats.bestLeg) : '-'} suffix="flechettes" />
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-[#0d131d]/88 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
                <div className="mb-5 text-[11px] font-black uppercase tracking-[0.28em] text-gray-500">Repartition</div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <MiniMetric label="Victoires" value={String(stats.wins)} tone="emerald" />
                  <MiniMetric label="Defaites" value={String(stats.losses)} tone="slate" />
                </div>
                <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-orange-500 via-red-500 to-orange-400" style={{ width: `${winRate}%` }} />
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-[#0d131d]/88 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.28em] text-gray-500">Carte Des Scores</div>
                  <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-white">Grosses Volees</h2>
                </div>
                <p className="text-sm text-gray-400">Une vue rapide de tes grosses productions de score.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <HeatCard label="180s" value={String(stats.total180s)} accent="from-red-500 to-orange-500" />
                <HeatCard label="140+" value={String(stats.total140s)} accent="from-orange-500 to-amber-400" />
                <HeatCard label="100+" value={String(stats.total100s)} accent="from-slate-100 to-slate-400" darkText />
              </div>
            </section>
          </div>
        )}
    </AppPageBackground>
  );
};

const StatCard = ({
  label,
  value,
  accent,
  large = false,
}: {
  label: string;
  value: string;
  accent: 'orange' | 'green' | 'white';
  large?: boolean;
}) => {
  const colorMap = {
    orange: 'text-orange-300',
    green: 'text-emerald-300',
    white: 'text-white',
  };

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-[#0d131d]/88 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
      <div className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">{label}</div>
      <div className={`mt-3 font-black tracking-[-0.05em] ${large ? 'text-4xl' : 'text-3xl'} ${colorMap[accent]}`}>{value}</div>
    </div>
  );
};

const HighlightCard = ({ label, value, suffix }: { label: string; value: string; suffix: string }) => (
  <div className="rounded-[1.5rem] border border-white/8 bg-black/20 p-5 text-center">
    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">{label}</div>
    <div className="mt-3 text-5xl font-black tracking-[-0.05em] text-white">{value}</div>
    <div className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-gray-400">{suffix || 'points'}</div>
  </div>
);

const MiniMetric = ({ label, value, tone }: { label: string; value: string; tone: 'emerald' | 'slate' }) => (
  <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">{label}</div>
    <div className={`mt-2 text-2xl font-black ${tone === 'emerald' ? 'text-emerald-300' : 'text-white'}`}>{value}</div>
  </div>
);

const HeatCard = ({
  label,
  value,
  accent,
  darkText = false,
}: {
  label: string;
  value: string;
  accent: string;
  darkText?: boolean;
}) => (
  <div className={`rounded-[1.5rem] border border-white/8 bg-gradient-to-br ${accent} p-[1px]`}>
    <div className="rounded-[1.45rem] bg-[#0d131d] p-5 text-center">
      <div className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">{label}</div>
      <div className={`mt-3 text-5xl font-black tracking-[-0.05em] ${darkText ? 'text-slate-100' : 'text-white'}`}>{value}</div>
    </div>
  </div>
);
