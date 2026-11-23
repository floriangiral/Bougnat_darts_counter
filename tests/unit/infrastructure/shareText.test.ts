// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { shareText } from '../../../src/infrastructure/web/shareText';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('shareText', () => {
  it('uses the native share sheet when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share });

    await expect(shareText('Match terminé', 'Alice gagne')).resolves.toBe('shared');
    expect(share).toHaveBeenCalledWith({ title: 'Match terminé', text: 'Alice gagne' });
  });

  it('treats dismissal of the native share sheet as cancellation', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('Dismissed', 'AbortError'));
    vi.stubGlobal('navigator', { share });

    await expect(shareText('Match terminé', 'Alice gagne')).resolves.toBe('cancelled');
  });

  it('copies the text when native sharing is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    await expect(shareText('Match terminé', 'Alice gagne')).resolves.toBe('copied');
    expect(writeText).toHaveBeenCalledWith('Alice gagne');
  });

  it('reports when neither native sharing nor clipboard is available', async () => {
    vi.stubGlobal('navigator', {});

    await expect(shareText('Match terminé', 'Alice gagne')).resolves.toBe('unavailable');
  });

  it('surfaces a clipboard failure', async () => {
    const error = new Error('Permission denied');
    const writeText = vi.fn().mockRejectedValue(error);
    const logError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    await expect(shareText('Match terminé', 'Alice gagne')).resolves.toBe('error');
    expect(logError).toHaveBeenCalledWith('Failed to copy X01 result', error);
    logError.mockRestore();
  });
});
