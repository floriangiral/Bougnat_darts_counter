export type DeepgramAlternative = {
  transcript?: string;
  confidence?: number;
};

export type DeepgramResultsMessage = {
  type: 'Results';
  is_final?: boolean;
  speech_final?: boolean;
  channel?: {
    alternatives?: DeepgramAlternative[];
  };
};

export type DeepgramSpeechStartedMessage = {
  type: 'SpeechStarted';
};

export type DeepgramUtteranceEndMessage = {
  type: 'UtteranceEnd';
};

export type DeepgramErrorMessage = {
  type: 'Error';
  error?: string;
};

export type DeepgramMessage =
  | DeepgramResultsMessage
  | DeepgramSpeechStartedMessage
  | DeepgramUtteranceEndMessage
  | DeepgramErrorMessage;

export interface DeepgramLiveConnection {
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
