import { describe, expect, it } from 'vitest';

import {
  buildVoiceProposalGuidance,
  buildVoiceScoreProposal,
  shouldPrefillVoiceProposalScore,
} from '../../../src/features/x01/voice/voiceProposalModel';

describe('voice proposal model', () => {
  it('prefills simple total and remaining-score proposals', () => {
    expect(buildVoiceScoreProposal({
      confidence: 0.92,
      context: {
        currentRemainingScore: 301,
        startingScoreBeforeTurn: 301,
      },
      transcript: '100',
      trigger: 'speech_final',
    }).prefillScore).toBe('100');

    expect(buildVoiceScoreProposal({
      confidence: 0.92,
      context: {
        currentRemainingScore: 72,
        startingScoreBeforeTurn: 72,
      },
      transcript: 'reste 32',
      trigger: 'utterance_end',
    }).prefillScore).toBe('40');
  });

  it('does not prefill ambiguous darts sequences', () => {
    const proposal = buildVoiceScoreProposal({
      confidence: 0.84,
      context: {
        currentRemainingScore: 141,
        dartsAlreadyThrown: 1,
        startingScoreBeforeTurn: 141,
      },
      transcript: 'triple 20 5',
      trigger: 'speech_final',
    });

    expect(proposal.result.status).toBe('ambiguous');
    expect(proposal.prefillScore).toBeNull();
    expect(proposal.guidance).toBe('Annonce partielle reconnue, confirmation explicite requise.');
  });

  it('marks checkout-style remaining announcements with business guidance', () => {
    const proposal = buildVoiceScoreProposal({
      confidence: 0.91,
      context: {
        currentRemainingScore: 72,
        startingScoreBeforeTurn: 72,
      },
      transcript: 'reste 32',
      trigger: 'speech_final',
    });

    expect(proposal.result.reason).toBe('Annonce de checkout reconnue, verification explicite recommandee.');
  });

  it('exposes prefill policy as a focused predicate', () => {
    expect(shouldPrefillVoiceProposalScore({
      confidence: 0.95,
      confidenceTier: 'high',
      consumedDarts: 3,
      coverage: 'full_turn',
      darts: [],
      intent: 'turn_score',
      mode: 'total',
      normalizedTranscript: '100',
      reason: null,
      remainingScore: 201,
      requiresConfirmation: false,
      score: 100,
      status: 'valid',
      transcript: '100',
    })).toBe(true);

    expect(buildVoiceProposalGuidance({
      confidence: 0.81,
      confidenceTier: 'medium',
      consumedDarts: 2,
      coverage: 'partial_turn',
      darts: [],
      intent: 'darts_sequence',
      mode: 'darts',
      normalizedTranscript: '20 5',
      reason: 'Scores de flechettes annonces a confirmer.',
      remainingScore: 116,
      requiresConfirmation: true,
      score: 25,
      status: 'ambiguous',
      transcript: '20 5',
    }, {
      currentRemainingScore: 141,
      dartsAlreadyThrown: 1,
      startingScoreBeforeTurn: 141,
    })).toBe('Annonce partielle reconnue, confirmation explicite requise.');
  });
});