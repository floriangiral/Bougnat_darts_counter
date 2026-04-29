export type VoiceScoringStatus = 'idle' | 'listening' | 'processing' | 'error';
export type VoiceRuntimeIssue = 'microphone' | 'token' | 'connection' | 'timeout' | 'transcript' | 'audio';

export type DartMultiplier = 'single' | 'double' | 'triple';
export type DartsParseStatus = 'valid' | 'ambiguous' | 'invalid';
export type VoiceConfidenceTier = 'high' | 'medium' | 'low';
export type DeepgramUtteranceTrigger = 'speech_final' | 'utterance_end';
export type DartsSpeechIntent = 'turn_score' | 'remaining_score' | 'darts_sequence' | null;
export type DartsSpeechCoverage = 'full_turn' | 'partial_turn' | 'single_dart' | null;

export type ParseDartsSpeechContext = {
  confidence?: number | null;
  dartsAlreadyThrown?: number;
  currentRemainingScore?: number;
  startingScoreBeforeTurn?: number;
  maxDartsPerTurn?: number;
};

export interface ParsedDart {
  label: string;
  multiplier: DartMultiplier;
  value: number;
  score: number;
}

export interface DartsSpeechParseResult {
  transcript: string;
  normalizedTranscript: string;
  status: DartsParseStatus;
  mode: 'total' | 'darts' | 'remaining' | null;
  intent: DartsSpeechIntent;
  coverage: DartsSpeechCoverage;
  score: number | null;
  remainingScore: number | null;
  darts: ParsedDart[];
  consumedDarts: number | null;
  requiresConfirmation: boolean;
  reason: string | null;
  confidence: number | null;
  confidenceTier: VoiceConfidenceTier | null;
}

export interface DeepgramTokenResponse {
  accessToken: string;
  expiresIn: number;
}

export interface DeepgramUtterance {
  transcript: string;
  confidence: number;
  trigger: DeepgramUtteranceTrigger;
}

export interface VoiceScoreProposalState {
  transcript: string;
  result: DartsSpeechParseResult;
  trigger: DeepgramUtteranceTrigger;
  guidance?: string | null;
  prefillScore?: string | null;
}
