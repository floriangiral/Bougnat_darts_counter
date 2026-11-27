export type ShareImageResult = 'shared' | 'cancelled' | 'unavailable' | 'error';

export const canShareImage = (file: File): boolean => {
  try {
    return typeof navigator.share === 'function'
      && typeof navigator.canShare === 'function'
      && navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
};

export const shareImage = async (file: File): Promise<ShareImageResult> => {
  if (!canShareImage(file)) return 'unavailable';
  try {
    await navigator.share({ files: [file] });
    return 'shared';
  } catch (error) {
    if (error !== null && typeof error === 'object' && 'name' in error && error.name === 'AbortError') return 'cancelled';
    return 'error';
  }
};

export const imageDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === 'string' && reader.result.startsWith('data:image/')) resolve(reader.result);
    else reject(new Error('Aperçu indisponible'));
  };
  reader.onerror = () => reject(reader.error ?? new Error('Lecture impossible'));
  reader.onabort = () => reject(new Error('Lecture interrompue'));
  reader.readAsDataURL(file);
});

export const downloadImage = (file: File, dataUrl: string): boolean => {
  try {
    const link = document.createElement('a');
    if (!('download' in link)) return false;
    link.href = dataUrl;
    link.download = file.name;
    document.body.appendChild(link);
    try {
      link.click();
    } finally {
      link.remove();
    }
    return true;
  } catch {
    return false;
  }
};
