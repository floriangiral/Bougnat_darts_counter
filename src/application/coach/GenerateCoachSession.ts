import type { CoachSessionGenerationInput, CoachSessionPlan } from './types';
import { CoachAIService } from './CoachAIService';

export class GenerateCoachSession {
  constructor(private readonly coachService: CoachAIService) {}

  execute(command: CoachSessionGenerationInput): Promise<CoachSessionPlan> {
    return this.coachService.composeSession(command);
  }
}
