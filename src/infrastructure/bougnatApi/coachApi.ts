import type { ExerciseCatalogItem, PlayerSkill, SkillId } from '../../domain/coach';
import type {
  AssessmentDefinition,
  AssessmentExerciseDef,
  AssessmentInputField,
  AssessmentInputKind,
  AssessmentRawInputs,
  AssessmentSkillDef,
} from '../../domain/coach';
import type {
  AiSessionDecision,
  AiSessionDecisionContext,
  AssessmentResult,
  AssessmentSummary,
  CoachProfile,
  CoachSessionPlan,
  ExerciseExecution,
  TrainingCycle,
  TrainingProgram,
  TrainingSession,
} from '../../application/coach';
import type { CoachAiDecisionPort, CoachAssessmentPort, CoachDataRepository, CoachProgramPort } from '../../application/coach';

type TokenProvider = () => Promise<string | null>;

export class CoachApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'CoachApiError';
  }
}

const normalizeApiBaseUrl = (apiBaseUrl: string): string => apiBaseUrl.trim().replace(/\/$/, '');

const buildUrl = (apiBaseUrl: string, path: string): string => `${normalizeApiBaseUrl(apiBaseUrl)}${path}`;

const buildIdempotencyKey = (scope: string): string => {
  const randomPart = Math.random().toString(36).slice(2, 12);
  return `coach-${scope}-${Date.now()}-${randomPart}`;
};

const getRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' ? value as Record<string, unknown> : null;

const unwrapApiData = (body: unknown): unknown => {
  const record = getRecord(body);
  return record && 'data' in record ? record.data : body;
};

const getErrorMessage = (body: unknown): string | null => {
  const record = getRecord(body);
  const nestedError = getRecord(record?.error);
  for (const source of [record, nestedError]) {
    if (!source) continue;
    for (const key of ['message', 'error', 'detail']) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
  }
  return null;
};

const readResponseJson = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new CoachApiError('Reponse coach illisible.', response.status);
  }
};

async function fetchApiData(
  apiBaseUrl: string,
  getToken: TokenProvider,
  path: string,
  init: RequestInit,
): Promise<unknown> {
  let response: Response;
  const bearerToken = await getToken();
  if (!bearerToken) {
    throw new CoachApiError('Authentification requise pour utiliser le Coach IA.', 401);
  }

  try {
    response = await fetch(buildUrl(apiBaseUrl, path), {
      ...init,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${bearerToken}`,
        ...init.headers,
      },
    });
  } catch (error) {
    throw new CoachApiError(
      error instanceof Error && error.message ? error.message : 'Reseau indisponible.',
    );
  }

  const body = await readResponseJson(response);
  if (!response.ok) {
    throw new CoachApiError(
      getErrorMessage(body) ?? `Service coach indisponible (${response.status}).`,
      response.status,
    );
  }

  return unwrapApiData(body);
}

const normalizeSkillList = (payload: unknown): PlayerSkill[] => {
  if (Array.isArray(payload)) return payload as PlayerSkill[];
  const record = getRecord(payload);
  const items = record?.items;
  return Array.isArray(items) ? items as PlayerSkill[] : [];
};

const normalizeExerciseList = (payload: unknown): ExerciseCatalogItem[] => {
  if (Array.isArray(payload)) return payload as ExerciseCatalogItem[];
  const record = getRecord(payload);
  const items = record?.items;
  return Array.isArray(items) ? items as ExerciseCatalogItem[] : [];
};

const normalizeExecutionList = (payload: unknown): ExerciseExecution[] => {
  if (Array.isArray(payload)) return payload as ExerciseExecution[];
  const record = getRecord(payload);
  const items = record?.items;
  return Array.isArray(items) ? items as ExerciseExecution[] : [];
};

export class HttpCoachRepository implements CoachDataRepository {
  constructor(
    private readonly apiBaseUrl: string,
    private readonly getToken: TokenProvider,
  ) {}

  async getCoachProfile(): Promise<CoachProfile> {
    const payload = await fetchApiData(this.apiBaseUrl, this.getToken, '/v1/coach/me/profile', { method: 'GET' });
    return payload as CoachProfile;
  }

  async listPlayerSkills(): Promise<PlayerSkill[]> {
    const payload = await fetchApiData(this.apiBaseUrl, this.getToken, '/v1/coach/me/skills', { method: 'GET' });
    return normalizeSkillList(payload);
  }

  async listExercises(skillIds?: SkillId[]): Promise<ExerciseCatalogItem[]> {
    const params = new URLSearchParams();
    for (const skillId of skillIds ?? []) {
      params.append('skill_id', skillId);
    }

    const query = params.toString();
    const payload = await fetchApiData(
      this.apiBaseUrl,
      this.getToken,
      query ? `/v1/coach/exercises?${query}` : '/v1/coach/exercises',
      { method: 'GET' },
    );
    return normalizeExerciseList(payload);
  }

  async listRecentExecutions(_playerId: string, limit: number): Promise<ExerciseExecution[]> {
    const payload = await fetchApiData(
      this.apiBaseUrl,
      this.getToken,
      `/v1/coach/me/executions?limit=${encodeURIComponent(String(limit))}`,
      { method: 'GET' },
    );
    return normalizeExecutionList(payload);
  }

  async saveGeneratedSession(plan: CoachSessionPlan): Promise<void> {
    await fetchApiData(this.apiBaseUrl, this.getToken, '/v1/coach/me/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': buildIdempotencyKey('persist-session'),
      },
      body: JSON.stringify(plan),
    });
  }
}

export class HttpCoachAiDecisionClient implements CoachAiDecisionPort {
  constructor(
    private readonly apiBaseUrl: string,
    private readonly getToken: TokenProvider,
  ) {}

  async decideSession(context: AiSessionDecisionContext): Promise<AiSessionDecision> {
    const requestPayload = {
      action: context.action,
      prioritizedSkillIds: context.prioritizedSkillIds,
      constraints: context.constraints,
      profile: context.profile,
      recentExecutions: context.recentExecutions,
    };

    const payload = await fetchApiData(this.apiBaseUrl, this.getToken, '/v1/coach/me/sessions:generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': buildIdempotencyKey('generate-session'),
      },
      body: JSON.stringify(requestPayload),
    });
    return payload as AiSessionDecision;
  }
}

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toStringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const normalizeAssessmentInsights = (value: unknown): { skill: string; comment: string }[] =>
  Array.isArray(value)
    ? value
        .map((item) => {
          const record = getRecord(item) ?? {};
          return {
            skill: typeof record.skill === 'string' ? record.skill : '',
            comment: typeof record.comment === 'string' ? record.comment : '',
          };
        })
        .filter((item) => item.skill !== '' || item.comment !== '')
    : [];

const normalizeAssessmentPriorities = (value: unknown): { focus: string; reason: string }[] =>
  Array.isArray(value)
    ? value
        .map((item) => {
          const record = getRecord(item) ?? {};
          return {
            focus: typeof record.focus === 'string' ? record.focus : '',
            reason: typeof record.reason === 'string' ? record.reason : '',
          };
        })
        .filter((item) => item.focus !== '' || item.reason !== '')
    : [];

const normalizeAssessmentSummary = (value: unknown): AssessmentSummary => {
  const record = getRecord(value) ?? {};
  const recommendation = typeof record.recommendation === 'string' ? record.recommendation : '';
  return {
    overallScore: toNumber(record.overallScore),
    strongestSkills: toStringList(record.strongestSkills),
    weakestSkills: toStringList(record.weakestSkills),
    recommendation,
    confidence: toNumber(record.confidence),
    strengths: normalizeAssessmentInsights(record.strengths),
    weaknesses: normalizeAssessmentInsights(record.weaknesses),
    priorities: normalizeAssessmentPriorities(record.priorities),
    potential: typeof record.potential === 'string' ? record.potential : '',
    explanation: typeof record.explanation === 'string' ? record.explanation : '',
  };
};

const normalizeScoreMap = (value: unknown): Record<string, number> => {
  const record = getRecord(value);
  if (!record) return {};
  const scores: Record<string, number> = {};
  for (const [key, raw] of Object.entries(record)) {
    scores[key] = toNumber(raw);
  }
  return scores;
};

const normalizeAssessmentResult = (payload: unknown): AssessmentResult => {
  const record = getRecord(payload) ?? {};
  return {
    id: typeof record.id === 'string' ? record.id : '',
    scores: normalizeScoreMap(record.scores),
    summary: normalizeAssessmentSummary(record.summary),
    level: typeof record.level === 'string' ? record.level : '',
    completedAt: typeof record.completedAt === 'string' ? record.completedAt : new Date().toISOString(),
  };
};

const normalizeInputKind = (value: unknown): AssessmentInputKind => (value === 'volley' ? 'volley' : 'count');

const normalizeInputField = (value: unknown): AssessmentInputField => {
  const record = getRecord(value) ?? {};
  const field: AssessmentInputField = {
    id: typeof record.id === 'string' ? record.id : '',
    label: typeof record.label === 'string' ? record.label : '',
    min: toNumber(record.min),
    max: toNumber(record.max),
    kind: normalizeInputKind(record.kind),
  };
  if (record.step !== undefined && record.step !== null) {
    field.step = toNumber(record.step, 1);
  }
  return field;
};

const normalizeSkillDef = (value: unknown): AssessmentSkillDef => {
  const record = getRecord(value) ?? {};
  return {
    code: typeof record.code === 'string' ? record.code : '',
    label: typeof record.label === 'string' ? record.label : '',
    category: typeof record.category === 'string' ? record.category : '',
  };
};

const normalizeExerciseDef = (value: unknown): AssessmentExerciseDef => {
  const record = getRecord(value) ?? {};
  return {
    code: typeof record.code === 'string' ? record.code : '',
    order: toNumber(record.order),
    name: typeof record.name === 'string' ? record.name : '',
    description: typeof record.description === 'string' ? record.description : '',
    instruction: typeof record.instruction === 'string' ? record.instruction : '',
    primarySkills: toStringList(record.primarySkills),
    fields: Array.isArray(record.fields) ? record.fields.map(normalizeInputField) : [],
  };
};

const normalizeAssessmentDefinition = (payload: unknown): AssessmentDefinition => {
  const record = getRecord(payload) ?? {};
  const skills = Array.isArray(record.skills) ? record.skills.map(normalizeSkillDef) : [];
  const exercises = Array.isArray(record.exercises) ? record.exercises.map(normalizeExerciseDef) : [];
  exercises.sort((a, b) => a.order - b.order);
  return {
    version: toNumber(record.version),
    skills,
    exercises,
  };
};

export class HttpCoachAssessmentClient implements CoachAssessmentPort {
  constructor(
    private readonly apiBaseUrl: string,
    private readonly getToken: TokenProvider,
  ) {}

  async getDefinition(): Promise<AssessmentDefinition> {
    const payload = await fetchApiData(this.apiBaseUrl, this.getToken, '/v1/coach/assessment/definition', {
      method: 'GET',
    });
    return normalizeAssessmentDefinition(payload);
  }

  async submitAssessment(rawInputs: AssessmentRawInputs): Promise<AssessmentResult> {
    const payload = await fetchApiData(this.apiBaseUrl, this.getToken, '/v1/coach/me/evaluations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': buildIdempotencyKey('complete-assessment'),
      },
      body: JSON.stringify({ rawInputs }),
    });
    return normalizeAssessmentResult(payload);
  }
}

const normalizeTrainingSession = (value: unknown): TrainingSession => {
  const record = getRecord(value) ?? {};
  return {
    order: toNumber(record.order),
    name: typeof record.name === 'string' ? record.name : '',
    focus: typeof record.focus === 'string' ? record.focus : '',
    objective: typeof record.objective === 'string' ? record.objective : '',
    skillCodes: toStringList(record.skillCodes),
    durationMinutes: toNumber(record.durationMinutes),
  };
};

const normalizeTrainingCycle = (value: unknown): TrainingCycle => {
  const record = getRecord(value) ?? {};
  return {
    cycleOrder: toNumber(record.cycleOrder),
    focus: typeof record.focus === 'string' ? record.focus : '',
    startsOn: typeof record.startsOn === 'string' ? record.startsOn : '',
    endsOn: typeof record.endsOn === 'string' ? record.endsOn : '',
    sessions: Array.isArray(record.sessions) ? record.sessions.map(normalizeTrainingSession) : [],
  };
};

const normalizeTrainingProgram = (payload: unknown): TrainingProgram => {
  const record = getRecord(payload) ?? {};
  const cycles = Array.isArray(record.cycles) ? record.cycles.map(normalizeTrainingCycle) : [];
  cycles.sort((a, b) => a.cycleOrder - b.cycleOrder);
  return {
    id: typeof record.id === 'string' ? record.id : '',
    level: typeof record.level === 'string' ? record.level : '',
    goalCode: typeof record.goalCode === 'string' ? record.goalCode : '',
    horizonDays: toNumber(record.horizonDays),
    generatedAt: typeof record.generatedAt === 'string' ? record.generatedAt : new Date().toISOString(),
    recommendation: typeof record.recommendation === 'string' ? record.recommendation : '',
    cycles,
  };
};

export class HttpCoachProgramClient implements CoachProgramPort {
  constructor(
    private readonly apiBaseUrl: string,
    private readonly getToken: TokenProvider,
  ) {}

  async generateProgram(goalCode?: string, horizonDays?: number): Promise<TrainingProgram> {
    const body: Record<string, unknown> = {};
    if (goalCode && goalCode.trim()) body.goalCode = goalCode.trim();
    if (typeof horizonDays === 'number' && horizonDays > 0) body.horizonDays = horizonDays;
    const payload = await fetchApiData(this.apiBaseUrl, this.getToken, '/v1/coach/me/programs:generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': buildIdempotencyKey('generate-program'),
      },
      body: JSON.stringify(body),
    });
    return normalizeTrainingProgram(payload);
  }
}
