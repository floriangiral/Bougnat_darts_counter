
type FullscreenElement = HTMLElement & {
  webkitRequestFullScreen?: () => void;
  mozRequestFullScreen?: () => void;
  msRequestFullscreen?: () => void;
};

type FullscreenDocument = Document & {
  webkitExitFullscreen?: () => void;
  mozCancelFullScreen?: () => void;
  msExitFullscreen?: () => void;
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  msFullscreenElement?: Element | null;
};

export const enterFullScreen = () => {
  const docEl = document.documentElement as FullscreenElement;
  const requestFullScreen = docEl.requestFullscreen
    ?? docEl.webkitRequestFullScreen
    ?? docEl.mozRequestFullScreen
    ?? docEl.msRequestFullscreen;

  if (requestFullScreen) {
    try {
      requestFullScreen.call(docEl);
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
        exitFullScreen.call(doc);
      }
    } catch (e) {
      console.warn("Exit full screen failed", e);
    }
  }
};
