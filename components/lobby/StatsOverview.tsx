import React from 'react';
import type { PlayerStats } from '../../src/types/lobby';

interface StatsOverviewProps {
  stats: PlayerStats;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  const items = [
    { label: 'Global Average', value: stats.globalAverage.toFixed(1) },
    { label: 'Best Average', value: stats.bestAverage.toFixed(1) },
    { label: '180s', value: `${stats.total180s}` },
    { label: 'Best Checkout', value: `${stats.bestCheckout}` },
    { label: 'Global Winrate', value: `${stats.globalWinRate}%` },
  ];

  return (
    <section className="rounded-[2rem] border border-white/10 bg-[#101722]/86 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-6">
      <div className="mb-5">
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-300">Statistics</p>
        <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-white">Performance Snapshot</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {items.map((item) => (
          <div key={item.label} className="rounded-[1.4rem] border border-white/8 bg-black/20 px-4 py-4">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{item.label}</div>
            <div className="mt-3 text-2xl font-black text-white">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-[1.5rem] border border-white/8 bg-black/20 p-4">
        <div className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Winrate By Mode</div>
        <div className="grid gap-3 sm:grid-cols-5">
          {Object.entries(stats.winsByMode).map(([mode, winRate]) => (
            <div key={mode} className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 text-center">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">{mode}</div>
              <div className="mt-2 text-lg font-black text-orange-300">{winRate}%</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
