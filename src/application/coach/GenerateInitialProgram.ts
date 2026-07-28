import type { TrainingProgram } from './types';
import type { CoachProgramPort } from './ports';

/**
 * Generation automatique du programme d entrainement apres une evaluation.
 *
 * Le frontend n orchestre que l appel: le backend possede le niveau et l objectif
 * prioritaire issus de l evaluation, construit le programme (niveau, cycle 1,
 * seance 1) et renvoie le plan rendu ici. Aucun calcul cote frontend.
 */
export class GenerateInitialProgram {
  constructor(private readonly programPort: CoachProgramPort) {}

  async execute(goalCode?: string, horizonDays?: number): Promise<TrainingProgram> {
    return this.programPort.generateProgram(goalCode, horizonDays);
  }
}
