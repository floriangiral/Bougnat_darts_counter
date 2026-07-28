/**
 * Types de l evaluation complete.
 *
 * La batterie (epreuves, competences, baremes) est data-driven: elle est
 * chargee depuis le backend (source de verite unique) et le calcul des scores
 * est realise cote backend. Le frontend ne capture que des entrees brutes.
 */

export type AssessmentInputKind = 'count' | 'volley';

export type AssessmentInputField = {
  id: string;
  label: string;
  min: number;
  max: number;
  kind: AssessmentInputKind;
  step?: number;
};

export type AssessmentSkillDef = {
  code: string;
  label: string;
  category: string;
};

export type AssessmentExerciseDef = {
  code: string;
  order: number;
  name: string;
  description: string;
  instruction: string;
  primarySkills: string[];
  fields: AssessmentInputField[];
};

export type AssessmentDefinition = {
  version: number;
  skills: AssessmentSkillDef[];
  exercises: AssessmentExerciseDef[];
};

export type AssessmentLevel = 'beginner' | 'intermediate' | 'advanced';

/** Entrees brutes captees, indexees par code d epreuve puis par id de champ. */
export type AssessmentRawInputs = Record<string, Record<string, number>>;

/**
 * Initialise un brouillon vide a partir de la definition data-driven:
 * chaque champ demarre a sa borne minimale.
 */
export const createEmptyAssessmentDraft = (definition: AssessmentDefinition): AssessmentRawInputs => {
  const draft: AssessmentRawInputs = {};
  for (const exercise of definition.exercises) {
    const fields: Record<string, number> = {};
    for (const field of exercise.fields) {
      fields[field.id] = field.min;
    }
    draft[exercise.code] = fields;
  }
  return draft;
};

/** Table de correspondance code de competence -> libelle, issue de la definition. */
export const buildSkillLabelMap = (definition: AssessmentDefinition): Record<string, string> => {
  const labels: Record<string, string> = {};
  for (const skill of definition.skills) {
    labels[skill.code] = skill.label;
  }
  return labels;
};
