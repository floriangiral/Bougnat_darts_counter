import { selectPrioritySkills, validateExerciseSelection } from '../../domain/coach';
import type {
  CoachHomeAction,
  CoachSessionGenerationInput,
  CoachSessionPlan,
  SessionGenerationConstraints,
} from './types';
import type { CoachAiDecisionPort, CoachCachePort, CoachDataRepository } from './ports';

const CACHE_TTL_SECONDS = 90;

const normalizeConstraints = (constraints: SessionGenerationConstraints): SessionGenerationConstraints => ({
  maxDurationMinutes: constraints.maxDurationMinutes ?? 45,
  minExercises: constraints.minExercises ?? 3,
  maxExercises: constraints.maxExercises ?? 6,
});

const buildCacheKey = (playerId: string, action: CoachHomeAction): string => {
  return `coach-session:${playerId}:${action}`;
};

export class CoachAIService {
  constructor(
    private readonly repository: CoachDataRepository,
    private readonly aiDecisionPort: CoachAiDecisionPort,
    private readonly cache: CoachCachePort | null = null,
  ) {}

  async composeSession(input: CoachSessionGenerationInput): Promise<CoachSessionPlan> {
    const normalizedConstraints = normalizeConstraints(input.constraints);
    const cacheKey = buildCacheKey(input.playerId, input.action);

    if (this.cache) {
      const cached = await this.cache.get<CoachSessionPlan>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const [profile, skills, recentExecutions] = await Promise.all([
      this.repository.getCoachProfile(input.playerId),
      this.repository.listPlayerSkills(input.playerId),
      this.repository.listRecentExecutions(input.playerId, 20),
    ]);

    const prioritizedSkillIds = input.targetSkillIds?.length
      ? input.targetSkillIds
      : selectPrioritySkills(skills, 4);

    const availableExercises = await this.repository.listExercises(prioritizedSkillIds);

    const decision = await this.aiDecisionPort.decideSession({
      profile,
      prioritizedSkillIds,
      availableExercises,
      recentExecutions,
      action: input.action,
      constraints: normalizedConstraints,
    });

    const selectedExercises = validateExerciseSelection(
      decision.selectedExerciseIds,
      availableExercises,
      normalizedConstraints,
    );

    const plan: CoachSessionPlan = {
      playerId: input.playerId,
      action: input.action,
      selectedExercises,
      rationale: decision.rationale,
      generatedAt: new Date().toISOString(),
    };

    await this.repository.saveGeneratedSession(plan);

    if (this.cache) {
      await this.cache.set(cacheKey, plan, CACHE_TTL_SECONDS);
    }

    return plan;
  }
}
