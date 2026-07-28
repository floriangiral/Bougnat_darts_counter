import { describe, expect, it } from 'vitest';
import {
  buildSkillLabelMap,
  createEmptyAssessmentDraft,
  type AssessmentDefinition,
} from '../../../src/domain/coach';

const definition: AssessmentDefinition = {
  version: 1,
  skills: [
    { code: 'scoring', label: 'Scoring', category: 'attack' },
    { code: 'consistency', label: 'Regularite', category: 'attack' },
    { code: 'pressure', label: 'Gestion de pression', category: 'mental' },
  ],
  exercises: [
    {
      code: 'scoring_20',
      order: 1,
      name: 'Scoring 20',
      description: 'Six volees sur le 20.',
      instruction: 'Note le total de chaque volee.',
      primarySkills: ['scoring', 'consistency'],
      fields: [
        { id: 'volley1', label: 'Volee 1', min: 0, max: 180, kind: 'volley' },
        { id: 'volley2', label: 'Volee 2', min: 0, max: 180, kind: 'volley' },
      ],
    },
    {
      code: 'pressure_leg',
      order: 2,
      name: 'Leg sous pression',
      description: 'Termine un leg de 501.',
      instruction: 'Compte le nombre de flechettes utilisees.',
      primarySkills: ['pressure'],
      fields: [{ id: 'darts', label: 'Flechettes', min: 6, max: 60, kind: 'count', step: 1 }],
    },
  ],
};

describe('createEmptyAssessmentDraft', () => {
  it('initializes every exercise field at its minimum', () => {
    const draft = createEmptyAssessmentDraft(definition);
    expect(draft.scoring_20.volley1).toBe(0);
    expect(draft.scoring_20.volley2).toBe(0);
    expect(draft.pressure_leg.darts).toBe(6);
  });

  it('creates an entry for every exercise in the definition', () => {
    const draft = createEmptyAssessmentDraft(definition);
    expect(Object.keys(draft)).toEqual(['scoring_20', 'pressure_leg']);
  });
});

describe('buildSkillLabelMap', () => {
  it('maps every skill code to its label', () => {
    const labels = buildSkillLabelMap(definition);
    expect(labels.scoring).toBe('Scoring');
    expect(labels.consistency).toBe('Regularite');
    expect(labels.pressure).toBe('Gestion de pression');
  });
});
