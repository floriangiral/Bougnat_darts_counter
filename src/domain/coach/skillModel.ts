export type SkillId = string;

export type SkillTrend = 'improving' | 'stable' | 'declining';

export type PlayerSkill = {
  skillId: SkillId;
  score: number;
  confidence: number;
  trend: SkillTrend;
  updatedAt: string;
};

export const clampSkillScore = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
};

export const selectPrioritySkills = (skills: PlayerSkill[], limit = 4): SkillId[] => {
  return [...skills]
    .sort((a, b) => {
      const scoreDelta = clampSkillScore(a.score) - clampSkillScore(b.score);
      if (scoreDelta !== 0) return scoreDelta;
      return a.confidence - b.confidence;
    })
    .slice(0, Math.max(1, limit))
    .map((skill) => skill.skillId);
};
