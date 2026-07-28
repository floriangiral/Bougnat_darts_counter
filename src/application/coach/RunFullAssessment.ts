import type { AssessmentRawInputs } from '../../domain/coach';
import type { AssessmentResult } from './types';
import type { CoachAssessmentPort } from './ports';

export type FullAssessmentOutcome = {
  result: AssessmentResult;
  scores: Record<string, number>;
  overallScore: number;
  level: string;
  weakestSkill: string;
};

/**
 * Orchestration de l evaluation complete cote frontend.
 *
 * Le frontend ne fait aucun calcul: il transmet les entrees brutes au backend
 * (moteur decisionnel unique) qui normalise les scores, calibre le profil et
 * renvoie le resultat consomme ici.
 */
export class RunFullAssessment {
  constructor(private readonly assessmentPort: CoachAssessmentPort) {}

  async execute(rawInputs: AssessmentRawInputs): Promise<FullAssessmentOutcome> {
    const result = await this.assessmentPort.submitAssessment(rawInputs);
    return {
      result,
      scores: result.scores,
      overallScore: result.summary.overallScore,
      level: result.level,
      weakestSkill: pickWeakestSkill(result),
    };
  }
}

const pickWeakestSkill = (result: AssessmentResult): string => {
  const fromSummary = result.summary.weakestSkills[0];
  if (fromSummary) return fromSummary;
  const entries = Object.entries(result.scores);
  if (entries.length === 0) return '';
  return entries.reduce((weakest, current) => (current[1] < weakest[1] ? current : weakest))[0];
};
