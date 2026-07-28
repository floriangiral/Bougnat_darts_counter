import React from 'react';
import { ArrowLeft, ArrowRight, Award, BarChart3, Check, ListChecks, Minus, Plus, RotateCcw, Sparkles, Target, TrendingDown, TrendingUp } from 'lucide-react';
import {
  buildSkillLabelMap,
  createEmptyAssessmentDraft,
  type AssessmentDefinition,
  type AssessmentInputField,
  type AssessmentRawInputs,
  type SkillTrend,
} from '../src/domain/coach';
import type { FullAssessmentOutcome } from '../src/application/coach';

type AssessmentViewProps = {
  definition: AssessmentDefinition | null;
  loadingDefinition: boolean;
  onBack: () => void;
  onSubmit: (rawInputs: AssessmentRawInputs) => void;
  onRetryDefinition: () => void;
  pending: boolean;
  error: string | null;
  outcome: FullAssessmentOutcome | null;
  onRestart: () => void;
  onContinue: () => void;
  programPending: boolean;
  skillTrends?: Record<string, SkillTrend>;
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Debutant',
  intermediate: 'Intermediaire',
  advanced: 'Avance',
};

const TREND_META: Record<SkillTrend, { label: string; className: string; Icon: typeof TrendingUp }> = {
  improving: { label: 'En progression', className: 'text-emerald-300', Icon: TrendingUp },
  declining: { label: 'En baisse', className: 'text-red-300', Icon: TrendingDown },
  stable: { label: 'Stable', className: 'text-gray-400', Icon: Minus },
};

const clampFieldValue = (field: AssessmentInputField, value: number): number => {
  if (!Number.isFinite(value)) return field.min;
  return Math.max(field.min, Math.min(field.max, Math.round(value)));
};

const Stepper: React.FC<{
  field: AssessmentInputField;
  value: number;
  onChange: (value: number) => void;
}> = ({ field, value, onChange }) => {
  const bigStep = field.kind === 'volley' ? 10 : 5;
  const apply = (delta: number) => onChange(clampFieldValue(field, value + delta));
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <div className="min-w-0">
        <div className="text-sm font-black uppercase tracking-[0.08em] text-white">{field.label}</div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
          {field.min} - {field.max}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => apply(-bigStep)}
          className="inline-flex h-9 items-center rounded-lg border border-white/15 bg-black/30 px-2 text-[10px] font-black text-gray-200 hover:bg-black/50"
          aria-label={`Retirer ${bigStep} a ${field.label}`}
        >
          -{bigStep}
        </button>
        <button
          type="button"
          onClick={() => apply(-1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-black/30 text-gray-200 hover:bg-black/50"
          aria-label={`Retirer 1 a ${field.label}`}
        >
          <Minus className="h-4 w-4" />
        </button>
        <span
          className="inline-flex h-9 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 text-base font-black tabular-nums text-white"
          data-testid={`assessment-value-${field.id}`}
        >
          {value}
        </span>
        <button
          type="button"
          onClick={() => apply(1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-black/30 text-gray-200 hover:bg-black/50"
          aria-label={`Ajouter 1 a ${field.label}`}
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => apply(bigStep)}
          className="inline-flex h-9 items-center rounded-lg border border-white/15 bg-black/30 px-2 text-[10px] font-black text-gray-200 hover:bg-black/50"
          aria-label={`Ajouter ${bigStep} a ${field.label}`}
        >
          +{bigStep}
        </button>
      </div>
    </div>
  );
};

const SkillRadar: React.FC<{ points: { label: string; score: number }[] }> = ({ points }) => {
  const size = 260;
  const center = size / 2;
  const maxRadius = center - 48;
  const count = points.length;
  if (count < 3) return null;
  const angleFor = (index: number): number => (Math.PI * 2 * index) / count - Math.PI / 2;
  const coord = (index: number, ratio: number): { x: number; y: number } => {
    const angle = angleFor(index);
    return {
      x: center + Math.cos(angle) * maxRadius * ratio,
      y: center + Math.sin(angle) * maxRadius * ratio,
    };
  };
  const ring = (ratio: number): string =>
    points.map((_, index) => { const { x, y } = coord(index, ratio); return `${x},${y}`; }).join(' ');
  const shape = points
    .map((point, index) => {
      const { x, y } = coord(index, Math.max(0, Math.min(100, point.score)) / 100);
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto h-auto w-full max-w-[300px]" role="img" aria-label="Radar des competences">
      {[0.25, 0.5, 0.75, 1].map((ratio) => (
        <polygon key={ratio} points={ring(ratio)} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
      ))}
      {points.map((_, index) => {
        const { x, y } = coord(index, 1);
        return <line key={index} x1={center} y1={center} x2={x} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />;
      })}
      <polygon points={shape} fill="rgba(34,197,94,0.18)" stroke="rgba(52,211,153,0.9)" strokeWidth={2} />
      {points.map((point, index) => {
        const { x, y } = coord(index, Math.max(0, Math.min(100, point.score)) / 100);
        return <circle key={index} cx={x} cy={y} r={2.6} fill="#34d399" />;
      })}
      {points.map((point, index) => {
        const { x, y } = coord(index, 1.17);
        return (
          <text
            key={index}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-gray-300"
            style={{ fontSize: 7, fontWeight: 700 }}
          >
            {point.label}
          </text>
        );
      })}
    </svg>
  );
};

const ResultPanel: React.FC<{
  outcome: FullAssessmentOutcome;
  skillLabels: Record<string, string>;
  skillCategories: Record<string, string>;
  skillTrends: Record<string, SkillTrend>;
  onRestart: () => void;
  onContinue: () => void;
  programPending: boolean;
}> = ({ outcome, skillLabels, skillCategories, skillTrends, onRestart, onContinue, programPending }) => {
  const labelFor = (code: string): string => skillLabels[code] ?? code;
  const summary = outcome.result.summary;
  const skillEntries = Object.entries(outcome.scores);
  const ordered = [...skillEntries].sort((a, b) => b[1] - a[1]);
  const radarPoints = [...skillEntries]
    .map(([code, score]) => ({ label: labelFor(code), score }))
    .sort((a, b) => a.label.localeCompare(b.label));
  const trendFor = (code: string): SkillTrend => skillTrends[code] ?? 'stable';
  const improving = skillEntries.filter(([code]) => trendFor(code) === 'improving');
  const declining = skillEntries.filter(([code]) => trendFor(code) === 'declining');
  const stableCount = skillEntries.length - improving.length - declining.length;
  const hasTrendSignal = improving.length > 0 || declining.length > 0;
  return (
    <div data-testid="assessment-result" className="pb-4">
      <div className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-5 py-6 text-center">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200/80">Score global</div>
        <div className="mt-1 text-5xl font-black tabular-nums text-white">{Math.round(outcome.overallScore)}</div>
        <div className="mt-2 text-sm font-black uppercase tracking-[0.12em] text-emerald-100">
          Niveau: {LEVEL_LABELS[outcome.level] ?? outcome.level}
        </div>
      </div>

      <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200/80">
          <BarChart3 className="h-3.5 w-3.5" /> Radar des competences
        </div>
        <div className="mt-2">
          <SkillRadar points={radarPoints} />
        </div>
      </section>

      <section className="mt-4">
        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200/80">
          <ListChecks className="h-3.5 w-3.5" /> Details par indicateur
        </div>
        <div className="mt-2 space-y-2">
          {ordered.map(([skillId, score]) => {
            const trend = trendFor(skillId);
            const meta = TREND_META[trend];
            const category = skillCategories[skillId];
            return (
              <div key={skillId} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate font-semibold text-gray-200">{labelFor(skillId)}</span>
                  <span className="flex items-center gap-2">
                    <meta.Icon className={`h-3.5 w-3.5 ${meta.className}`} aria-label={meta.label} />
                    <span className="font-black tabular-nums text-white">{Math.round(score)}</span>
                  </span>
                </div>
                {category ? (
                  <div className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-gray-500">{category}</div>
                ) : null}
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                    style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200/80">
          <TrendingUp className="h-3.5 w-3.5" /> Evolution
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-emerald-300/20 bg-emerald-500/10 px-2 py-2">
            <div className="text-lg font-black tabular-nums text-emerald-200">{improving.length}</div>
            <div className="text-[9px] font-black uppercase tracking-[0.1em] text-emerald-200/70">Progression</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-2 py-2">
            <div className="text-lg font-black tabular-nums text-gray-200">{stableCount}</div>
            <div className="text-[9px] font-black uppercase tracking-[0.1em] text-gray-400">Stable</div>
          </div>
          <div className="rounded-xl border border-red-300/20 bg-red-500/10 px-2 py-2">
            <div className="text-lg font-black tabular-nums text-red-200">{declining.length}</div>
            <div className="text-[9px] font-black uppercase tracking-[0.1em] text-red-200/70">En baisse</div>
          </div>
        </div>
        {hasTrendSignal ? (
          <div className="mt-3 space-y-1.5">
            {improving.map(([code]) => (
              <div key={code} className="flex items-center gap-1.5 text-xs text-emerald-100">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-300" /> {labelFor(code)}
              </div>
            ))}
            {declining.map(([code]) => (
              <div key={code} className="flex items-center gap-1.5 text-xs text-red-100">
                <TrendingDown className="h-3.5 w-3.5 text-red-300" /> {labelFor(code)}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-xs text-gray-400">
            Premiere evaluation: l evolution apparaitra des votre prochaine evaluation complete.
          </p>
        )}
      </section>

      <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200/80">
          <Sparkles className="h-3.5 w-3.5" /> Analyse IA
        </div>
        {summary.explanation ? (
          <p className="mt-2 text-sm text-gray-200">{summary.explanation}</p>
        ) : null}
        {summary.strengths.length > 0 ? (
          <div className="mt-3">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-200/80">
              <Award className="h-3.5 w-3.5" /> Points forts
            </div>
            <ul className="mt-1.5 space-y-1.5">
              {summary.strengths.map((item, index) => (
                <li key={`strength-${index}`} className="text-xs text-gray-300">
                  <span className="font-black text-white">{item.skill}</span>
                  {item.comment ? ` — ${item.comment}` : ''}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {summary.weaknesses.length > 0 ? (
          <div className="mt-3">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-amber-200/80">
              <TrendingDown className="h-3.5 w-3.5" /> Points a renforcer
            </div>
            <ul className="mt-1.5 space-y-1.5">
              {summary.weaknesses.map((item, index) => (
                <li key={`weakness-${index}`} className="text-xs text-gray-300">
                  <span className="font-black text-white">{item.skill}</span>
                  {item.comment ? ` — ${item.comment}` : ''}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {summary.priorities.length > 0 ? (
          <div className="mt-3">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-200/80">
              <Target className="h-3.5 w-3.5" /> Priorites de travail
            </div>
            <ol className="mt-1.5 space-y-1.5">
              {summary.priorities.map((item, index) => (
                <li key={`priority-${index}`} className="flex gap-2 text-xs text-gray-300">
                  <span className="font-black text-cyan-200">{index + 1}.</span>
                  <span>
                    <span className="font-black text-white">{item.focus}</span>
                    {item.reason ? ` — ${item.reason}` : ''}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </section>

      {summary.potential ? (
        <section className="mt-4 rounded-2xl border border-cyan-300/25 bg-cyan-500/10 px-5 py-4">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100">
            <Sparkles className="h-3.5 w-3.5" /> Potentiel
          </div>
          <p className="mt-2 text-sm text-cyan-50">{summary.potential}</p>
        </section>
      ) : null}

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-gray-200 hover:bg-white/[0.08]"
        >
          <RotateCcw className="h-4 w-4" /> Refaire
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={programPending}
          data-testid="assessment-open-program"
          className="inline-flex flex-[1.4] items-center justify-center gap-2 rounded-xl border border-emerald-300/30 bg-emerald-500/15 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-emerald-50 hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {programPending ? (
            'Programme en cours...'
          ) : (
            <>
              <ArrowRight className="h-4 w-4" /> Decouvrir mon programme
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export const AssessmentView: React.FC<AssessmentViewProps> = ({
  definition,
  loadingDefinition,
  onBack,
  onSubmit,
  onRetryDefinition,
  pending,
  error,
  outcome,
  onRestart,
  onContinue,
  programPending,
  skillTrends,
}) => {
  const [draft, setDraft] = React.useState<AssessmentRawInputs>({});
  const [stepIndex, setStepIndex] = React.useState(0);

  React.useEffect(() => {
    if (definition) {
      setDraft(createEmptyAssessmentDraft(definition));
      setStepIndex(0);
    }
  }, [definition]);

  const skillLabels = React.useMemo(
    () => (definition ? buildSkillLabelMap(definition) : {}),
    [definition],
  );

  const skillCategories = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const skill of definition?.skills ?? []) {
      map[skill.code] = skill.category;
    }
    return map;
  }, [definition]);

  const exercises = definition?.exercises ?? [];
  const totalSteps = exercises.length;
  const exercise = exercises[stepIndex];
  const isLastStep = stepIndex === totalSteps - 1;

  const setFieldValue = (exerciseCode: string, fieldId: string, value: number) => {
    setDraft((current) => ({
      ...current,
      [exerciseCode]: { ...(current[exerciseCode] ?? {}), [fieldId]: value },
    }));
  };

  const handleRestart = () => {
    if (definition) {
      setDraft(createEmptyAssessmentDraft(definition));
    }
    setStepIndex(0);
    onRestart();
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060b10] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(34,197,94,0.2),transparent_30%),radial-gradient(circle_at_90%_18%,rgba(14,165,233,0.16),transparent_26%)]" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-200 hover:bg-white/[0.08]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Retour
          </button>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200/80">
            <BarChart3 className="h-3.5 w-3.5" /> Evaluation complete
          </span>
        </div>

        {outcome ? (
          <div className="mt-8">
            <ResultPanel
              outcome={outcome}
              skillLabels={skillLabels}
              skillCategories={skillCategories}
              skillTrends={skillTrends ?? {}}
              onRestart={handleRestart}
              onContinue={onContinue}
              programPending={programPending}
            />
          </div>
        ) : !definition || !exercise ? (
          <div className="mt-16 flex flex-1 flex-col items-center justify-center text-center">
            {loadingDefinition ? (
              <>
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-cyan-300" />
                <div className="mt-4 text-[11px] font-black uppercase tracking-[0.18em] text-gray-300">
                  Chargement de l evaluation
                </div>
              </>
            ) : (
              <>
                <div
                  className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100"
                  data-testid="assessment-definition-error"
                >
                  {error ?? 'Evaluation indisponible. Reessayez.'}
                </div>
                <button
                  type="button"
                  onClick={onRetryDefinition}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-500/15 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-cyan-50 hover:bg-cyan-500/25"
                >
                  <RotateCcw className="h-4 w-4" /> Reessayer
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="mt-8">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">
                <span>
                  Test {stepIndex + 1} / {totalSteps}
                </span>
                <span>{Math.round(((stepIndex + 1) / totalSteps) * 100)}%</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all"
                  style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
                />
              </div>
            </div>

            <div className="mt-6">
              <h1 className="text-2xl font-black uppercase tracking-[0.06em] text-white">{exercise.name}</h1>
              <p className="mt-2 text-sm text-gray-300">{exercise.description}</p>
              <p className="mt-1 text-sm font-semibold text-cyan-100">{exercise.instruction}</p>
            </div>

            <div className="mt-5 space-y-2.5">
              {exercise.fields.map((field) => (
                <Stepper
                  key={field.id}
                  field={field}
                  value={draft[exercise.code]?.[field.id] ?? field.min}
                  onChange={(value) => setFieldValue(exercise.code, field.id, value)}
                />
              ))}
            </div>

            {error ? (
              <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100" data-testid="assessment-error">
                {error}
              </div>
            ) : null}

            <div className="mt-auto pt-8">
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={stepIndex === 0 || pending}
                  onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-gray-200 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowLeft className="h-4 w-4" /> Precedent
                </button>
                {isLastStep ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => onSubmit(draft)}
                    data-testid="assessment-submit"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-300/30 bg-emerald-500/15 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-emerald-50 hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {pending ? 'Calcul en cours...' : (
                      <>
                        <Check className="h-4 w-4" /> Valider l evaluation
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => setStepIndex((index) => Math.min(totalSteps - 1, index + 1))}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-500/15 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-cyan-50 hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Suivant <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
