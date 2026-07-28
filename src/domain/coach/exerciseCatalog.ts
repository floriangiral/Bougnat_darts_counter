import type { SkillId } from './skillModel';

export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type ExerciseCatalogItem = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  difficulty: ExerciseDifficulty;
  objective: string;
  primarySkills: SkillId[];
  secondarySkills: SkillId[];
  prerequisites: SkillId[];
  requiredEquipment: string[];
  recommendedLevel: string;
  successCriteria: string[];
  failureCriteria: string[];
  tags: string[];
  configurableParameters: Record<string, string | number | boolean>;
};

export const indexExercisesById = (items: ExerciseCatalogItem[]): Map<string, ExerciseCatalogItem> => {
  return new Map(items.map((item) => [item.id, item]));
};
