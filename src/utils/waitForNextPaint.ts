/**
 * Give React and the browser a chance to display pending loading UI before
 * starting work that may keep the main thread busy. The timeout keeps actions
 * moving when requestAnimationFrame is throttled (for example, in a hidden tab).
 */
export function waitForNextPaint(): Promise<void> {
  if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
    return Promise.resolve();
  }

  return new Promise(resolve => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      window.clearTimeout(fallback);
      resolve();
    };
    const fallback = window.setTimeout(finish, 80);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(finish);
    });
  });
}
