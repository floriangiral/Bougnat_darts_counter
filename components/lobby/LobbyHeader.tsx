import React from 'react';
import type { PlayerProfile, PlayerStats } from '../../src/types/lobby';

interface LobbyHeaderProps {
  profile: PlayerProfile;
  stats: PlayerStats;
}

export const LobbyHeader: React.FC<LobbyHeaderProps> = ({ profile, stats }) => {
  const summaryItems = [
    { label: 'Moyenne', value: stats.globalAverage.toFixed(1) },
    { label: 'Checkout', value: `${stats.checkoutRate}%` },
    { label: 'Victoires', value: `${stats.totalWins}` },
    { label: 'Dernier Resultat', value: profile.lastResult === 'win' ? 'Victoire' : 'Defaite' },
  ];

  const progress = Math.min(100, Math.round((profile.xp / profile.xpToNextLevel) * 100));

  return (
    <section className="rounded-[2rem] border border-white/10 bg-[#0b1119]/92 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:p-7">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-gray-300">
            Profil Arena
          </div>

          <div className="flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#070b12] shadow-[0_10px_24px_rgba(0,0,0,0.24)] sm:h-20 sm:w-20">
              <img src={profile.avatarUrl} alt={profile.username} className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-gray-500">{profile.rank}</p>
              <div className="mt-2 flex items-center gap-3">
                <img
                  src={`https://flagcdn.com/w80/${profile.countryCode.toLowerCase()}.png`}
                  alt={profile.countryCode}
                  title={profile.countryCode}
                  className="h-6 w-9 rounded-md object-cover shadow-sm sm:h-7 sm:w-10"
                />
                <h2 className="text-3xl font-black uppercase tracking-[-0.04em] text-white sm:text-4xl">
                  {profile.username}
                </h2>
              </div>
              <p className="mt-2 text-sm text-gray-400 sm:text-base">
                Mode favori : <span className="font-black text-white">{profile.favoriteMode}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {summaryItems.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/8 bg-[#0a1018] px-4 py-3 shadow-[0_10px_24px_rgba(0,0,0,0.16)]">
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">{item.label}</div>
                <div className="mt-2 text-xl font-black text-white">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/8 bg-[#0a1018] p-5 shadow-[0_10px_24px_rgba(0,0,0,0.16)]">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Progression</p>
            <span className="text-sm font-black uppercase text-orange-300">Niveau {profile.level}</span>
          </div>
          <div className="mb-3 h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 via-red-500 to-orange-400"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>{profile.xp} XP</span>
            <span>{profile.xpToNextLevel} XP vers le prochain rang</span>
          </div>
        </div>
      </div>
    </section>
  );
};
