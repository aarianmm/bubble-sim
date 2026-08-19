/**
 * The `?visual=1` gallery (Step 11's stated done-condition: "A visual test
 * route renders a raised button, a sunken field and a pressed button
 * correctly at 1×.") Also exercises the full Step 12 Window composition and
 * an era toggle, so a reviewer can confirm the §25.1 hard rule visually:
 * flipping `data-era` must restyle everything below without touching a
 * single component.
 */
import { useEffect, useState } from 'react';
import { Window } from './Window';
import './gallery.css';

export function VisualGallery() {
  const [era, setEra] = useState<'a' | 'b'>('a');

  // tokens.css keys every theme off `:root[data-era]` — CSS's `:root` is
  // always the document element, never a nested node, so exercising the
  // era switch for real means setting the attribute there, exactly as the
  // real app will (§18.2). Restored to Era A on unmount so leaving the
  // gallery doesn't strand the document in Era B.
  useEffect(() => {
    document.documentElement.setAttribute('data-era', era);
    return () => {
      document.documentElement.setAttribute('data-era', 'a');
    };
  }, [era]);

  return (
    <div className="gallery-root">
      <div className="chrome gallery-controls">
        <button type="button" className="bevel-out" onClick={() => setEra('a')}>
          Era A (1996–2000)
        </button>
        <button type="button" className="bevel-out" onClick={() => setEra('b')}>
          Era B (2001–2006)
        </button>
        <span>current era: {era}</span>
      </div>

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
