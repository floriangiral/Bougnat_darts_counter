export const copyText = async (text: string): Promise<'copied' | 'unavailable' | 'error'> => {
  if (typeof navigator.clipboard?.writeText !== 'function') return 'unavailable';
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch (error) {
    console.error('Failed to copy X01 result', error);
    return 'error';
  }
};
