import { vi } from 'vitest';

export class FakeAudioNode {
  connect = vi.fn();
  disconnect = vi.fn();
}

export class FakeGainNode extends FakeAudioNode {
  gain = { value: 1 };
}

export class FakeAudioWorkletNode extends FakeAudioNode {
  static instances: FakeAudioWorkletNode[] = [];
  port = {
    close: vi.fn(),
    onmessage: null as ((event: MessageEvent<unknown>) => void) | null,
  };

  constructor(..._args: unknown[]) {
    super();
    FakeAudioWorkletNode.instances.push(this);
  }

  emit(data: unknown) {
    this.port.onmessage?.({ data } as MessageEvent<unknown>);
  }
}

export class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  state = 'suspended';
  sampleRate = 48000;
  destination = new FakeAudioNode();
  audioWorklet = { addModule: vi.fn().mockResolvedValue(undefined) };
  source = new FakeAudioNode();
  gains: FakeGainNode[] = [];
  resume = vi.fn(() => {
    this.state = 'running';
    return Promise.resolve();
  });
  close = vi.fn().mockResolvedValue(undefined);
  createMediaStreamSource = vi.fn(() => this.source);
  createGain = vi.fn(() => {
    const gain = new FakeGainNode();
    this.gains.push(gain);
    return gain;
  });

  constructor() {
    FakeAudioContext.instances.push(this);
  }
}

export function createFakeMediaStream() {
  const track = { stop: vi.fn() };
  const stream = {
    getTracks: vi.fn(() => [track]),
    getAudioTracks: vi.fn(() => [track]),
  } as unknown as MediaStream;
  return { stream, track };
}

export function installAudioFakes() {
  FakeAudioContext.instances = [];
  FakeAudioWorkletNode.instances = [];
  vi.stubGlobal('AudioContext', FakeAudioContext);
  vi.stubGlobal('AudioWorkletNode', FakeAudioWorkletNode);
}
