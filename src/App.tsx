/**
 * Application root. Owns composition only (§25.1: /ui is glue) — Steps
 * 13-15 wire the router, the provisional engine and the left-nav clock
 * around the static chrome from Steps 10-12 without editing Window.tsx or
 * any of its children; every value handed to <Window> below now comes from
 * real state instead of the Step 12 placeholders.
 *
 * Three routes, chosen once at load:
 *   - `?visual=1`         the Step 11/12 bevel + component gallery
 *   - viewport too small  the §25 "best viewed at 1024×768" fallback
 *   - otherwise           the real game, inside <EngineProvider> and
 *                          <RouterProvider>
 */
import { useEffect, useState } from 'react';
import { Window } from './chrome/Window';
import { TooSmall, useIsViewportTooSmall } from './chrome/TooSmall';
import { VisualGallery } from './chrome/VisualGallery';
import { RouterProvider, useRouter } from './chrome/router';
import { DateReadout, TimeControls, YearSpine, useUnreadNotice } from './chrome/Nav';
import { NotificationDemo } from './chrome/NotificationDemo';
import type { NavSection } from './chrome/Chrome.types';
import { EngineProvider } from './ui/EngineProvider';
import { useEngine } from './ui/engine';
import { Notifications } from './ui/Notifications';
import { Presenter } from './dev/Presenter';
import { resolveRoute, HOME_URL, MAIL_URL, MONEY_URL, GAME_OVER_URL } from './pages/registry';

function isVisualRoute(): boolean {
  return new URLSearchParams(window.location.search).get('visual') === '1';
}

/** §25.4 — presenter tools unlock behind `?dev=1` or Help > About x5. */
function isDevRoute(): boolean {
  return new URLSearchParams(window.location.search).get('dev') === '1';
}

function sectionFor(url: string): NavSection | undefined {
  if (url === HOME_URL) return 'home';
  if (url === MAIL_URL) return 'inbox';
  if (url === MONEY_URL) return 'money';
  return undefined;
}

function urlForSection(section: NavSection): string {
  switch (section) {
    case 'home':
      return HOME_URL;
    case 'inbox':
      return MAIL_URL;
    case 'money':
      return MONEY_URL;
  }
}

function AppShell() {
  const engine = useEngine();
  const router = useRouter();
  const { count: unreadCount, flashing: unreadFlashing, statusLine } = useUnreadNotice();

  const [presenterUnlocked, setPresenterUnlocked] = useState(isDevRoute);
  const [presenterOpen, setPresenterOpen] = useState(isDevRoute);
  const [aboutClicks, setAboutClicks] = useState(0);
  const [soundsOn, setSoundsOn] = useState(true);

  function newRun() {
    engine.reset();
    router.resetTo(HOME_URL);
  }

  // §7.2's state machine: DEATH CARD / survival is a terminal state reached
  // from RUNNING — when it happens, hand off to whatever's rendered at
  // GAME_OVER_URL (Steps 26-28's death card, on the sibling branch) rather
  // than leaving the player parked on whatever page they were last reading.
  useEffect(() => {
    if (engine.state.status !== 'running' && router.url !== GAME_OVER_URL) {
      router.navigate(GAME_OVER_URL);
    }
  }, [engine.state.status, router.url]);

  function handleAbout() {
    const next = aboutClicks + 1;
    if (next >= 5) {
      setPresenterUnlocked(true);
      setPresenterOpen(true);
      setAboutClicks(0);
      return;
    }
    setAboutClicks(next);
    window.alert('BUBBLE — Comet Navigator\n\nA product of the late 1990s.');
  }

  const route = resolveRoute(router.url);
  const PageComponent = route.component;

  return (
    <div className="app-shell">
      <Window
        titleBar={{ title: router.title, onCloseConfirmed: newRun }}
        menuBar={{
          onNewRun: newRun,
          onQuit: newRun,
          onToggleMoneyBase: () =>
            engine.dispatch({ type: 'toggle-money-base', month: engine.state.month }),
          moneyBaseIs1996: engine.state.flags.moneyBase === '1996',
          onToggleSounds: () => setSoundsOn((v) => !v),
          soundsOn,
          onAbout: handleAbout,
          onDisclaimer: () =>
            window.alert('This is not financial advice. It is a game about 1996–2006.'),
        }}
        toolbar={{
          canGoBack: router.canGoBack,
          canGoForward: router.canGoForward,
          onBack: router.back,
          onForward: router.forward,
          canStop: router.canStop,
          onStop: router.stop,
          onRefresh: router.refresh,
          onHome: () => router.navigate(HOME_URL),
          onMail: () => router.navigate(MAIL_URL),
          unreadCount,
        }}
        addressBar={{
          url: router.url,
          visitedUrls: router.visitedUrls,
          onSelectUrl: router.navigate,
        }}
        statusBar={{
          loadState: statusLine
            ? { kind: 'link-hover', url: statusLine }
            : router.statusLoadState,
          progressPct: router.progressPct,
          zoneLabel: '🌐 Internet',
        }}
        sidebar={{
          active: sectionFor(router.url),
          onNavigate: (section) => router.navigate(urlForSection(section)),
          unreadCount,
          unreadFlashing,
          dateSlot: <DateReadout />,
          timeControlsSlot: <TimeControls />,
          yearSpineSlot: <YearSpine />,
        }}
      >
        <PageComponent key={router.contentKey} />
      </Window>
      <Notifications />
      {presenterUnlocked && (
        <>
          <Presenter open={presenterOpen} onClose={() => setPresenterOpen(false)} />
          <NotificationDemo />
        </>
      )}
    </div>
  );
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
    <EngineProvider>
      <RouterProvider initialUrl={HOME_URL}>
        <AppShell />
      </RouterProvider>
    </EngineProvider>
  );
}
