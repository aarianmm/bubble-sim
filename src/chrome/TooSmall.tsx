/**
 * The §25 viewport fallback: "landscape, desktop, minimum 1024×768. Below
 * that, show a period-correct 'This site is best viewed at 1024×768 or
 * higher' page — which is both a genuine responsive fallback and the
 * funniest possible one."
 *
 * `useIsViewportTooSmall` is the hook App.tsx uses to decide whether to
 * mount this instead of <Window>. It lives here, not in App.tsx, so the
 * 1024×768 threshold has exactly one definition (tokens.css's
 * --min-viewport-width/height carry the same numbers for CSS consumers).
 */
import { useEffect, useState } from 'react';

const MIN_WIDTH = 1024;
const MIN_HEIGHT = 768;

export function useIsViewportTooSmall(): boolean {
  const [tooSmall, setTooSmall] = useState(
    () => window.innerWidth < MIN_WIDTH || window.innerHeight < MIN_HEIGHT,
  );

  useEffect(() => {
    function handleResize() {
      setTooSmall(window.innerWidth < MIN_WIDTH || window.innerHeight < MIN_HEIGHT);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return tooSmall;
}

export function TooSmall() {
  return (
    <div className="comet-toosmall">
      <div className="bevel-out comet-toosmall__badge">
        <p className="chrome comet-toosmall__eyebrow">⚠ Display Notice</p>
        <h1 className="comet-toosmall__heading">
          This site is best viewed at 1024 × 768 or higher
        </h1>
        <p>
          Please maximise your browser window, or adjust your screen
          resolution, and reload.
        </p>
        <p className="comet-toosmall__badge-row">
          <span className="chrome sunken-field comet-toosmall__pill">Best viewed at 1024×768</span>
          <span className="chrome sunken-field comet-toosmall__pill">Bubble Navigator</span>
        </p>
      </div>
    </div>
  );
}
