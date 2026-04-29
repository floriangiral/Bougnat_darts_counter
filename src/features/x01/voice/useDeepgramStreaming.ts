// Spec: spec:counter/voice-scoring-reliability
import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchDeepgramAccessToken } from './deepgramClient';
import type {
  DeepgramUtterance,
  DeepgramUtteranceTrigger,
  VoiceRuntimeIssue,
  VoiceScoringStatus,
} from './dartsSpeechTypes';
import type { DeepgramLiveConnection } from './deepgramLiveTypes';
import { VOICE_SCORING_TIMEOUT_MS } from './voiceConfig';
import { cleanupAudioResources, createBrowserAudioContext, ensureAudioCaptureReady as ensureAudioCaptureGraphReady } from './audioContextManager';
import { cleanupDeepgramConnection, connectDeepgramLive } from './deepgramConnectionManager';
import {
  buildVoiceRuntimeIssueMessage,
  createNextVoiceAttempt,
  isVoiceAttemptCurrent,
  resolveVoiceStartFailureCause,
  type VoiceAttempt,
} from './voiceSessionModel';
import { logVoiceDebug, logVoiceError } from './voiceStreamingLogger';
import { appendBufferedPcmChunk, buildDeepgramUtterance, describeCaughtError, type FinalChunk } from './voiceStreamingModel';

type UseDeepgramStreamingOptions = {
  enabled: boolean;
  sessionKey: string;
  onUtterance: (payload: DeepgramUtterance) => void;
};

type StartTimings = {
  log: (step: string, extra?: Record<string, unknown>) => void;
  startAt: number;
};

const TARGET_SAMPLE_RATE = 16000;
const MAX_BUFFERED_PCM_CHUNKS = 24;
const PCM_CAPTURE_WORKLET_PATH = '/pcmCaptureWorklet.js';

export function useDeepgramStreaming({ enabled, onUtterance, sessionKey }: UseDeepgramStreamingOptions) {
  const [state, setState] = useState<VoiceScoringStatus>('idle');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [issue, setIssue] = useState<VoiceRuntimeIssue | null>(null);
  const stateRef = useRef<VoiceScoringStatus>('idle');
  const liveTranscriptRef = useRef('');
  const liveConfidenceRef = useRef(0);
  const sessionKeyRef = useRef(sessionKey);
  const activeAttemptRef = useRef<VoiceAttempt>({ id: 0, sessionKey });
  const tokenAbortControllerRef = useRef<AbortController | null>(null);

  const connectionRef = useRef<DeepgramLiveConnection | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const audioWorkletLoadedRef = useRef(false);
  const socketReadyRef = useRef(false);
  const bufferedPcmChunksRef = useRef<Int16Array[]>([]);
  const finalChunksRef = useRef<FinalChunk[]>([]);
  const utteranceClosedRef = useRef(false);
  const listeningTimeoutRef = useRef<number | null>(null);

  const clearUtteranceBuffer = useCallback(() => {
    finalChunksRef.current = [];
    utteranceClosedRef.current = false;
    liveTranscriptRef.current = '';
    liveConfidenceRef.current = 0;
    bufferedPcmChunksRef.current = [];
    socketReadyRef.current = false;
    setLiveTranscript('');
  }, []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    liveTranscriptRef.current = liveTranscript;
  }, [liveTranscript]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void fetchDeepgramAccessToken().catch(() => {
      // silent prefetch failure; actual start path will surface the error
    });
  }, [enabled]);

  useEffect(() => {
    if (!enabled || audioContextRef.current) {
      return;
    }

    try {
      audioContextRef.current = createBrowserAudioContext();
      logVoiceDebug('pre-created audio context', {
        state: audioContextRef.current.state,
        sampleRate: audioContextRef.current.sampleRate,
      });
    } catch {
      // ignore prewarm failures; start path will surface actual errors
    }
  }, [enabled]);

  const clearListeningTimeout = useCallback(() => {
    if (listeningTimeoutRef.current !== null) {
      window.clearTimeout(listeningTimeoutRef.current);
      listeningTimeoutRef.current = null;
    }
  }, []);

  const abortTokenRequest = useCallback(() => {
    tokenAbortControllerRef.current?.abort();
    tokenAbortControllerRef.current = null;
  }, []);

  const isAttemptActive = useCallback((attempt: VoiceAttempt) => (
    isVoiceAttemptCurrent(activeAttemptRef.current, attempt)
  ), []);

  const logStaleAttempt = useCallback((attempt: VoiceAttempt, step: string) => {
    logVoiceDebug('stale voice attempt ignored', {
      step,
      attemptId: attempt.id,
      sessionKey: attempt.sessionKey,
      activeAttemptId: activeAttemptRef.current.id,
      activeSessionKey: activeAttemptRef.current.sessionKey,
    });
  }, []);

  const invalidateActiveAttempt = useCallback((reason: string) => {
    abortTokenRequest();
    activeAttemptRef.current = createNextVoiceAttempt(activeAttemptRef.current, sessionKeyRef.current);
    logVoiceDebug('voice attempt invalidated', {
      reason,
      attemptId: activeAttemptRef.current.id,
      sessionKey: activeAttemptRef.current.sessionKey,
    });
    return activeAttemptRef.current;
  }, [abortTokenRequest]);

  const cleanupAudio = useCallback((options?: { closeContext?: boolean }) => {
    cleanupAudioResources({
      mediaStreamRef,
      audioContextRef,
      sourceRef,
      workletNodeRef,
      gainRef,
      audioWorkletLoadedRef,
      bufferedPcmChunksRef,
    }, options);
  }, []);

  const cleanupSocket = useCallback(() => {
    cleanupDeepgramConnection({ connectionRef, socketReadyRef });
  }, []);

  const flushBufferedAudio = useCallback(() => {
    if (!socketReadyRef.current || !connectionRef.current || connectionRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    for (const chunk of bufferedPcmChunksRef.current) {
      connectionRef.current.sendMedia(chunk);
    }

    bufferedPcmChunksRef.current = [];
  }, []);

  const sendOrBufferAudioChunk = useCallback((pcm: Int16Array) => {
    if (socketReadyRef.current && connectionRef.current?.readyState === WebSocket.OPEN) {
      connectionRef.current.sendMedia(pcm);
      return;
    }

    bufferedPcmChunksRef.current = appendBufferedPcmChunk(
      bufferedPcmChunksRef.current,
      pcm,
      MAX_BUFFERED_PCM_CHUNKS,
    );
  }, []);

  const handleRuntimeFailure = useCallback((message: string, nextIssue: VoiceRuntimeIssue, attempt?: VoiceAttempt) => {
    if (attempt && !isAttemptActive(attempt)) {
      logStaleAttempt(attempt, 'runtime-failure');
      return;
    }

    logVoiceError('runtime failure', {
      message,
      issue: nextIssue,
      state: stateRef.current,
    });
    invalidateActiveAttempt('runtime-failure');
    clearListeningTimeout();
    abortTokenRequest();
    setError(message);
    setIssue(nextIssue);
    setState('error');
    clearUtteranceBuffer();
    cleanupAudio();
    cleanupSocket();
  }, [abortTokenRequest, cleanupAudio, cleanupSocket, clearListeningTimeout, clearUtteranceBuffer, invalidateActiveAttempt, isAttemptActive, logStaleAttempt]);

  const reset = useCallback(() => {
    invalidateActiveAttempt('reset');
    clearListeningTimeout();
    abortTokenRequest();
    cleanupAudio();
    cleanupSocket();
    clearUtteranceBuffer();
    setError(null);
    setIssue(null);
    setState('idle');
  }, [abortTokenRequest, cleanupAudio, cleanupSocket, clearListeningTimeout, clearUtteranceBuffer, invalidateActiveAttempt]);

  const emitUtterance = useCallback((trigger: DeepgramUtteranceTrigger, attempt: VoiceAttempt) => {
    if (!isAttemptActive(attempt)) {
      logStaleAttempt(attempt, 'emit-utterance');
      return;
    }

    if (utteranceClosedRef.current) {
      return;
    }

    const utterance = buildDeepgramUtterance(
      finalChunksRef.current,
      liveTranscriptRef.current,
      liveConfidenceRef.current,
      trigger,
    );

    if (!utterance) {
      return;
    }

    try {
      utteranceClosedRef.current = true;
      onUtterance(utterance);
      finalChunksRef.current = [];
      setLiveTranscript('');
      setState('processing');
      window.setTimeout(() => {
        if (!isAttemptActive(attempt)) {
          logStaleAttempt(attempt, 'emit-utterance-post-process');
          return;
        }

        setState((current) => (current === 'processing' ? 'listening' : current));
      }, 0);
    } catch {
      handleRuntimeFailure(
        buildVoiceRuntimeIssueMessage('transcript'),
        'transcript',
        attempt,
      );
    }
  }, [handleRuntimeFailure, isAttemptActive, logStaleAttempt, onUtterance]);

  const stop = useCallback(() => {
    clearListeningTimeout();
    try {
      if (connectionRef.current?.readyState === WebSocket.OPEN) {
        connectionRef.current.sendCloseStream({ type: 'CloseStream' });
      }
    } catch {
      // ignore send failures during shutdown
    }

    reset();
  }, [clearListeningTimeout, reset]);

  const ensureAudioCaptureReady = useCallback(async (mediaStream: MediaStream, timings: StartTimings, attempt: VoiceAttempt) => {
    await ensureAudioCaptureGraphReady({
      refs: {
        mediaStreamRef,
        audioContextRef,
        sourceRef,
        workletNodeRef,
        gainRef,
        audioWorkletLoadedRef,
        bufferedPcmChunksRef,
      },
      mediaStream,
      onAudioChunk: (pcm) => {
        if (!isAttemptActive(attempt)) {
          logStaleAttempt(attempt, 'audio-chunk');
          return;
        }

        sendOrBufferAudioChunk(pcm);
      },
      onRuntimeFailure: () => handleRuntimeFailure(
        buildVoiceRuntimeIssueMessage('audio'),
        'audio',
        attempt,
      ),
      onReady: () => {
        if (!isAttemptActive(attempt)) {
          logStaleAttempt(attempt, 'audio-ready');
          return;
        }

        setState('listening');
      },
      pcmCaptureWorkletPath: PCM_CAPTURE_WORKLET_PATH,
      targetSampleRate: TARGET_SAMPLE_RATE,
      logTiming: timings.log,
    });
  }, [handleRuntimeFailure, isAttemptActive, logStaleAttempt, sendOrBufferAudioChunk]);

  useEffect(() => {
    if (sessionKeyRef.current === sessionKey) {
      return;
    }

    sessionKeyRef.current = sessionKey;
    invalidateActiveAttempt('session-key-changed');
    clearListeningTimeout();
    cleanupAudio();
    cleanupSocket();
    clearUtteranceBuffer();
    setError(null);
    setIssue(null);
    setState('idle');
  }, [cleanupAudio, cleanupSocket, clearListeningTimeout, clearUtteranceBuffer, invalidateActiveAttempt, sessionKey]);

  const start = useCallback(async () => {
    const timings = createStartTimings();
    logVoiceDebug('start requested', {
      enabled,
      state: stateRef.current,
    });

    if (!enabled || stateRef.current === 'listening' || stateRef.current === 'processing') {
      logVoiceDebug('start ignored', {
        enabled,
        state: stateRef.current,
      });
      return;
    }

    const attempt = invalidateActiveAttempt('start-requested');
    clearUtteranceBuffer();
    setError(null);
    setIssue(null);
    setState('processing');

    try {
      logVoiceDebug('requesting token and microphone');
      const tokenAbortController = new AbortController();
      tokenAbortControllerRef.current = tokenAbortController;
      const tokenPromise = fetchDeepgramAccessToken(tokenAbortController.signal)
        .then((token) => {
          timings.log('token-ready');
          return token;
        })
        .finally(() => {
          if (tokenAbortControllerRef.current === tokenAbortController) {
            tokenAbortControllerRef.current = null;
          }
        });

      const mediaStreamPromise = navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
          },
        }).then((mediaStream) => {
        timings.log('getUserMedia-ready', {
          audioTracks: mediaStream.getAudioTracks().length,
        });
        return mediaStream;
      });

      const mediaStream = await mediaStreamPromise;
      if (!isAttemptActive(attempt)) {
        logStaleAttempt(attempt, 'media-stream-ready');
        mediaStream.getTracks().forEach((track) => track.stop());
        return;
      }

      const audioSetupPromise = ensureAudioCaptureReady(mediaStream, timings, attempt);
      const { accessToken } = await tokenPromise;

      if (!isAttemptActive(attempt)) {
        logStaleAttempt(attempt, 'token-ready');
        cleanupAudio();
        return;
      }

      logVoiceDebug('token and microphone ready', {
        hasAccessToken: Boolean(accessToken),
        audioTracks: mediaStream.getAudioTracks().length,
      });
      const connection = await connectDeepgramLive(
        { connectionRef, socketReadyRef },
        accessToken,
        {
          onOpen: () => {
            if (!isAttemptActive(attempt)) {
              logStaleAttempt(attempt, 'websocket-open');
              return;
            }

            logVoiceDebug('websocket open');
            socketReadyRef.current = true;
            timings.log('websocket-open');
            flushBufferedAudio();
          },
          onMessage: (payload) => {
            if (!isAttemptActive(attempt)) {
              logStaleAttempt(attempt, 'websocket-message');
              return;
            }

            try {
              logVoiceDebug('websocket message', {
                type: payload.type,
                isFinal: 'is_final' in payload ? payload.is_final : undefined,
                speechFinal: 'speech_final' in payload ? payload.speech_final : undefined,
              });

              if (payload.type === 'SpeechStarted') {
                utteranceClosedRef.current = false;
                setState('listening');
                return;
              }

              if (payload.type === 'UtteranceEnd') {
                emitUtterance('utterance_end', attempt);
                return;
              }

              if (payload.type === 'Error') {
                logVoiceError('deepgram error payload', {
                  error: payload.error || 'Unknown Deepgram error',
                });
                handleRuntimeFailure(
                  payload.error || buildVoiceRuntimeIssueMessage('connection'),
                  'connection',
                  attempt,
                );
                return;
              }

              if (payload.type !== 'Results') {
                return;
              }

              const alternative = payload.channel?.alternatives?.[0];
              const transcript = alternative?.transcript?.trim() || '';
              if (!transcript) {
                return;
              }

              if (payload.is_final) {
                finalChunksRef.current.push({
                  transcript,
                  confidence: alternative?.confidence ?? 0,
                });
                liveConfidenceRef.current = alternative?.confidence ?? 0;
                setLiveTranscript(transcript);
              } else {
                utteranceClosedRef.current = false;
                liveConfidenceRef.current = alternative?.confidence ?? 0;
                setLiveTranscript(transcript);
              }

              if (payload.speech_final) {
                emitUtterance('speech_final', attempt);
              }
            } catch (error) {
              logVoiceError('invalid websocket message', {
                message: describeCaughtError(error),
                type: payload.type,
              });
              handleRuntimeFailure(
                buildVoiceRuntimeIssueMessage('transcript'),
                'transcript',
                attempt,
              );
            }
          },
          onError: (caughtError) => {
            if (!isAttemptActive(attempt)) {
              logStaleAttempt(attempt, 'websocket-error');
              return;
            }

            logVoiceError('websocket error event', {
              message: describeCaughtError(caughtError),
            });
            handleRuntimeFailure(
              buildVoiceRuntimeIssueMessage('connection'),
              'connection',
              attempt,
            );
          },
          onClose: () => {
            if (!isAttemptActive(attempt)) {
              logStaleAttempt(attempt, 'websocket-close');
              return;
            }

            logVoiceDebug('websocket close', {
              previousState: stateRef.current,
            });
            clearListeningTimeout();
            cleanupAudio();
            connectionRef.current = null;
            setState((current) => (current === 'error' ? current : 'idle'));
          },
        },
      );

      if (!isAttemptActive(attempt)) {
        logStaleAttempt(attempt, 'websocket-connected');
        connection.close();
        cleanupAudio();
        return;
      }

      timings.log('websocket-client-created');

      clearListeningTimeout();
      listeningTimeoutRef.current = window.setTimeout(() => {
        if (!isAttemptActive(attempt)) {
          logStaleAttempt(attempt, 'listening-timeout');
          return;
        }

        logVoiceDebug('listening timeout reached', {
          timeoutMs: VOICE_SCORING_TIMEOUT_MS,
          finalChunks: finalChunksRef.current.length,
          liveTranscript: liveTranscriptRef.current,
        });

        if (finalChunksRef.current.length > 0 || liveTranscriptRef.current.trim()) {
          emitUtterance('utterance_end', attempt);
        }

        invalidateActiveAttempt('listening-timeout');

        try {
          if (connectionRef.current?.readyState === WebSocket.OPEN) {
            connectionRef.current.sendCloseStream({ type: 'CloseStream' });
          }
        } catch {
          // ignore close stream failures during timeout shutdown
        }

        abortTokenRequest();
        cleanupAudio();
        cleanupSocket();
        setError(buildVoiceRuntimeIssueMessage('timeout'));
        setIssue('timeout');
        setState('error');
      }, VOICE_SCORING_TIMEOUT_MS);

      await audioSetupPromise;
      if (!isAttemptActive(attempt)) {
        logStaleAttempt(attempt, 'audio-setup-complete');
        return;
      }

      timings.log('start-ready');
    } catch (caughtError) {
      if (!isAttemptActive(attempt)) {
        logStaleAttempt(attempt, 'start-catch');
        return;
      }

      if (caughtError instanceof DOMException && caughtError.name === 'AbortError') {
        logVoiceDebug('voice start aborted', {
          attemptId: attempt.id,
          sessionKey: attempt.sessionKey,
        });
        return;
      }

      logVoiceError('start failed', {
        message: describeCaughtError(caughtError),
      });
      const nextIssue = resolveVoiceStartFailureCause(caughtError);
      const fallbackMessage = caughtError instanceof Error ? caughtError.message : buildVoiceRuntimeIssueMessage(nextIssue);
      handleRuntimeFailure(fallbackMessage, nextIssue, attempt);
    }
  }, [
    abortTokenRequest,
    clearListeningTimeout,
    clearUtteranceBuffer,
    emitUtterance,
    enabled,
    ensureAudioCaptureReady,
    flushBufferedAudio,
    handleRuntimeFailure,
    invalidateActiveAttempt,
    isAttemptActive,
    logStaleAttempt,
    cleanupAudio,
    cleanupSocket,
  ]);

  useEffect(() => {
    if (!enabled) {
      reset();
    }

    return () => {
      abortTokenRequest();
      cleanupAudio({ closeContext: true });
      cleanupSocket();
    };
  }, [abortTokenRequest, cleanupAudio, cleanupSocket, enabled, reset]);

  return {
    error,
    issue,
    isListening: state === 'listening',
    liveTranscript,
    reset,
    start,
    state,
    stop,
  };
}

function createStartTimings(): StartTimings {
  const startAt = performance.now();

  return {
    startAt,
    log(step, extra) {
      logVoiceDebug('timing', {
        step,
        elapsedMs: Math.round(performance.now() - startAt),
        ...extra,
      });
    },
  };
}
