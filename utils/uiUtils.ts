
type FullscreenElement = HTMLElement & {
  webkitRequestFullScreen?: () => void | Promise<void>;
  mozRequestFullScreen?: () => void | Promise<void>;
  msRequestFullscreen?: () => void | Promise<void>;
};

type FullscreenDocument = Document & {
  webkitExitFullscreen?: () => void | Promise<void>;
  mozCancelFullScreen?: () => void | Promise<void>;
  msExitFullscreen?: () => void | Promise<void>;
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  msFullscreenElement?: Element | null;
};

export const enterFullScreen = () => {
  const docEl = document.documentElement as FullscreenElement;
  if (document.fullscreenEnabled === false) {
    return;
  }

  const requestFullScreen = () => {
    if (docEl.requestFullscreen) return docEl.requestFullscreen();
    if (docEl.webkitRequestFullScreen) return docEl.webkitRequestFullScreen();
    if (docEl.mozRequestFullScreen) return docEl.mozRequestFullScreen();
    return docEl.msRequestFullscreen?.();
  };

  try {
    Promise.resolve(requestFullScreen()).catch((error: unknown) => {
      console.warn("Full screen request failed", error);
    });
  } catch (e) {
    console.warn("Full screen request failed", e);
  }
};

export const exitFullScreen = () => {
  const doc = document as FullscreenDocument;
  const exitFullScreen = () => {
    if (doc.exitFullscreen) return doc.exitFullscreen();
    if (doc.webkitExitFullscreen) return doc.webkitExitFullscreen();
    if (doc.mozCancelFullScreen) return doc.mozCancelFullScreen();
    return doc.msExitFullscreen?.();
  };

  try {
    // Check if we are actually in full screen before trying to exit
    if (doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement) {
      Promise.resolve(exitFullScreen()).catch((error: unknown) => {
        console.warn("Exit full screen failed", error);
      });
    }
  } catch (e) {
    console.warn("Exit full screen failed", e);
  }
};
