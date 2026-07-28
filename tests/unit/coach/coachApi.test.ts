import { afterEach, describe, expect, it, vi } from 'vitest';
import { CoachApiError, HttpCoachAiDecisionClient, HttpCoachRepository } from '../../../src/infrastructure/bougnatApi/coachApi';

describe('coachApi auth guard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('fails locally and does not call fetch when token is missing on repository calls', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const repository = new HttpCoachRepository('https://api.bougnatdarts.fr', async () => null);

    await expect(repository.listPlayerSkills()).rejects.toMatchObject({
      name: 'CoachApiError',
      status: 401,
      message: 'Authentification requise pour utiliser le Coach IA.',
    } satisfies Partial<CoachApiError>);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fails locally and does not call fetch when token is missing on AI decision calls', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const decisionClient = new HttpCoachAiDecisionClient('https://api.bougnatdarts.fr', async () => null);

    await expect(
      decisionClient.decideSession({
        profile: { playerId: 'player-1', level: 'intermediate', primaryObjective: 'progression' },
        prioritizedSkillIds: ['scoring'],
        availableExercises: [],
        recentExecutions: [],
        action: 'work_skill',
        constraints: {},
      }),
    ).rejects.toMatchObject({
      name: 'CoachApiError',
      status: 401,
      message: 'Authentification requise pour utiliser le Coach IA.',
    } satisfies Partial<CoachApiError>);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends only backend contract fields for AI decision request payload', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      data: {
        selectedExerciseIds: ['ex-1'],
        rationale: 'ok',
      },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);

    const decisionClient = new HttpCoachAiDecisionClient('https://api.bougnatdarts.fr', async () => 'token-123');

    await decisionClient.decideSession({
      profile: { playerId: 'player-1', level: 'intermediate', primaryObjective: 'progression' },
      prioritizedSkillIds: ['scoring'],
      availableExercises: [{
        id: 'ex-1',
        name: 'Exercice',
        description: '',
        durationMinutes: 10,
        difficulty: 'beginner',
        objective: '',
        primarySkills: ['scoring'],
        secondarySkills: [],
        prerequisites: [],
        requiredEquipment: [],
        recommendedLevel: 'beginner',
        successCriteria: [],
        failureCriteria: [],
        tags: [],
        configurableParameters: {},
      }],
      recentExecutions: [],
      action: 'work_skill',
      constraints: {},
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const firstCall = fetchMock.mock.calls.at(0) as unknown[] | undefined;
    const request = firstCall?.[1] as RequestInit | undefined;
    expect(request?.body).toBeTypeOf('string');
    const sent = JSON.parse(String(request?.body)) as Record<string, unknown>;
    expect(sent).toMatchObject({
      action: 'work_skill',
      prioritizedSkillIds: ['scoring'],
      constraints: {},
      profile: { playerId: 'player-1', level: 'intermediate', primaryObjective: 'progression' },
      recentExecutions: [],
    });
    expect(sent).not.toHaveProperty('availableExercises');
  });
});
