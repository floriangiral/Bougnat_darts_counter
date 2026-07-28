import type { ExerciseCatalogItem, PlayerSkill, SkillId } from '../../domain/coach';
import type { AssessmentDefinition, AssessmentRawInputs } from '../../domain/coach';
import type {
  AiSessionDecision,
  AiSessionDecisionContext,
  AssessmentResult,
  CoachProfile,
  CoachSessionPlan,
  ExerciseExecution,
  TrainingProgram,
} from './types';

export interface CoachDataRepository {
  getCoachProfile(playerId: string): Promise<CoachProfile>;
  listPlayerSkills(playerId: string): Promise<PlayerSkill[]>;
  listExercises(skillIds?: SkillId[]): Promise<ExerciseCatalogItem[]>;
  listRecentExecutions(playerId: string, limit: number): Promise<ExerciseExecution[]>;
  saveGeneratedSession(plan: CoachSessionPlan): Promise<void>;
}

export interface CoachAiDecisionPort {
  decideSession(context: AiSessionDecisionContext): Promise<AiSessionDecision>;
}

export interface CoachAssessmentPort {
  getDefinition(): Promise<AssessmentDefinition>;
  submitAssessment(rawInputs: AssessmentRawInputs): Promise<AssessmentResult>;
}

export interface CoachProgramPort {
  generateProgram(goalCode?: string, horizonDays?: number): Promise<TrainingProgram>;
}

export interface CoachCachePort {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
}
