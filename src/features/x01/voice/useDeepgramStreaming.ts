// Spec: spec:counter/voice-scoring-reliability
import { useCallback, useEffect, useRef, useState } from 'react';
import { DeepgramClient } from '@deepgram/sdk';

import { fetchDeepgramAccessToken } from './deepgramClient';
import type {
  DeepgramUtterance,
  DeepgramUtteranceTrigger,
  VoiceScoringStatus,
} from './dartsSpeechTypes';
import { buildDeepgramListenConfig, VOICE_SCORING_TIMEOUT_MS } from './voiceConfig';

type UseDeepgramStreamingOptions = {
  enabled: boolean;
  onUtterance: (payload: DeepgramUtterance) => void;
};

type DeepgramAlternative = {
  transcript?: string;
  confidence?: number;
};

type DeepgramResultsMessage = {
  type: 'Results';
  is_final?: boolean;
  speech_final?: boolean;
  channel?: {
    alternatives?: DeepgramAlternative[];
  };
};

type DeepgramSpeechStartedMessage = {
  type: 'SpeechStarted';
};

type DeepgramUtteranceEndMessage = {
  type: 'UtteranceEnd';
};

type DeepgramErrorMessage = {
  type: 'Error';
  error?: string;
};

type DeepgramMessage =
  | DeepgramResultsMessage
  | DeepgramSpeechStartedMessage
  | DeepgramUtteranceEndMessage
  | DeepgramErrorMessage;

type FinalChunk = {
  transcript: string;
  confidence: number;
};

type StartTimings = {
  log: (step: string, extra?: Record<string, unknown>) => void;
  startAt: number;
};

interface DeepgramLiveConnection {
  close: () => void;
  connect: () => DeepgramLiveConnection;
  on(event: 'close', callback: (event: { code: number; reason: string }) => void): void;
  on(event: 'error', callback: (error: Error) => void): void;
  on(event: 'message', callback: (message: DeepgramMessage) => void): void;
  on(event: 'open', callback: () => void): void;
  readyState: number;
  sendCloseStream: (payload: { type: 'CloseStream' }) => void;
  sendMedia: (payload: ArrayBufferLike | Blob | ArrayBufferView) => void;
  waitForOpen: () => Promise<unknown>;
}

const TARGET_SAMPLE_RATE = 16000;
const MAX_BUFFERED_PCM_CHUNKS = 24;
const VOICE_DEBUG_PREFIX = '[voice-scoring]';
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
      console.debug(`${VOICE_DEBUG_PREFIX} pre-created audio context`, {
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
    try {
      workletNodeRef.current?.port.close();
    } catch {
      // ignore port close failures
    }
    try {
      workletNodeRef.current?.disconnect();
    } catch {
      // ignore disconnect failures
    }
    try {
      sourceRef.current?.disconnect();
    } catch {
      // ignore disconnect failures
    }
    try {
      gainRef.current?.disconnect();
    } catch {
      // ignore disconnect failures
    }
    workletNodeRef.current = null;
    sourceRef.current = null;
    gainRef.current = null;
    bufferedPcmChunksRef.current = [];

    try {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    } catch {
      // ignore track stop failures
    }
    mediaStreamRef.current = null;

    if (options?.closeContext && audioContextRef.current) {
      void audioContextRef.current.close().catch(() => {
        // ignore close failures
      });
      audioContextRef.current = null;
      audioWorkletLoadedRef.current = false;
    }
  }, []);

  const cleanupSocket = useCallback(() => {
    if (connectionRef.current) {
      connectionRef.current.close();
    }
    connectionRef.current = null;
    socketReadyRef.current = false;
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

    if (bufferedPcmChunksRef.current.length >= MAX_BUFFERED_PCM_CHUNKS) {
      bufferedPcmChunksRef.current.shift();
    }

    bufferedPcmChunksRef.current.push(pcm.slice());
  }, []);

  const handleRuntimeFailure = useCallback((message: string) => {
    console.error(`${VOICE_DEBUG_PREFIX} runtime failure`, {
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

    const finalTranscript = finalChunksRef.current
      .map((chunk) => chunk.transcript.trim())
      .filter(Boolean)
      .join(' ')
      .trim();

    const transcript = finalTranscript || liveTranscriptRef.current.trim();

    if (!transcript) {
      return;
    }

    const totalConfidence = finalChunksRef.current.reduce((sum, chunk) => sum + chunk.confidence, 0);
    const confidence = finalChunksRef.current.length
      ? totalConfidence / finalChunksRef.current.length
      : liveConfidenceRef.current;

    try {
      utteranceClosedRef.current = true;
      onUtterance({
        transcript,
        confidence,
        trigger,
      });
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
    let audioContext = audioContextRef.current;
    if (!audioContext) {
      audioContext = createBrowserAudioContext();
      audioContextRef.current = audioContext;
      timings.log('audio-context-created', { sampleRate: audioContext.sampleRate });
    }

    if (audioContext.state !== 'running') {
      await audioContext.resume();
      timings.log('audio-context-resumed', { state: audioContext.state });
    } else {
      timings.log('audio-context-already-running', { state: audioContext.state });
    }

    if (!audioContext.audioWorklet) {
      throw new Error('AudioWorklet non supporte sur ce navigateur.');
    }

    if (!audioWorkletLoadedRef.current) {
      await audioContext.audioWorklet.addModule(PCM_CAPTURE_WORKLET_PATH);
      audioWorkletLoadedRef.current = true;
      timings.log('audio-worklet-loaded');
    }

    cleanupAudio();
    mediaStreamRef.current = mediaStream;

    const source = audioContext.createMediaStreamSource(mediaStream);
    const workletNode = new AudioWorkletNode(audioContext, 'pcm-capture-processor', {
      channelCount: 1,
      channelCountMode: 'explicit',
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [1],
    });
    const gain = audioContext.createGain();
    gain.gain.value = 0;
    const sink = audioContext.createGain();
    sink.gain.value = 0;

    sourceRef.current = source;
    workletNodeRef.current = workletNode;
    gainRef.current = gain;

    workletNode.port.onmessage = (event: MessageEvent<Float32Array>) => {
      try {
        const input = event.data;
        if (!(input instanceof Float32Array) || input.length === 0) {
          return;
        }

        const pcm = downsampleToLinear16(input, audioContext.sampleRate, TARGET_SAMPLE_RATE);
        if (pcm.byteLength > 0) {
          sendOrBufferAudioChunk(pcm);
        }
      } catch {
        handleRuntimeFailure('Impossible de streamer l audio micro.');
      }
    };

    source.connect(workletNode);
    workletNode.connect(gain);
    gain.connect(sink);
    sink.connect(audioContext.destination);
    timings.log('audio-graph-ready');
    setState('listening');
  }, [cleanupAudio, handleRuntimeFailure, sendOrBufferAudioChunk]);

  const start = useCallback(async () => {
    const timings = createStartTimings();
    console.debug(`${VOICE_DEBUG_PREFIX} start requested`, {
      enabled,
      state: stateRef.current,
    });

    if (!enabled || state === 'listening') {
      console.debug(`${VOICE_DEBUG_PREFIX} start ignored`, {
        enabled,
        state: stateRef.current,
      });
      return;
    }

    clearUtteranceBuffer();
    setError(null);
    setState('processing');

    try {
      console.debug(`${VOICE_DEBUG_PREFIX} requesting token and microphone`);
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

      console.debug(`${VOICE_DEBUG_PREFIX} token and microphone ready`, {
        hasAccessToken: Boolean(accessToken),
        audioTracks: mediaStream.getAudioTracks().length,
      });
      const client = new DeepgramClient({ accessToken });
      const connection = await client.listen.v1.connect(
        buildDeepgramListenConfig(`Bearer ${accessToken}`),
      ) as DeepgramLiveConnection;
      connectionRef.current = connection;
      timings.log('websocket-client-created');

      clearListeningTimeout();
      listeningTimeoutRef.current = window.setTimeout(() => {
        console.debug(`${VOICE_DEBUG_PREFIX} listening timeout reached`, {
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

      connection.on('open', async () => {
        console.debug(`${VOICE_DEBUG_PREFIX} websocket open`);
        socketReadyRef.current = true;
        timings.log('websocket-open');
        flushBufferedAudio();
      });

      connection.on('message', (payload) => {
        try {
          console.debug(`${VOICE_DEBUG_PREFIX} websocket message`, {
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
            console.error(`${VOICE_DEBUG_PREFIX} deepgram error payload`, payload);
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
          console.error(`${VOICE_DEBUG_PREFIX} invalid websocket message`, {
            error,
            raw: payload,
          });
          handleRuntimeFailure('Message vocal invalide ou illisible.');
        }
      });

      connection.on('error', (caughtError) => {
        console.error(`${VOICE_DEBUG_PREFIX} websocket error event`, caughtError);
        setError('Connexion vocale indisponible.');
        setState('error');
      });

      connection.on('close', () => {
        console.debug(`${VOICE_DEBUG_PREFIX} websocket close`, {
          previousState: stateRef.current,
        });
        clearListeningTimeout();
        cleanupAudio();
        connectionRef.current = null;
        setState((current) => (current === 'error' ? current : 'idle'));
      });

      connection.connect();
      await connection.waitForOpen();
      await audioSetupPromise;
      timings.log('start-ready');
    } catch (caughtError) {
      console.error(`${VOICE_DEBUG_PREFIX} start failed`, caughtError);
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

function createBrowserAudioContext(): AudioContext {
  const BrowserAudioContext = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!BrowserAudioContext) {
    throw new Error('AudioContext non supporte sur ce navigateur.');
  }

  return new BrowserAudioContext();
}

function createStartTimings(): StartTimings {
  const startAt = performance.now();

  return {
    startAt,
    log(step, extra) {
      console.debug(`${VOICE_DEBUG_PREFIX} timing`, {
        step,
        elapsedMs: Math.round(performance.now() - startAt),
        ...extra,
      });
    },
  };
}

function downsampleToLinear16(input: Float32Array, inputSampleRate: number, outputSampleRate: number): Int16Array {
  if (inputSampleRate === outputSampleRate) {
    return floatTo16BitPCM(input);
  }

  const sampleRateRatio = inputSampleRate / outputSampleRate;
  const newLength = Math.max(1, Math.round(input.length / sampleRateRatio));
  const output = new Float32Array(newLength);

  let outputIndex = 0;
  let inputIndex = 0;

  while (outputIndex < newLength) {
    const nextInputIndex = Math.round((outputIndex + 1) * sampleRateRatio);
    let sum = 0;
    let count = 0;

    for (let i = inputIndex; i < nextInputIndex && i < input.length; i += 1) {
      sum += input[i];
      count += 1;
    }

    output[outputIndex] = count > 0 ? sum / count : 0;
    outputIndex += 1;
    inputIndex = nextInputIndex;
  }

  return floatTo16BitPCM(output);
}

function floatTo16BitPCM(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length);

  for (let i = 0; i < input.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, input[i]));
    output[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }

  return output;
}
