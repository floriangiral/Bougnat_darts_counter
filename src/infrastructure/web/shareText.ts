import { copyText } from './copyText';

export type ShareTextResult = 'shared' | 'copied' | 'cancelled' | 'unavailable' | 'error';

const isShareCancelled = (error: unknown) =>
  error !== null && typeof error === 'object' && 'name' in error && error.name === 'AbortError';

export const canShareText = (): boolean => typeof navigator.share === 'function';

export const shareText = async (title: string, text: string): Promise<ShareTextResult> => {
  if (canShareText()) {
    try {
      await navigator.share({ title, text });
      return 'shared';
    } catch (error) {
      if (isShareCancelled(error)) return 'cancelled';
      console.error('Failed to share X01 result', error);
      return 'error';
    }
  }

  return copyText(text);
};
