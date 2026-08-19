/**
 * Application root. Owns nothing but composition (§25.1: /ui is glue).
 *
 * Three routes, chosen once at load — there is no client router yet
 * (Step 13 owns navigation):
 *   - `?visual=1`         the Step 11/12 bevel + component gallery
 *   - viewport too small  the §25 "best viewed at 1024×768" fallback
 *   - otherwise           the real Window, with placeholder content
 *
 * Everything passed into <Window> here is static (§26.2 Step 12) — no
 * navigation logic, no game state, no time. Later steps replace these
 * literal props with real state without touching Window.tsx or its
 * children.
 */
import { Window } from './chrome/Window';
import { TooSmall, useIsViewportTooSmall } from './chrome/TooSmall';
import { VisualGallery } from './chrome/VisualGallery';

function isVisualRoute(): boolean {
  return new URLSearchParams(window.location.search).get('visual') === '1';
}

export function App() {
  const tooSmall = useIsViewportTooSmall();

  if (isVisualRoute()) {
    return <VisualGallery />;
  }

  if (tooSmall) {
    return <TooSmall />;
  }

  return (
    <div className="app-shell">
      <Window
        titleBar={{ title: 'BUBBLE — Comet Navigator' }}
        menuBar={{}}
        toolbar={{ unreadCount: 0 }}
        addressBar={{ url: 'http://www.bubble.net/home', visitedUrls: [] }}
        statusBar={{ loadState: { kind: 'done' }, progressPct: 0 }}
        sidebar={{ active: 'home', unreadCount: 0 }}
      >
        <div className="chrome" style={{ padding: 16 }}>
          <p>Content area placeholder — pages mount here (Step 16+).</p>
        </div>
      </Window>
    </div>
  );
}
