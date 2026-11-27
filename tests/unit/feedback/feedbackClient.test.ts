import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildFeedbackPayload,
  FEEDBACK_MESSAGE_MAX_LENGTH,
  formatFeedbackAppVersion,
  isFeedbackMessageValid,
  sendFeedback,
} from '../../../src/features/feedback/feedbackClient';

afterEach(() => {
  vi.useRealTimers();
});

describe('feedbackClient', () => {
  it('accepts a non-blank trimmed message up to the API limit and uses the API field names', () => {
    expect(isFeedbackMessageValid('   ')).toBe(false);
    expect(isFeedbackMessageValid(' ! ')).toBe(true);
    expect(isFeedbackMessageValid('a'.repeat(FEEDBACK_MESSAGE_MAX_LENGTH))).toBe(true);
    expect(isFeedbackMessageValid('a'.repeat(FEEDBACK_MESSAGE_MAX_LENGTH + 1))).toBe(false);
    expect(buildFeedbackPayload('probleme', '  Plantage  ', '2.2.0')).toEqual({ category: 'probleme', message: 'Plantage', app_version: '2.2.0' });
  });

  it('sends the bare version in production and appends the short build elsewhere', () => {
    expect(formatFeedbackAppVersion('2.2.0', 'abcdef12345', true)).toBe('2.2.0');
    expect(formatFeedbackAppVersion('2.2.0', 'abcdef12345', false)).toBe('2.2.0+abcdef1');
    expect(formatFeedbackAppVersion('2.2.0', 'dev', false)).toBe('2.2.0');
    expect(formatFeedbackAppVersion('2.2.0', undefined, false)).toBe('2.2.0');
    expect(formatFeedbackAppVersion('9'.repeat(60), 'abcdef1', false)).toHaveLength(50);
  });

  it('reports unavailable without an endpoint and never calls the network', async () => {
    const fetchImpl = vi.fn();
    await expect(sendFeedback(buildFeedbackPayload('idee', 'Idée', '1'), { endpoint: null, fetchImpl })).resolves.toBe('unavailable');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('posts the JSON payload without credentials and maps every response', async () => {
    const payload = buildFeedbackPayload('bravo', 'Bravo !', '2.2.0');
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response('{"id":12}', { status: 201 }))
      .mockResolvedValueOnce(new Response(null, { status: 422 }))
      .mockResolvedValueOnce(new Response(null, { status: 429 }))
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockRejectedValueOnce(new TypeError('offline'));
    const options = { endpoint: 'https://api.example/feedback', fetchImpl };
    for (const expected of ['sent', 'invalid', 'rate-limited', 'error', 'error']) {
      await expect(sendFeedback(payload, options)).resolves.toBe(expected);
    }
    expect(fetchImpl).toHaveBeenCalledWith('https://api.example/feedback', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'omit',
    }));
  });

  it('aborts a request that exceeds the timeout', async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn((_url: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    }));
    const result = sendFeedback(buildFeedbackPayload('bug', 'Lent', '1'), { endpoint: 'https://api.example/feedback', fetchImpl, timeoutMs: 1000 });
    await vi.advanceTimersByTimeAsync(1000);
    await expect(result).resolves.toBe('error');
  });
});
