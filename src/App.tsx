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
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Window } from './chrome/Window';
import { TooSmall, useIsViewportTooSmall } from './chrome/TooSmall';
import { VisualGallery } from './chrome/VisualGallery';
import { RouterProvider, useRouter } from './chrome/router';
import { DateReadout, TimeControls, YearSpine, useUnreadNotice } from './chrome/Nav';
import type { NavSection } from './chrome/Chrome.types';
import { noop } from './chrome/Chrome.types';
import { EngineProvider } from './ui/EngineProvider';
import { useEngine } from './ui/engine';
import { Notifications } from './ui/Notifications';
import {
  EraLoadingPage,
  EraUpdateCompletePage,
  EraWelcomeDialog,
} from './chrome/EraTransition';
import {
  resolveRoute,
  GAME_OVER_URL,
  HOME_URL,
  MAIL_URL,
  MONEY_URL,
  shouldAutoPauseSimulationUrl,
} from './pages/registry';
import { MoneyDraftProvider } from './pages/Money';
import { monthIndex, type MonthIndex } from './sim/month';
import { LaunchExperience, type LaunchScreen } from './launch/LaunchExperience';
import { ExperienceNavigationContext } from './launch/experience';

type VisualMilestone = {
  era: 'a' | 'b';
  year: '1996' | '1998' | '2000';
};

type EvolutionState = {
  target: VisualMilestone;
  phase: 'queued' | 'welcome' | 'loading' | 'complete';
};

/** Owner-directed visual progression: presentation changes, game state does
 * not. Components continue to render one invariant control tree and consume
 * only CSS tokens from the two root attributes. See BUILD STATUS deviation 5. */
function visualMilestoneFor(month: MonthIndex): VisualMilestone {
  if (month >= monthIndex(2000, 1)) return { era: 'b', year: '2000' };
  if (month >= monthIndex(1998, 1)) return { era: 'a', year: '1998' };
  return { era: 'a', year: '1996' };
}

/** Evolution beats only interrupt continuous play. Non-continuous state loads
 * remain immediate so tests do not manufacture a chain of missed years. */
export function evolutionReached(previous: MonthIndex, current: MonthIndex): VisualMilestone | null {
  if (current <= previous) return null;
  // Prefer the newest crossed boundary when several monthly updates are
  // batched into one render. The player must still see an installation beat
  // for the interface they actually land on rather than silently skipping it.
  if (previous < monthIndex(2000, 1) && current >= monthIndex(2000, 1)) {
    return { era: 'b', year: '2000' };
  }
  if (previous < monthIndex(1998, 1) && current >= monthIndex(1998, 1)) {
    return { era: 'a', year: '1998' };
  }
  return null;
}

function isVisualRoute(): boolean {
  return new URLSearchParams(window.location.search).get('visual') === '1';
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

export function SimulationRoutePause() {
  const engine = useEngine();
  const router = useRouter();
  const autoPause = shouldAutoPauseSimulationUrl(router.url);

  useLayoutEffect(() => {
    engine.setAutoPaused('route', autoPause);
    return () => engine.setAutoPaused('route', false);
  }, [autoPause, engine.setAutoPaused]);

  return null;
}

export function AppShell() {
  const engine = useEngine();
  const router = useRouter();
  const { count: unreadCount, flashing: unreadFlashing, statusLine, bannerText } = useUnreadNotice();

  const [soundsOn, setSoundsOn] = useState(true);
  const [appliedMilestone, setAppliedMilestone] = useState<VisualMilestone>(() =>
    visualMilestoneFor(engine.state.month),
  );
  const [evolution, setEvolution] = useState<EvolutionState | null>(null);
  const previousMonthRef = useRef(engine.state.month);
  const previousResetKeyRef = useRef(engine.mailNoticeResetKey ?? 0);
  const evolutionLoadStartedRef = useRef(false);

  // The root changes only after the milestone's Continue -> loading sequence.
  // The same chrome controls, handlers, icons and buttons remain mounted.
  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-era', appliedMilestone.era);
    document.documentElement.setAttribute('data-ui-year', appliedMilestone.year);
  }, [appliedMilestone.era, appliedMilestone.year]);

  // The currently installed chrome remains truthful until loading completes,
  // while this separate root attribute lets the blocking transition preview
  // the destination's visual language without branching inside its components.
  useLayoutEffect(() => {
    if (!evolution) {
      document.documentElement.removeAttribute('data-ui-target');
      return;
    }

    document.documentElement.setAttribute('data-ui-target', evolution.target.year);
    return () => document.documentElement.removeAttribute('data-ui-target');
  }, [evolution]);

  // Arriving naturally at Jan 1998/Jan 2000 queues a blocking evolution beat.
  // A scheduled simulation dialog already present at the boundary keeps first
  // place (Jan 2000's break-even line); the evolution pause is acquired now so
  // the clock cannot restart between the two dialogs.
  useLayoutEffect(() => {
    const current = engine.state.month;
    const previous = previousMonthRef.current;
    const resetKey = engine.mailNoticeResetKey ?? 0;
    const stateWasRebuilt = resetKey !== previousResetKeyRef.current;
    previousMonthRef.current = current;
    previousResetKeyRef.current = resetKey;

    // Reset and presenter/test state loads deliberately rebuild the timeline.
    // They must land immediately on the matching visual state rather than
    // manufacturing update dialogs for every crossed year.
    if (stateWasRebuilt) {
      engine.setEvolutionPaused(false);
      evolutionLoadStartedRef.current = false;
      setEvolution(null);
      setAppliedMilestone(visualMilestoneFor(current));
      return;
    }

    if (current === previous) return;

    const target = evolutionReached(previous, current);
    if (target) {
      engine.setEvolutionPaused(true);
      setEvolution({
        target,
        phase: engine.state.dialogs.length > 0 ? 'queued' : 'welcome',
      });
      return;
    }

    // Reset/backward travel and test state loads are deliberate discontinuities,
    // so they land directly on the appropriate visual state.
    engine.setEvolutionPaused(false);
    evolutionLoadStartedRef.current = false;
    setEvolution(null);
    setAppliedMilestone(visualMilestoneFor(current));
  }, [engine.mailNoticeResetKey, engine.setEvolutionPaused, engine.state.dialogs.length, engine.state.month]);

  useEffect(() => {
    if (evolution?.phase !== 'queued' || engine.state.dialogs.length > 0) return;
    setEvolution({ ...evolution, phase: 'welcome' });
  }, [engine.state.dialogs.length, evolution]);

  useEffect(() => {
    if (evolution?.phase !== 'loading') return;
    if (router.loadState.kind !== 'done') {
      evolutionLoadStartedRef.current = true;
      return;
    }
    if (!evolutionLoadStartedRef.current) return;

    setAppliedMilestone(evolution.target);
    setEvolution({ ...evolution, phase: 'complete' });
    evolutionLoadStartedRef.current = false;
  }, [evolution, router.loadState.kind]);

  function beginEvolutionLoad() {
    if (!evolution) return;
    evolutionLoadStartedRef.current = false;
    setEvolution({ ...evolution, phase: 'loading' });
    router.refresh();
  }

  function finishEvolution() {
    setEvolution(null);
    engine.setEvolutionPaused(false);
  }

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
    window.alert('BUBBLE — Bubble Navigator\n\nA product of the late 1990s.');
  }

  const route = resolveRoute(router.url);
  const PageComponent = route.component;

  // §22.6/Step 27 — "the browser chrome remains... every toolbar button is
  // greyed except Home... the machine keeps working, and you don't." The
  // Back/Forward/Stop props already carry a real `disabled` (Toolbar.tsx
  // renders them off `canGoBack`/`canGoForward`/`canStop`), so forcing
  // those false is a real disable, not a cosmetic one. Refresh/Search/
  // Favourites/Mail have no such prop in Toolbar.tsx's contract (out of
  // scope to add — Toolbar.tsx isn't a file this step owns), so their
  // handlers are swapped for `noop` here (functionally inert either way a
  // player reaches them) and `app-shell--death` (src/pages/deathcard.css)
  // greys them out visually to match. Home is left completely untouched.
  const onDeathCard = router.url === GAME_OVER_URL;

  return (
    <div className={onDeathCard ? 'app-shell app-shell--death' : 'app-shell'}>
      <SimulationRoutePause />
      <Window
        titleBar={{ title: router.title, onCloseConfirmed: newRun }}
        menuBar={{
          onNewRun: newRun,
          onQuit: newRun,
          onToggleMoneyBase: () =>
            engine.dispatch({ type: 'toggle-money-base', month: engine.state.month }),
          moneyBaseIs2026: engine.state.flags.moneyBase === '2026',
          onToggleSounds: () => setSoundsOn((v) => !v),
          soundsOn,
          onAbout: handleAbout,
          onDisclaimer: () =>
            window.alert('This is not financial advice. It is a game about 1996–2006.'),
        }}
        toolbar={{
          canGoBack: onDeathCard ? false : router.canGoBack,
          canGoForward: onDeathCard ? false : router.canGoForward,
          onBack: router.back,
          onForward: router.forward,
          canStop: onDeathCard ? false : router.canStop,
          onStop: router.stop,
          onRefresh: onDeathCard ? noop : router.refresh,
          onHome: () => router.navigate(HOME_URL),
          onMail: onDeathCard ? noop : () => router.navigate(MAIL_URL),
          unreadCount,
          newMailNotice: bannerText,
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
        <MoneyDraftProvider>
          <PageComponent key={router.contentKey} />
        </MoneyDraftProvider>
      </Window>
      {evolution?.phase !== 'loading' && evolution?.phase !== 'complete' && <Notifications />}
      {evolution?.phase === 'welcome' && (
        <EraWelcomeDialog
          year={evolution.target.year as '1998' | '2000'}
          month={engine.state.month}
          onContinue={beginEvolutionLoad}
        />
      )}
      {evolution?.phase === 'loading' && (
        <div className="era-system-overlay">
          <EraLoadingPage
            year={evolution.target.year as '1998' | '2000'}
            loadState={router.loadState}
            progressPct={router.progressPct}
          />
        </div>
      )}
      {evolution?.phase === 'complete' && (
        <div className="era-system-overlay">
          <EraUpdateCompletePage
            year={evolution.target.year as '1998' | '2000'}
            onEnter={finishEvolution}
          />
        </div>
      )}
      {(evolution?.phase === 'loading' || evolution?.phase === 'complete') && (
        <div className="era-loading-input-blocker" aria-hidden="true" />
      )}
    </div>
  );
}

export function App() {
  const tooSmall = useIsViewportTooSmall();
  const [experience, setExperience] = useState<'hub' | 'library' | 'play'>(() =>
    new URLSearchParams(window.location.search).get('play') === '1' ? 'play' : 'hub',
  );

  if (isVisualRoute()) {
    return <VisualGallery />;
  }

  if (experience !== 'play') {
    return (
      <LaunchExperience
        initialScreen={experience as LaunchScreen}
        onLaunch={() => setExperience('play')}
      />
    );
  }

  if (tooSmall) {
    return <TooSmall />;
  }

  return (
    <ExperienceNavigationContext.Provider value={{ returnToLibrary: () => setExperience('library') }}>
      <EngineProvider>
        <RouterProvider initialUrl={HOME_URL}>
          <AppShell />
        </RouterProvider>
      </EngineProvider>
    </ExperienceNavigationContext.Provider>
  );
}
