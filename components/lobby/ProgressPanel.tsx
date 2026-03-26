import React from 'react';
import type { Achievement, PlayerProfile, QuickReplaySuggestion } from '../../src/types/lobby';

interface ProgressPanelProps {
  profile: PlayerProfile;
  achievements: Achievement[];
  quickReplay: QuickReplaySuggestion;
  onReplayQuickMode: () => void;
}

export const ProgressPanel: React.FC<ProgressPanelProps> = ({
  profile,
  achievements,
  quickReplay,
  onReplayQuickMode,
}) => {
  return (
    <section className="space-y-4 rounded-[2rem] border border-white/10 bg-[#0b1119]/92 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-6">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-300">Progression</p>
        <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-white">Rank & Momentum</h2>
      </div>

      <div className="rounded-[1.5rem] border border-white/8 bg-[#0a1018] p-4">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Mode Favori</div>
        <div className="mt-2 text-xl font-black text-white">{profile.favoriteMode}</div>
      </div>

      <div className="rounded-[1.5rem] border border-white/8 bg-[#0a1018] p-4">
        <div className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Rejouer Rapidement</div>
        <div className="text-lg font-black text-white">{quickReplay.title}</div>
        <p className="mt-2 text-sm leading-6 text-gray-400">{quickReplay.description}</p>
        <button
          onClick={onReplayQuickMode}
          className="mt-4 rounded-full border border-orange-400/30 bg-orange-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-orange-300 transition-all hover:bg-orange-500/15"
        >
          {quickReplay.cta}
        </button>
      </div>

      <div className="rounded-[1.5rem] border border-white/8 bg-[#0a1018] p-4">
        <div className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Badges & Achievements</div>
        <div className="space-y-3">
          {achievements.map((achievement) => {
            const progress = Math.min(100, Math.round((achievement.progress / achievement.maxProgress) * 100));
            return (
              <div key={achievement.id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-white">{achievement.title}</div>
                    <div className="mt-1 text-sm text-gray-400">{achievement.description}</div>
                  </div>
                  <div className={`text-[10px] font-black uppercase tracking-[0.16em] ${achievement.unlocked ? 'text-green-300' : 'text-gray-500'}`}>
                    {achievement.unlocked ? 'Unlocked' : `${achievement.progress}/${achievement.maxProgress}`}
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
