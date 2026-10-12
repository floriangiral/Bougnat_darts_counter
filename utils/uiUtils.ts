
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

  const requestFullScreen = docEl.requestFullscreen
    ?? docEl.webkitRequestFullScreen
    ?? docEl.mozRequestFullScreen
    ?? docEl.msRequestFullscreen;

  if (requestFullScreen) {
    try {
      Promise.resolve(requestFullScreen.call(docEl)).catch((error: unknown) => {
        console.warn("Full screen request failed", error);
      });
    } catch (e) {
      console.warn("Full screen request failed", e);
    }
  }
};

export const exitFullScreen = () => {
  const doc = document as FullscreenDocument;
  const exitFullScreen = doc.exitFullscreen
    ?? doc.webkitExitFullscreen
    ?? doc.mozCancelFullScreen
    ?? doc.msExitFullscreen;

  if (exitFullScreen) {
    try {
      // Check if we are actually in full screen before trying to exit
      if (doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement) {
        Promise.resolve(exitFullScreen.call(doc)).catch((error: unknown) => {
          console.warn("Exit full screen failed", error);
        });
      }
    } catch (e) {
      console.warn("Exit full screen failed", e);
    }
  }
};
