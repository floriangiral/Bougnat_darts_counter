import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  GenerateInitialProgram,
  type CoachProgramPort,
  type TrainingProgram,
} from '../../../src/application/coach';
import { HttpCoachProgramClient } from '../../../src/infrastructure/bougnatApi/coachApi';

const stubProgram = (): TrainingProgram => ({
  id: 'program-1',
  level: 'intermediate',
  goalCode: 'precision_bull',
  horizonDays: 28,
  generatedAt: '2026-07-03T10:00:00.000Z',
  recommendation: 'programme',
  cycles: [
    {
      cycleOrder: 1,
      focus: 'Bull',
      startsOn: '2026-07-03T00:00:00.000Z',
      endsOn: '2026-07-17T00:00:00.000Z',
      sessions: [
        {
          order: 1,
          name: 'Seance 1 - Bull',
          focus: 'Bull',
          objective: 'precision_bull',
          skillCodes: ['precision_bull'],
          durationMinutes: 30,
        },
      ],
    },
  ],
});

describe('GenerateInitialProgram', () => {
  it('delegates to the program port and returns the built plan', async () => {
    let receivedGoal: string | undefined = 'unset';
    const port: CoachProgramPort = {
      generateProgram: async (goalCode) => {
        receivedGoal = goalCode;
        return stubProgram();
      },
    };

    const program = await new GenerateInitialProgram(port).execute();

    expect(receivedGoal).toBeUndefined();
    expect(program.level).toBe('intermediate');
    expect(program.cycles).toHaveLength(1);
    expect(program.cycles[0].cycleOrder).toBe(1);
    expect(program.cycles[0].sessions[0].order).toBe(1);
    expect(program.cycles[0].sessions[0].durationMinutes).toBe(30);
  });
});

describe('HttpCoachProgramClient', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('posts to the programs:generate endpoint and normalizes the program', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            id: 'program-9',
            level: 'advanced',
            goalCode: 'maitrise_checkout',
            horizonDays: 42,
            generatedAt: '2026-07-03T10:00:00.000Z',
            recommendation: 'programme',
            cycles: [
              {
                cycleOrder: 1,
                focus: 'Checkout',
                startsOn: '2026-07-03T00:00:00.000Z',
                endsOn: '2026-07-17T00:00:00.000Z',
                sessions: [
                  {
                    order: 1,
                    name: 'Seance 1 - Checkout',
                    focus: 'Checkout',
                    objective: 'maitrise_checkout',
                    skillCodes: ['maitrise_checkout'],
                    durationMinutes: 40,
                  },
                ],
              },
            ],
          },
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const client = new HttpCoachProgramClient('https://api.bougnatdarts.fr', async () => 'token');
    const program = await client.generateProgram();

    const call = fetchMock.mock.calls.at(0);
    const url = call?.[0] as string;
    const init = call?.[1] as RequestInit;
    expect(url).toBe('https://api.bougnatdarts.fr/v1/coach/me/programs:generate');
    expect(init.method).toBe('POST');
    expect(program.level).toBe('advanced');
    expect(program.cycles[0].focus).toBe('Checkout');
    expect(program.cycles[0].sessions[0].durationMinutes).toBe(40);
  });
});
