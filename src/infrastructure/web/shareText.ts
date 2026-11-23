export type ShareTextResult = 'shared' | 'copied' | 'cancelled' | 'unavailable' | 'error';

const isShareCancelled = (error: unknown) =>
  error !== null && typeof error === 'object' && 'name' in error && error.name === 'AbortError';

export const shareText = async (title: string, text: string): Promise<ShareTextResult> => {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text });
      return 'shared';
    } catch (error) {
      if (isShareCancelled(error)) return 'cancelled';
      console.error('Failed to share X01 result', error);
      return 'error';
    }
  }

  if (typeof navigator.clipboard?.writeText !== 'function') return 'unavailable';
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch (error) {
    console.error('Failed to copy X01 result', error);
    return 'error';
  }
};
