import { afterEach, describe, expect, it, vi } from 'vitest';
import { RunFullAssessment, type AssessmentResult, type CoachAssessmentPort } from '../../../src/application/coach';
import { HttpCoachAssessmentClient, CoachApiError } from '../../../src/infrastructure/bougnatApi/coachApi';
import type { AssessmentDefinition, AssessmentRawInputs } from '../../../src/domain/coach';

const stubResult = (): AssessmentResult => ({
  id: 'assessment-1',
  scores: { scoring: 40, doubles: 25 },
  summary: {
    overallScore: 40,
    strongestSkills: ['scoring'],
    weakestSkills: ['doubles'],
    recommendation: 'travailler les doubles',
    confidence: 0.65,
    strengths: [{ skill: 'Scoring', comment: 'Bon volume de points' }],
    weaknesses: [{ skill: 'Doubles', comment: 'Finition a fiabiliser' }],
    priorities: [{ focus: 'Doubles', reason: 'Score le plus bas' }],
    potential: 'Belle marge de progression sur la finition',
    explanation: 'Profil offensif avec une finition perfectible',
  },
  level: 'beginner',
  completedAt: '2026-07-03T00:00:00.000Z',
});

const stubDefinition = (): AssessmentDefinition => ({
  version: 1,
  skills: [{ code: 'scoring', label: 'Scoring', category: 'attack' }],
  exercises: [
    {
      code: 'scoring_20',
      order: 1,
      name: 'Scoring 20',
      description: 'desc',
      instruction: 'instr',
      primarySkills: ['scoring'],
      fields: [{ id: 'volley1', label: 'Volee 1', min: 0, max: 180, kind: 'volley' }],
    },
  ],
});

describe('RunFullAssessment', () => {
  it('submits raw inputs to the backend and exposes the backend calibration', async () => {
    let submitted: AssessmentRawInputs | null = null;
    const port: CoachAssessmentPort = {
      getDefinition: async () => stubDefinition(),
      submitAssessment: async (rawInputs) => {
        submitted = rawInputs;
        return stubResult();
      },
    };

    const rawInputs: AssessmentRawInputs = { scoring_20: { volley1: 60 } };
    const outcome = await new RunFullAssessment(port).execute(rawInputs);

    expect(submitted).toEqual(rawInputs);
    expect(outcome.level).toBe('beginner');
    expect(outcome.scores).toEqual({ scoring: 40, doubles: 25 });
    expect(outcome.weakestSkill).toBe('doubles');
    expect(outcome.result.summary.recommendation).toBe('travailler les doubles');
    expect(outcome.overallScore).toBe(40);
  });
});

describe('HttpCoachAssessmentClient', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('fetches the assessment definition and normalizes it', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            version: 1,
            skills: [{ code: 'scoring', label: 'Scoring', category: 'attack' }],
            exercises: [
              {
                code: 'scoring_20',
                order: 2,
                name: 'Scoring 20',
                description: 'desc',
                instruction: 'instr',
                primarySkills: ['scoring'],
                fields: [{ id: 'volley1', label: 'Volee 1', min: 0, max: 180, kind: 'volley' }],
              },
              {
                code: 'bull',
                order: 1,
                name: 'Bull',
                description: 'desc',
                instruction: 'instr',
                primarySkills: ['bull'],
                fields: [{ id: 'outerBull', label: 'Bull exterieur', min: 0, max: 30, kind: 'count', step: 1 }],
              },
            ],
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const client = new HttpCoachAssessmentClient('https://api.bougnatdarts.fr', async () => 'token');
    const definition = await client.getDefinition();

    const call = fetchMock.mock.calls.at(0);
    const url = call?.[0] as string;
    const init = call?.[1] as RequestInit;
    expect(url).toBe('https://api.bougnatdarts.fr/v1/coach/assessment/definition');
    expect(init.method).toBe('GET');
    expect(definition.version).toBe(1);
    expect(definition.skills).toHaveLength(1);
    expect(definition.exercises.map((exercise) => exercise.code)).toEqual(['bull', 'scoring_20']);
  });

  it('posts raw inputs to the evaluations endpoint and normalizes the result', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            id: 'assessment-9',
            scores: { scoring: 55 },
            summary: {
              overallScore: 55,
              strongestSkills: ['scoring'],
              weakestSkills: ['bull'],
              recommendation: 'travailler le bull',
              confidence: 0.7,
              strengths: [{ skill: 'Scoring', comment: 'Bon volume' }],
              weaknesses: [{ skill: 'Bull', comment: 'A fiabiliser' }],
              priorities: [{ focus: 'Bull', reason: 'Score le plus bas' }],
              potential: 'Marge de progression sur le bull',
              explanation: 'Profil offensif, finition perfectible',
            },
            level: 'intermediate',
            completedAt: '2026-07-03T10:00:00.000Z',
          },
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const client = new HttpCoachAssessmentClient('https://api.bougnatdarts.fr', async () => 'token');
    const rawInputs: AssessmentRawInputs = { scoring_20: { volley1: 55 }, bull: { outerBull: 20 } };
    const result = await client.submitAssessment(rawInputs);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call = fetchMock.mock.calls.at(0);
    const url = call?.[0] as string;
    const init = call?.[1] as RequestInit;
    expect(url).toBe('https://api.bougnatdarts.fr/v1/coach/me/evaluations');
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual({ rawInputs });
    expect(result.id).toBe('assessment-9');
    expect(result.level).toBe('intermediate');
    expect(result.summary.recommendation).toBe('travailler le bull');
    expect(result.summary.strengths).toEqual([{ skill: 'Scoring', comment: 'Bon volume' }]);
    expect(result.summary.weaknesses).toEqual([{ skill: 'Bull', comment: 'A fiabiliser' }]);
    expect(result.summary.priorities).toEqual([{ focus: 'Bull', reason: 'Score le plus bas' }]);
    expect(result.summary.potential).toBe('Marge de progression sur le bull');
    expect(result.summary.explanation).toBe('Profil offensif, finition perfectible');
  });

  it('throws a CoachApiError without calling fetch when the token is missing', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const client = new HttpCoachAssessmentClient('https://api.bougnatdarts.fr', async () => null);

    await expect(client.submitAssessment({ scoring_20: { volley1: 10 } })).rejects.toMatchObject({
      name: 'CoachApiError',
      status: 401,
    } satisfies Partial<CoachApiError>);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
