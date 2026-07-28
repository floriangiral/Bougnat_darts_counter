import { describe, expect, it } from 'vitest';

import { CoachAIService } from '../../../src/application/coach';
import type {
  CoachAiDecisionPort,
  CoachCachePort,
  CoachDataRepository,
} from '../../../src/application/coach';
import type { ExerciseCatalogItem, PlayerSkill } from '../../../src/domain/coach';

const catalog: ExerciseCatalogItem[] = [
  {
    id: 'ex-1',
    name: 'Doubles 40',
    description: 'Serie doubles autour de D20/D10.',
    durationMinutes: 12,
    difficulty: 'beginner',
    objective: 'Stabiliser les doubles courts.',
    primarySkills: ['Doubles'],
    secondarySkills: ['GestionPression'],
    prerequisites: [],
    requiredEquipment: ['target'],
    recommendedLevel: 'debutant',
    successCriteria: ['>= 35% de touche'],
    failureCriteria: ['< 20% de touche'],
    tags: ['doubles', 'checkout'],
    configurableParameters: { rounds: 5 },
  },
  {
    id: 'ex-2',
    name: 'Checkouts 41-60',
    description: 'Routes checkout medium.',
    durationMinutes: 15,
    difficulty: 'intermediate',
    objective: 'Automatiser les sorties 41-60.',
    primarySkills: ['Checkouts 41-60'],
    secondarySkills: ['PremierTour'],
    prerequisites: ['Doubles'],
    requiredEquipment: ['target'],
    recommendedLevel: 'intermediaire',
    successCriteria: ['>= 3 sorties sur 10'],
    failureCriteria: ['0 sortie sur 10'],
    tags: ['checkout'],
    configurableParameters: { attempts: 10 },
  },
  {
    id: 'ex-3',
    name: 'T20 focus',
    description: 'Bloc precision T20.',
    durationMinutes: 10,
    difficulty: 'advanced',
    objective: 'Augmenter le taux de T20.',
    primarySkills: ['Triple20'],
    secondarySkills: ['Scoring'],
    prerequisites: [],
    requiredEquipment: ['target'],
    recommendedLevel: 'avance',
    successCriteria: ['>= 25% de touche T20'],
    failureCriteria: ['< 10%'],
    tags: ['scoring'],
    configurableParameters: { darts: 30 },
  },
];

const playerSkills: PlayerSkill[] = [
  { skillId: 'Scoring', score: 68, confidence: 0.7, trend: 'stable', updatedAt: '2026-06-30T10:00:00.000Z' },
  { skillId: 'Doubles', score: 42, confidence: 0.9, trend: 'declining', updatedAt: '2026-06-30T10:00:00.000Z' },
  { skillId: 'Checkouts 41-60', score: 37, confidence: 0.8, trend: 'declining', updatedAt: '2026-06-30T10:00:00.000Z' },
  { skillId: 'Triple20', score: 71, confidence: 0.6, trend: 'improving', updatedAt: '2026-06-30T10:00:00.000Z' },
];

const createRepository = (): CoachDataRepository => ({
  async getCoachProfile() {
    return {
      playerId: 'player-1',
      level: 'intermediaire',
      primaryObjective: 'competition-regionale',
    };
  },
  async listPlayerSkills() {
    return playerSkills;
  },
  async listExercises() {
    return catalog;
  },
  async listRecentExecutions() {
    return [
      { exerciseId: 'ex-2', executedAt: '2026-07-01T08:00:00.000Z', successRate: 0.3 },
    ];
  },
  async saveGeneratedSession() {
    return;
  },
});

class InMemoryCache implements CoachCachePort {
  private readonly store = new Map<string, unknown>();

  async get<T>(key: string): Promise<T | null> {
    return (this.store.get(key) as T | undefined) ?? null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.store.set(key, value);
  }
}

describe('CoachAIService', () => {
  it('keeps exercise selection strictly inside backend catalog', async () => {
    const repository = createRepository();
    const aiDecisionPort: CoachAiDecisionPort = {
      async decideSession() {
        return {
          selectedExerciseIds: ['ex-2', 'ex-1'],
          rationale: 'Travail des zones faibles checkout + doubles.',
        };
      },
    };

    const service = new CoachAIService(repository, aiDecisionPort);

    const plan = await service.composeSession({
      playerId: 'player-1',
      action: 'continue_program',
      constraints: {
        maxDurationMinutes: 40,
        minExercises: 2,
        maxExercises: 4,
      },
    });

    expect(plan.selectedExercises.map((exercise) => exercise.id)).toEqual(['ex-2', 'ex-1']);
    expect(plan.rationale).toContain('zones faibles');
  });

  it('rejects invalid ai decision when an unknown exercise is returned', async () => {
    const repository = createRepository();
    const aiDecisionPort: CoachAiDecisionPort = {
      async decideSession() {
        return {
          selectedExerciseIds: ['ex-404'],
          rationale: 'invalid',
        };
      },
    };

    const service = new CoachAIService(repository, aiDecisionPort);

    await expect(service.composeSession({
      playerId: 'player-1',
      action: 'work_skill',
      constraints: { maxDurationMinutes: 30 },
    })).rejects.toThrow('Exercice inconnu');
  });

  it('returns cached session when available to limit ai calls', async () => {
    const repository = createRepository();
    const cache = new InMemoryCache();
    let aiCalls = 0;

    const aiDecisionPort: CoachAiDecisionPort = {
      async decideSession() {
        aiCalls += 1;
        return {
          selectedExerciseIds: ['ex-1', 'ex-3'],
          rationale: 'Rotation scoring et doubles.',
        };
      },
    };

    const service = new CoachAIService(repository, aiDecisionPort, cache);

    await service.composeSession({
      playerId: 'player-1',
      action: 'prepare_competition',
      constraints: { maxDurationMinutes: 35, minExercises: 2 },
    });

    await service.composeSession({
      playerId: 'player-1',
      action: 'prepare_competition',
      constraints: { maxDurationMinutes: 35, minExercises: 2 },
    });

    expect(aiCalls).toBe(1);
  });
});
