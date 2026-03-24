import React from 'react';
import type { Challenge } from '../../src/types/lobby';

interface ChallengesPanelProps {
  challenges: Challenge[];
}

export const ChallengesPanel: React.FC<ChallengesPanelProps> = ({ challenges }) => {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-[#101722]/86 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-6">
      <div className="mb-5">
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-300">Daily Challenges</p>
        <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-white">Engagement & Objectives</h2>
      </div>

      <div className="space-y-3">
        {challenges.map((challenge) => {
          const progress = Math.min(100, Math.round((challenge.progress / challenge.target) * 100));
          return (
            <div key={challenge.id} className="rounded-[1.4rem] border border-white/8 bg-black/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-base font-black text-white">{challenge.title}</div>
                  <div className="mt-1 text-sm text-gray-400">{challenge.description}</div>
                </div>
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-300">{challenge.reward}</div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-2 text-sm text-gray-500">{challenge.progress} / {challenge.target}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
