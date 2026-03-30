import { describe, expect, it } from 'vitest';

import { parseDartsSpeechTranscript } from '../../src/features/x01/voice/dartsSpeechParser';
import { normalizeDartsTranscript } from '../../src/features/x01/voice/dartsSpeechNormalizer';

describe('dartsSpeechNormalizer', () => {
  describe('variantes francaises', () => {
    it('normalise les tournures de score et de reste', () => {
      expect(normalizeDartsTranscript("J'ai fait 85")).toBe('je fais 85');
      expect(normalizeDartsTranscript('ca fait 60')).toBe('ca fait 60');
      expect(normalizeDartsTranscript('il me reste 121')).toBe('reste 121');
      expect(normalizeDartsTranscript('je laisse 32')).toBe('reste 32');
    });

    it('normalise bull et demi-bulle', () => {
      expect(normalizeDartsTranscript('plein centre')).toBe('bull');
      expect(normalizeDartsTranscript('centre')).toBe('bull');
      expect(normalizeDartsTranscript('bulle extérieure')).toBe('outer bull');
      expect(normalizeDartsTranscript('demi-bulle')).toBe('demi bulle');
    });

    it('normalise les variantes de rate', () => {
      expect(normalizeDartsTranscript('ratée')).toBe('rate');
      expect(normalizeDartsTranscript('manquée')).toBe('manque');
      expect(normalizeDartsTranscript('a cote')).toBe('acote');
      expect(normalizeDartsTranscript('dans le blanc')).toBe('blanc');
    });
  });
});

describe('dartsSpeechParser', () => {
  describe('scores totaux', () => {
    it('reconnait les annonces de score marque', () => {
      expect(parseDartsSpeechTranscript('100')).toMatchObject({
        status: 'valid',
        mode: 'total',
        intent: 'turn_score',
        score: 100,
      });

      expect(parseDartsSpeechTranscript("j'ai fait 85")).toMatchObject({
        status: 'valid',
        mode: 'total',
        intent: 'turn_score',
        score: 85,
      });

      expect(parseDartsSpeechTranscript('ca fait 60')).toMatchObject({
        status: 'valid',
        score: 60,
      });

      expect(parseDartsSpeechTranscript('je marque 41')).toMatchObject({
        status: 'valid',
        score: 41,
      });

      expect(parseDartsSpeechTranscript('28')).toMatchObject({
        status: 'valid',
        mode: 'total',
        intent: 'turn_score',
        score: 28,
      });
    });
  });

  describe('scores restants', () => {
    it('calcule le score marque a partir du reste annonce', () => {
      expect(parseDartsSpeechTranscript('reste 400', {
        startingScoreBeforeTurn: 501,
      })).toMatchObject({
        status: 'valid',
        mode: 'remaining',
        intent: 'remaining_score',
        score: 101,
        remainingScore: 400,
      });

      expect(parseDartsSpeechTranscript('il me reste 121', {
        startingScoreBeforeTurn: 141,
      })).toMatchObject({
        status: 'valid',
        score: 20,
        remainingScore: 121,
      });

      expect(parseDartsSpeechTranscript('je laisse 32', {
        startingScoreBeforeTurn: 72,
      })).toMatchObject({
        status: 'valid',
        score: 40,
        remainingScore: 32,
      });
    });
  });

  describe('sequences de flechettes completes', () => {
    it('reconnait les sequences completes classiques', () => {
      expect(parseDartsSpeechTranscript('triple 20 triple 20 double 10')).toMatchObject({
        status: 'valid',
        mode: 'darts',
        coverage: 'full_turn',
        score: 140,
      });

      expect(parseDartsSpeechTranscript('20 20 double 10')).toMatchObject({
        status: 'ambiguous',
        score: 60,
      });

      expect(parseDartsSpeechTranscript('bulle 20 1')).toMatchObject({
        status: 'ambiguous',
        score: 71,
      });

      expect(parseDartsSpeechTranscript('double 16 rate rate')).toMatchObject({
        status: 'valid',
        score: 32,
      });

      expect(parseDartsSpeechTranscript('48 48 48')).toMatchObject({
        status: 'ambiguous',
        mode: 'darts',
        coverage: 'full_turn',
        score: 144,
      });

      expect(parseDartsSpeechTranscript('60 18 20')).toMatchObject({
        status: 'ambiguous',
        mode: 'darts',
        coverage: 'full_turn',
        score: 98,
      });

      expect(parseDartsSpeechTranscript('60 18 0')).toMatchObject({
        status: 'ambiguous',
        mode: 'darts',
        coverage: 'full_turn',
        score: 78,
      });
    });
  });

  describe('sequences partielles avec contexte', () => {
    it('comprend une seule fleche restante', () => {
      expect(parseDartsSpeechTranscript('double 10', {
        dartsAlreadyThrown: 2,
        currentRemainingScore: 121,
        startingScoreBeforeTurn: 141,
      })).toMatchObject({
        status: 'valid',
        mode: 'darts',
        coverage: 'single_dart',
        score: 20,
        consumedDarts: 1,
      });

      expect(parseDartsSpeechTranscript('rate', {
        dartsAlreadyThrown: 2,
      })).toMatchObject({
        status: 'valid',
        coverage: 'single_dart',
        score: 0,
      });
    });

    it('comprend deux flechettes restantes', () => {
      expect(parseDartsSpeechTranscript('triple 20 5', {
        dartsAlreadyThrown: 1,
        currentRemainingScore: 121,
        startingScoreBeforeTurn: 141,
      })).toMatchObject({
        status: 'ambiguous',
        coverage: 'partial_turn',
        score: 65,
        consumedDarts: 2,
      });

      expect(parseDartsSpeechTranscript('20 5', {
        dartsAlreadyThrown: 1,
      })).toMatchObject({
        status: 'ambiguous',
        coverage: 'partial_turn',
        score: 25,
      });
    });

    it('reste explicite sur une annonce partielle sans contexte', () => {
      expect(parseDartsSpeechTranscript('double 10', {
        dartsAlreadyThrown: 0,
      })).toMatchObject({
        status: 'ambiguous',
        coverage: 'single_dart',
        score: 20,
      });
    });
  });

  describe('cas invalides', () => {
    it('rejette les incoherences metier', () => {
      expect(parseDartsSpeechTranscript('double bull')).toMatchObject({
        status: 'invalid',
        reason: 'Bull et demi-bulle ne peuvent pas avoir de multiplicateur.',
      });

      expect(parseDartsSpeechTranscript('triple 25')).toMatchObject({
        status: 'invalid',
        reason: 'Bull et demi-bulle ne peuvent pas avoir de multiplicateur.',
      });

      expect(parseDartsSpeechTranscript('triple 20 triple 20 triple 20', {
        dartsAlreadyThrown: 1,
      })).toMatchObject({
        status: 'invalid',
        reason: 'Plus de flechettes annoncees que possible dans le contexte du tour.',
      });

      expect(parseDartsSpeechTranscript('triple 20', {
        currentRemainingScore: 32,
      })).toMatchObject({
        status: 'invalid',
        reason: 'Score annonce superieur au score restant.',
      });

      expect(parseDartsSpeechTranscript('48 48 48', {
        currentRemainingScore: 100,
      })).toMatchObject({
        status: 'invalid',
        reason: 'Score annonce superieur au score restant.',
      });

      expect(parseDartsSpeechTranscript('reste 80', {
        startingScoreBeforeTurn: 60,
      })).toMatchObject({
        status: 'invalid',
        reason: 'Score restant annonce incoherent avec le score de depart.',
      });
    });
  });

  describe('cas ambigus', () => {
    it('signale les sequences sous-specifiees', () => {
      expect(parseDartsSpeechTranscript('20')).toMatchObject({
        status: 'valid',
        mode: 'total',
        intent: 'turn_score',
        score: 20,
      });

      expect(parseDartsSpeechTranscript('20 20')).toMatchObject({
        status: 'ambiguous',
        coverage: 'partial_turn',
      });

      expect(parseDartsSpeechTranscript('5 5')).toMatchObject({
        status: 'ambiguous',
      });

      expect(parseDartsSpeechTranscript('triple vingt brouhaha cinq', {
        confidence: 0.78,
      })).toMatchObject({
        status: 'ambiguous',
      });
    });
  });

  describe('confiance', () => {
    it('continue a exploiter les seuils Deepgram', () => {
      expect(parseDartsSpeechTranscript('140', { confidence: 0.9 })).toMatchObject({
        status: 'valid',
        confidenceTier: 'high',
      });

      expect(parseDartsSpeechTranscript('140', { confidence: 0.7 })).toMatchObject({
        status: 'ambiguous',
        confidenceTier: 'medium',
      });

      expect(parseDartsSpeechTranscript('140', { confidence: 0.5 })).toMatchObject({
        status: 'invalid',
        confidenceTier: 'low',
      });
    });
  });
});
