import type { ExerciseCatalogItem } from '../../domain/coach';
import type { SkillId } from '../../domain/coach';

export type CoachHomeAction =
  | 'continue_program'
  | 'work_skill'
  | 'prepare_competition'
  | 'full_assessment';

export type CoachProfile = {
  playerId: string;
  level: string;
  primaryObjective: string;
};

export type ExerciseExecution = {
  exerciseId: string;
  executedAt: string;
  successRate: number;
};

export type SessionGenerationConstraints = {
  maxDurationMinutes?: number;
  minExercises?: number;
  maxExercises?: number;
};

export type CoachSessionGenerationInput = {
  playerId: string;
  action: CoachHomeAction;
  targetSkillIds?: SkillId[];
  constraints: SessionGenerationConstraints;
};

export type CoachSessionPlan = {
  playerId: string;
  action: CoachHomeAction;
  selectedExercises: ExerciseCatalogItem[];
  rationale: string;
  generatedAt: string;
};

export type AiSessionDecisionContext = {
  profile: CoachProfile;
  prioritizedSkillIds: SkillId[];
  availableExercises: ExerciseCatalogItem[];
  recentExecutions: ExerciseExecution[];
  action: CoachHomeAction;
  constraints: SessionGenerationConstraints;
};

export type AiSessionDecision = {
  selectedExerciseIds: string[];
  rationale: string;
};

export type AssessmentSummary = {
  overallScore: number;
  strongestSkills: string[];
  weakestSkills: string[];
  recommendation: string;
  confidence: number;
  strengths: AssessmentInsight[];
  weaknesses: AssessmentInsight[];
  priorities: AssessmentPriority[];
  potential: string;
  explanation: string;
};

export type AssessmentInsight = {
  skill: string;
  comment: string;
};

export type AssessmentPriority = {
  focus: string;
  reason: string;
};

export type AssessmentResult = {
  id: string;
  scores: Record<string, number>;
  summary: AssessmentSummary;
  level: string;
  completedAt: string;
};

export type TrainingSession = {
  order: number;
  name: string;
  focus: string;
  objective: string;
  skillCodes: string[];
  durationMinutes: number;
};

export type TrainingCycle = {
  cycleOrder: number;
  focus: string;
  startsOn: string;
  endsOn: string;
  sessions: TrainingSession[];
};

export type TrainingProgram = {
  id: string;
  level: string;
  goalCode: string;
  horizonDays: number;
  generatedAt: string;
  recommendation: string;
  cycles: TrainingCycle[];
};
