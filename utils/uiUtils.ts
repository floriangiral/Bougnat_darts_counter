
export const enterFullScreen = () => {
  const docEl = document.documentElement as any;
  const requestFullScreen =
    docEl.requestFullscreen ||
    docEl.webkitRequestFullScreen ||
    docEl.mozRequestFullScreen ||
    docEl.msRequestFullscreen;

  if (requestFullScreen) {
    try {
      requestFullScreen.call(docEl);
    } catch (e) {
      console.warn("Full screen request failed", e);
    }
  }
};

export const exitFullScreen = () => {
  const doc = document as any;
  const exitFullScreen =
    doc.exitFullscreen ||
    doc.webkitExitFullscreen ||
    doc.mozCancelFullScreen ||
    doc.msExitFullscreen;

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
