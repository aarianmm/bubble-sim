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
import { Toolbar } from './Toolbar';
import { EraLoadingPage, EraUpdateCompletePage, EraWelcomeDialog } from './EraTransition';
import { AssistantButton } from './AssistantButton';
import { AssistantBalloon } from './AssistantBalloon';
import { ASSISTANT_HINT_COPY } from '../content/assistant';
import { monthIndex } from '../sim/month';
import './gallery.css';

type TransitionPreview = {
  year: '1998' | '2000';
  phase: 'welcome' | 'loading' | 'complete';
} | null;

const SAMPLE_SPINE_YEARS = [1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006];

const SAMPLE_HINT_TEXT = ASSISTANT_HINT_COPY['hint.read-fact-sheet'];

export function VisualGallery() {
  const [year, setYear] = useState<'1996' | '1998' | '2000'>('1996');
  const [transitionPreview, setTransitionPreview] = useState<TransitionPreview>(null);
  const [showBalloon, setShowBalloon] = useState(true);

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
          2000 Aero shell
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
        {transitionPreview?.phase === 'loading' && (
          <button
            type="button"
            className="bevel-out"
            onClick={() => setTransitionPreview({ ...transitionPreview, phase: 'complete' })}
          >
            Show update complete
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

      {transitionPreview?.phase === 'complete' && (
        <div className="gallery-transition-stage">
          <EraUpdateCompletePage
            year={transitionPreview.year}
            onEnter={() => setTransitionPreview(null)}
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

      <div className="chrome gallery-section window-face">
        <h2>Comet Assistant (PLAN-COMET-ASSISTANT.md, Step C1)</h2>
        <p>
          Click the comet at the toolbar&rsquo;s right edge to open the panel. Switch
          milestones above to see the button and panel re-cost themselves through
          <code>--assistant-*</code> tokens alone — same button, same panel, zero
          component-level era checks (CLAUDE.md rule 3).
        </p>
        {/* The real Toolbar, wired through the same `rightSlot` a future
         * mount point would use — proves the seam works end to end, not
         * just the standalone button. */}
        <Toolbar unreadCount={2} rightSlot={<AssistantButton />} />
      </div>

      <div className="chrome gallery-section window-face">
        <h2>Comet Assistant hint balloon (PLAN-COMET-ASSISTANT.md, Step C2)</h2>
        <p>
          The balloon a real hint uses — same component, same <code>--assistant-*</code>{' '}
          tokens, rendered here with sample copy rather than through the live scheduler
          (which needs a running <code>&lt;EngineProvider&gt;</code>, absent on this
          route). It never blocks the page underneath it and dismisses on <code>✕</code>{' '}
          exactly as it would after <code>--assistant-hint-duration</code> in the real
          game.
        </p>
        {!showBalloon && (
          <button type="button" className="bevel-out" onClick={() => setShowBalloon(true)}>
            Show sample hint again
          </button>
        )}
        <div className="gallery-balloon-anchor">
          {showBalloon && (
            <AssistantBalloon
              text={SAMPLE_HINT_TEXT}
              onDismiss={() => setShowBalloon(false)}
              style={{ position: 'relative', top: 'auto', right: 'auto' }}
            />
          )}
        </div>
      </div>

      <div className="gallery-section">
        <h2 className="chrome">Full window (§18.1)</h2>
        <div className="gallery-window-frame">
          <Window
            titleBar={{ title: 'BUBBLE — Bubble Navigator' }}
            menuBar={{ moneyBaseIs2026: false, soundsOn: true }}
            toolbar={{ unreadCount: 3 }}
            addressBar={{
              url: 'http://www.bubble.net/home',
              visitedUrls: ['http://www.bubble.net/home', 'http://www.bubble.net/mail'],
            }}
            statusBar={{ loadState: { kind: 'done' }, progressPct: 0, popupsBlockedCount: 2 }}
            sidebar={{
              active: 'home',
              unreadCount: 3,
              dateSlot: (
                <div className="chrome sunken-field comet-nav__date">JAN {year}</div>
              ),
              timeControlsSlot: (
                <div className="chrome comet-nav__time-controls">
                  <button type="button" className="bevel-out comet-nav__time-btn">
                    ▶▶
                  </button>
                  <button type="button" className="bevel-out comet-nav__time-btn">
                    ⏸
                  </button>
                </div>
              ),
              yearSpineSlot: (
                <ul className="chrome comet-nav__spine" aria-label="Year progress preview">
                  {SAMPLE_SPINE_YEARS.map((sampleYear, i) => {
                    const currentYear = Number(year);
                    const isCurrent = sampleYear === currentYear;
                    const isFuture = sampleYear > currentYear;
                    const isPast = sampleYear < currentYear;
                    return (
                      <li
                        key={sampleYear}
                        aria-current={isCurrent ? 'date' : undefined}
                        aria-label={`${sampleYear}: ${isCurrent ? 'current year' : isFuture ? 'upcoming' : 'completed'}`}
                        className={
                          'comet-nav__spine-row' +
                          (isCurrent ? ' comet-nav__spine-row--current' : '') +
                          (isPast ? ' comet-nav__spine-row--past' : '') +
                          (isFuture ? ' comet-nav__spine-row--future' : '')
                        }
                      >
                        <span className="comet-nav__spine-node" aria-hidden="true" />
                        <span className="comet-nav__spine-year">{sampleYear}</span>
                        <span className="comet-nav__spine-bar" aria-hidden="true">
                          {'▓'.repeat(i + 1)}
                        </span>
                        {isCurrent && (
                          <span className="comet-nav__spine-marker" aria-hidden="true">
                            ◄
                          </span>
                        )}
                        <span className="comet-nav__spine-status" aria-hidden="true">
                          {isCurrent ? 'NOW' : isPast ? '✓' : ''}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ),
            }}
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
