/**
 * The `?visual=1` gallery (Step 11's stated done-condition: "A visual test
 * route renders a raised button, a sunken field and a pressed button
 * correctly at 1×.") Also exercises the full Step 12 Window composition and
 * milestone toggles, so a reviewer can confirm the §25.1 hard rule visually:
 * changing root attributes restyles everything below without touching a
 * single component.
 */
import { useEffect, useState } from 'react';
import { Window } from './Window';
import { EraLoadingPage, EraWelcomeDialog } from './EraTransition';
import { monthIndex } from '../sim/month';
import './gallery.css';

type TransitionPreview = {
  year: '1998' | '2000';
  phase: 'welcome' | 'loading';
} | null;

export function VisualGallery() {
  const [year, setYear] = useState<'1996' | '1998' | '2000'>('1996');
  const [transitionPreview, setTransitionPreview] = useState<TransitionPreview>(null);

  // Exercise the exact root-attribute path used by AppShell. Restored to the
  // opening style on unmount so leaving the gallery cannot strand the game in
  // a later visual milestone.
  useEffect(() => {
    document.documentElement.setAttribute('data-era', year === '2000' ? 'b' : 'a');
    document.documentElement.setAttribute('data-ui-year', year);
    return () => {
      document.documentElement.setAttribute('data-era', 'a');
      document.documentElement.setAttribute('data-ui-year', '1996');
    };
  }, [year]);

  useEffect(() => {
    if (!transitionPreview) {
      document.documentElement.removeAttribute('data-ui-target');
      return;
    }

    document.documentElement.setAttribute('data-ui-target', transitionPreview.year);
    return () => document.documentElement.removeAttribute('data-ui-target');
  }, [transitionPreview]);

  return (
    <div className="gallery-root">
      <div className="chrome gallery-controls">
        <button type="button" className="bevel-out" onClick={() => setYear('1996')}>
          1996 baseline
        </button>
        <button type="button" className="bevel-out" onClick={() => setYear('1998')}>
          1998 refinement
        </button>
        <button type="button" className="bevel-out" onClick={() => setYear('2000')}>
          2000 refinement
        </button>
        <span className="gallery-controls__divider" aria-hidden="true" />
        <button
          type="button"
          className="bevel-out"
          onClick={() => setTransitionPreview({ year: '1998', phase: 'welcome' })}
        >
          Preview 1998 transition
        </button>
        <button
          type="button"
          className="bevel-out"
          onClick={() => setTransitionPreview({ year: '2000', phase: 'welcome' })}
        >
          Preview 2000 transition
        </button>
        {transitionPreview && (
          <button type="button" className="bevel-out" onClick={() => setTransitionPreview(null)}>
            Close preview
          </button>
        )}
        <span>current visual milestone: {year}</span>
      </div>

      {transitionPreview?.phase === 'welcome' && (
        <EraWelcomeDialog
          year={transitionPreview.year}
          month={monthIndex(Number(transitionPreview.year), 1)}
          onContinue={() => setTransitionPreview({ ...transitionPreview, phase: 'loading' })}
        />
      )}

      {transitionPreview?.phase === 'loading' && (
        <div className="gallery-transition-stage">
          <EraLoadingPage
            year={transitionPreview.year}
            loadState={{ kind: 'transferring' }}
            progressPct={64}
          />
        </div>
      )}

      <div className="chrome gallery-section window-face">
        <h2>Bevel primitives</h2>
        <div className="gallery-row">
          <button type="button" className="bevel-out" data-testid="gallery-raised-button">
            Raised button
          </button>
          <input
            className="sunken-field"
            data-testid="gallery-sunken-field"
            defaultValue="Sunken field"
          />
          <button type="button" className="bevel-pressed" data-testid="gallery-pressed-button">
            Pressed button
          </button>
        </div>
        <div className="gallery-row">
          <input type="range" className="win-slider" defaultValue={50} />
        </div>
        <div className="gallery-row gallery-scrollbox win-scrollbar sunken-field">
          <p>
            Scrollable content to exercise the 16px Win95 scrollbar. Line one.
          </p>
          <p>Line two.</p>
          <p>Line three.</p>
          <p>Line four.</p>
          <p>Line five.</p>
          <p>Line six.</p>
          <p>Line seven.</p>
          <p>Line eight.</p>
        </div>
      </div>

      <div className="gallery-section">
        <h2 className="chrome">Full window (§18.1)</h2>
        <div className="gallery-window-frame">
          <Window
            titleBar={{ title: 'BUBBLE — Comet Navigator' }}
            menuBar={{ moneyBaseIs1996: false, soundsOn: true }}
            toolbar={{ unreadCount: 3 }}
            addressBar={{
              url: 'http://www.bubble.net/home',
              visitedUrls: ['http://www.bubble.net/home', 'http://www.bubble.net/mail'],
            }}
            statusBar={{ loadState: { kind: 'done' }, progressPct: 0, popupsBlockedCount: 2 }}
            sidebar={{ active: 'home', unreadCount: 3 }}
          >
            <div className="chrome gallery-placeholder-page">
              <p>Content area placeholder — pages mount here (Step 16+).</p>
            </div>
          </Window>
        </div>
      </div>
    </div>
  );
}
