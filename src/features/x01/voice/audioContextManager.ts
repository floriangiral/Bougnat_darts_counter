import type { MutableRefObject } from 'react';

import { downsampleToLinear16 } from './voicePcm';

export type AudioCaptureRefs = {
  mediaStreamRef: MutableRefObject<MediaStream | null>;
  audioContextRef: MutableRefObject<AudioContext | null>;
  sourceRef: MutableRefObject<MediaStreamAudioSourceNode | null>;
  workletNodeRef: MutableRefObject<AudioWorkletNode | null>;
  gainRef: MutableRefObject<GainNode | null>;
  audioWorkletLoadedRef: MutableRefObject<boolean>;
  bufferedPcmChunksRef: MutableRefObject<Int16Array[]>;
};

type EnsureAudioCaptureReadyParams = {
  refs: AudioCaptureRefs;
  mediaStream: MediaStream;
  onAudioChunk: (pcm: Int16Array) => void;
  onRuntimeFailure: () => void;
  onReady: () => void;
  pcmCaptureWorkletPath: string;
  targetSampleRate: number;
  logTiming: (step: string, extra?: Record<string, unknown>) => void;
};

export function createBrowserAudioContext(): AudioContext {
  const BrowserAudioContext = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!BrowserAudioContext) {
    throw new Error('AudioContext non supporte sur ce navigateur.');
  }

  return new BrowserAudioContext();
}

export function cleanupAudioResources(refs: AudioCaptureRefs, options?: { closeContext?: boolean }) {
  try {
    refs.workletNodeRef.current?.port.close();
  } catch {
    // ignore port close failures
  }
  try {
    refs.workletNodeRef.current?.disconnect();
  } catch {
    // ignore disconnect failures
  }
  try {
    refs.sourceRef.current?.disconnect();
  } catch {
    // ignore disconnect failures
  }
  try {
    refs.gainRef.current?.disconnect();
  } catch {
    // ignore disconnect failures
  }
  refs.workletNodeRef.current = null;
  refs.sourceRef.current = null;
  refs.gainRef.current = null;
  refs.bufferedPcmChunksRef.current = [];

  try {
    refs.mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
  } catch {
    // ignore track stop failures
  }
  refs.mediaStreamRef.current = null;

  if (options?.closeContext && refs.audioContextRef.current) {
    void refs.audioContextRef.current.close().catch(() => {
      // ignore close failures
    });
    refs.audioContextRef.current = null;
    refs.audioWorkletLoadedRef.current = false;
  }
}

export async function ensureAudioCaptureReady({
  refs,
  mediaStream,
  onAudioChunk,
  onRuntimeFailure,
  onReady,
  pcmCaptureWorkletPath,
  targetSampleRate,
  logTiming,
}: EnsureAudioCaptureReadyParams) {
  let audioContext = refs.audioContextRef.current;
  if (!audioContext) {
    audioContext = createBrowserAudioContext();
    refs.audioContextRef.current = audioContext;
    logTiming('audio-context-created', { sampleRate: audioContext.sampleRate });
  }

  if (audioContext.state !== 'running') {
    await audioContext.resume();
    logTiming('audio-context-resumed', { state: audioContext.state });
  } else {
    logTiming('audio-context-already-running', { state: audioContext.state });
  }

  if (!audioContext.audioWorklet) {
    throw new Error('AudioWorklet non supporte sur ce navigateur.');
  }

  if (!refs.audioWorkletLoadedRef.current) {
    await audioContext.audioWorklet.addModule(pcmCaptureWorkletPath);
    refs.audioWorkletLoadedRef.current = true;
    logTiming('audio-worklet-loaded');
  }

  cleanupAudioResources(refs);
  refs.mediaStreamRef.current = mediaStream;

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

  refs.sourceRef.current = source;
  refs.workletNodeRef.current = workletNode;
  refs.gainRef.current = gain;

  workletNode.port.onmessage = (event: MessageEvent<Float32Array>) => {
    try {
      const input = event.data;
      if (!(input instanceof Float32Array) || input.length === 0) {
        return;
      }

      const pcm = downsampleToLinear16(input, audioContext.sampleRate, targetSampleRate);
      if (pcm.byteLength > 0) {
        onAudioChunk(pcm);
      }
    } catch {
      onRuntimeFailure();
    }
  };

  source.connect(workletNode);
  workletNode.connect(gain);
  gain.connect(sink);
  sink.connect(audioContext.destination);
  logTiming('audio-graph-ready');
  onReady();
}