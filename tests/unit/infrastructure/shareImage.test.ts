// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { canShareImage, downloadImage, imageDataUrl, shareImage } from '../../../src/infrastructure/web/shareImage';
import { copyText } from '../../../src/infrastructure/web/copyText';

const file = new File(['image'], 'resultat.png', { type: 'image/png' });

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('shareImage', () => {
  it('requires file support and passes the file to Web Share', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const canShare = vi.fn().mockReturnValue(true);
    vi.stubGlobal('navigator', { share, canShare });
    await expect(shareImage(file)).resolves.toBe('shared');
    expect(canShare).toHaveBeenCalledWith({ files: [file] });
    expect(share).toHaveBeenCalledWith({ files: [file] });
  });

  it('handles unavailable support, cancellation and errors', async () => {
    vi.stubGlobal('navigator', { share: vi.fn(), canShare: () => false });
    await expect(shareImage(file)).resolves.toBe('unavailable');
    vi.stubGlobal('navigator', { share: vi.fn(), canShare: () => { throw new Error('unsupported'); } });
    expect(canShareImage(file)).toBe(false);
    const share = vi.fn().mockRejectedValueOnce(new DOMException('cancelled', 'AbortError')).mockRejectedValueOnce(new Error('failure'));
    vi.stubGlobal('navigator', { share, canShare: () => true });
    await expect(shareImage(file)).resolves.toBe('cancelled');
    await expect(shareImage(file)).resolves.toBe('error');
  });

  it('creates a data URL and requests a download without claiming completion', async () => {
    const url = await imageDataUrl(file);
    expect(url).toMatch(/^data:image\/png;base64,/);
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe('resultat.png');
      expect(this.href).toBe(url);
    });
    expect(downloadImage(file, url)).toBe(true);
    expect(click).toHaveBeenCalledOnce();
    click.mockImplementation(() => { throw new Error('failure'); });
    expect(downloadImage(file, url)).toBe(false);
    expect(document.querySelector('a')).toBeNull();
  });

  it('rejects invalid preview content', async () => {
    await expect(imageDataUrl(new File(['x'], 'x.txt', { type: 'text/plain' }))).rejects.toThrow();
  });
});

describe('copyText', () => {
  it('reports real clipboard success, unavailability and failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const writeText = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('denied'));
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    await expect(copyText('résultat')).resolves.toBe('copied');
    expect(writeText).toHaveBeenCalledWith('résultat');
    await expect(copyText('résultat')).resolves.toBe('error');
    vi.stubGlobal('navigator', {});
    await expect(copyText('résultat')).resolves.toBe('unavailable');
  });
});
