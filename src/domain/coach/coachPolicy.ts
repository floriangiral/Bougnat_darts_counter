import type { ExerciseCatalogItem } from './exerciseCatalog';
import { indexExercisesById } from './exerciseCatalog';

export class CoachPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CoachPolicyError';
  }
}

export type SessionValidationConstraints = {
  maxDurationMinutes?: number;
  minExercises?: number;
  maxExercises?: number;
};

export const validateExerciseSelection = (
  selectedExerciseIds: string[],
  catalog: ExerciseCatalogItem[],
  constraints: SessionValidationConstraints,
): ExerciseCatalogItem[] => {
  if (!selectedExerciseIds.length) {
    throw new CoachPolicyError('Aucun exercice selectionne.');
  }

  const uniqueIds = new Set(selectedExerciseIds);
  if (uniqueIds.size !== selectedExerciseIds.length) {
    throw new CoachPolicyError('La seance contient des exercices dupliques.');
  }

  const byId = indexExercisesById(catalog);
  const selected = selectedExerciseIds.map((id) => {
    const exercise = byId.get(id);
    if (!exercise) {
      throw new CoachPolicyError(`Exercice inconnu: ${id}`);
    }
    return exercise;
  });

  if (constraints.minExercises && selected.length < constraints.minExercises) {
    throw new CoachPolicyError('La seance ne contient pas assez d exercices.');
  }

  if (constraints.maxExercises && selected.length > constraints.maxExercises) {
    throw new CoachPolicyError('La seance contient trop d exercices.');
  }

  const totalDuration = selected.reduce((total, exercise) => total + exercise.durationMinutes, 0);
  if (constraints.maxDurationMinutes && totalDuration > constraints.maxDurationMinutes) {
    throw new CoachPolicyError('La duree totale depasse la contrainte maximale.');
  }

  return selected;
};
