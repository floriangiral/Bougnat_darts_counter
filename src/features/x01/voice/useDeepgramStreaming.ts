// Spec: spec:counter/voice-scoring-reliability
import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchDeepgramAccessToken } from './deepgramClient';
import type {
  DeepgramUtterance,
  DeepgramUtteranceTrigger,
  VoiceScoringStatus,
} from './dartsSpeechTypes';
import type { DeepgramLiveConnection } from './deepgramLiveTypes';
import { VOICE_SCORING_TIMEOUT_MS } from './voiceConfig';
import { cleanupAudioResources, createBrowserAudioContext, ensureAudioCaptureReady as ensureAudioCaptureGraphReady } from './audioContextManager';
import { cleanupDeepgramConnection, connectDeepgramLive } from './deepgramConnectionManager';
import { logVoiceDebug, logVoiceError } from './voiceStreamingLogger';
import { appendBufferedPcmChunk, buildDeepgramUtterance, describeCaughtError, type FinalChunk } from './voiceStreamingModel';

type UseDeepgramStreamingOptions = {
  enabled: boolean;
  onUtterance: (payload: DeepgramUtterance) => void;
};

type StartTimings = {
  log: (step: string, extra?: Record<string, unknown>) => void;
  startAt: number;
};

const TARGET_SAMPLE_RATE = 16000;
const MAX_BUFFERED_PCM_CHUNKS = 24;
const PCM_CAPTURE_WORKLET_PATH = '/pcmCaptureWorklet.js';

export function useDeepgramStreaming({ enabled, onUtterance }: UseDeepgramStreamingOptions) {
  const [state, setState] = useState<VoiceScoringStatus>('idle');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const stateRef = useRef<VoiceScoringStatus>('idle');
  const liveTranscriptRef = useRef('');
  const liveConfidenceRef = useRef(0);

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

  const handleRuntimeFailure = useCallback((message: string) => {
    logVoiceError('runtime failure', {
      message,
      state: stateRef.current,
    });
    clearListeningTimeout();
    setError(message);
    setState('error');
    clearUtteranceBuffer();
    cleanupAudio();
    cleanupSocket();
  }, [clearListeningTimeout, clearUtteranceBuffer, cleanupAudio, cleanupSocket]);

  const reset = useCallback(() => {
    clearListeningTimeout();
    cleanupAudio();
    cleanupSocket();
    clearUtteranceBuffer();
    setError(null);
    setState('idle');
  }, [clearListeningTimeout, cleanupAudio, cleanupSocket, clearUtteranceBuffer]);

  const emitUtterance = useCallback((trigger: DeepgramUtteranceTrigger) => {
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
        setState((current) => (current === 'processing' ? 'listening' : current));
      }, 0);
    } catch {
      handleRuntimeFailure('Impossible de traiter la transcription vocale.');
    }
  }, [handleRuntimeFailure, onUtterance]);

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

  const ensureAudioCaptureReady = useCallback(async (mediaStream: MediaStream, timings: StartTimings) => {
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
      onAudioChunk: sendOrBufferAudioChunk,
      onRuntimeFailure: () => handleRuntimeFailure('Impossible de streamer l audio micro.'),
      onReady: () => setState('listening'),
      pcmCaptureWorkletPath: PCM_CAPTURE_WORKLET_PATH,
      targetSampleRate: TARGET_SAMPLE_RATE,
      logTiming: timings.log,
    });
  }, [cleanupAudio, handleRuntimeFailure, sendOrBufferAudioChunk]);

  const start = useCallback(async () => {
    const timings = createStartTimings();
    logVoiceDebug('start requested', {
      enabled,
      state: stateRef.current,
    });

    if (!enabled || state === 'listening') {
      logVoiceDebug('start ignored', {
        enabled,
        state: stateRef.current,
      });
      return;
    }

    clearUtteranceBuffer();
    setError(null);
    setState('processing');

    try {
      logVoiceDebug('requesting token and microphone');
      const tokenPromise = fetchDeepgramAccessToken().then((token) => {
        timings.log('token-ready');
        return token;
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
      const audioSetupPromise = ensureAudioCaptureReady(mediaStream, timings);
      const { accessToken } = await tokenPromise;

      logVoiceDebug('token and microphone ready', {
        hasAccessToken: Boolean(accessToken),
        audioTracks: mediaStream.getAudioTracks().length,
      });
      const connection = await connectDeepgramLive(
        { connectionRef, socketReadyRef },
        accessToken,
        {
          onOpen: () => {
            logVoiceDebug('websocket open');
            socketReadyRef.current = true;
            timings.log('websocket-open');
            flushBufferedAudio();
          },
          onMessage: (payload) => {
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
                emitUtterance('utterance_end');
                return;
              }

              if (payload.type === 'Error') {
                logVoiceError('deepgram error payload', {
                  error: payload.error || 'Unknown Deepgram error',
                });
                handleRuntimeFailure(payload.error || 'Erreur Deepgram.');
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
                emitUtterance('speech_final');
              }
            } catch (error) {
              logVoiceError('invalid websocket message', {
                message: describeCaughtError(error),
                type: payload.type,
              });
              handleRuntimeFailure('Message vocal invalide ou illisible.');
            }
          },
          onError: (caughtError) => {
            logVoiceError('websocket error event', {
              message: describeCaughtError(caughtError),
            });
            setError('Connexion vocale indisponible.');
            setState('error');
          },
          onClose: () => {
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
      timings.log('websocket-client-created');

      clearListeningTimeout();
      listeningTimeoutRef.current = window.setTimeout(() => {
        logVoiceDebug('listening timeout reached', {
          timeoutMs: VOICE_SCORING_TIMEOUT_MS,
          finalChunks: finalChunksRef.current.length,
          liveTranscript: liveTranscriptRef.current,
        });

        if (finalChunksRef.current.length > 0 || liveTranscriptRef.current.trim()) {
          emitUtterance('utterance_end');
        }

        try {
          if (connectionRef.current?.readyState === WebSocket.OPEN) {
            connectionRef.current.sendCloseStream({ type: 'CloseStream' });
          }
        } catch {
          // ignore close stream failures during timeout shutdown
        }

        cleanupAudio();
        cleanupSocket();
        setState((current) => (current === 'error' ? current : 'idle'));
      }, VOICE_SCORING_TIMEOUT_MS);

      await audioSetupPromise;
      timings.log('start-ready');
    } catch (caughtError) {
      logVoiceError('start failed', {
        message: describeCaughtError(caughtError),
      });
      const message = caughtError instanceof Error ? caughtError.message : 'Impossible de lancer l ecoute.';
      handleRuntimeFailure(message);
    }
  }, [
    clearListeningTimeout,
    clearUtteranceBuffer,
    emitUtterance,
    enabled,
    ensureAudioCaptureReady,
    flushBufferedAudio,
    handleRuntimeFailure,
    state,
    cleanupAudio,
    cleanupSocket,
  ]);

  useEffect(() => {
    if (!enabled) {
      reset();
    }

    return () => {
      cleanupAudio({ closeContext: true });
      cleanupSocket();
    };
  }, [cleanupAudio, cleanupSocket, enabled, reset]);

  return {
    error,
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
