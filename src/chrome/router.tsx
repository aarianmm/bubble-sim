/**
 * URL state and history (Step 13, §17.1, §19.3). A real back/forward stack
 * over the portal's own pages and any external offer site the player
 * navigates to — nothing here is a client no-op: Back/Forward/Stop/Refresh
 * all do what a real 1998 browser did.
 *
 * §19.3 "chrome must never lie about state" governs every value this module
 * hands out: `canGoBack`/`canGoForward` are computed straight from the real
 * stack position, the title always comes from the current URL's resolved
 * route, and the address bar is handed the exact same URL the content area
 * is rendering — there is no separate "displayed URL" to drift out of sync
 * with the real one, including on lookalike-domain offer pages (§17.1).
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { resolveRoute } from '../pages/registry';
import type { LoadState } from './Chrome.types';

/** Chrome-only wall-clock timing for the load simulation. Real §18.3 modem
 * pacing (era-specific durations, progressive paint) is Step 34's job —
 * this step only needs Stop/Refresh to have a real load to act on. */
const LOAD_PHASE_MS = 260;

function titleFor(url: string): string {
  const route = resolveRoute(url);
  if (route.title) return route.title;
  // External offer sites (Offer.tsx, Step 19) don't have an authored title
  // yet — fall back to the URL's own host so the title bar is still
  // telling the truth about what's on screen (§19.3), never a placeholder
  // string that isn't derived from the real URL.
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export interface RouterValue {
  url: string;
  title: string;
  canGoBack: boolean;
  canGoForward: boolean;
  /** For the address-bar dropdown (§17.1) — every distinct URL visited. */
  visitedUrls: string[];
  /** Remount key for the content area — bumped on Refresh (§18.1: "Refresh re-renders"). */
  contentKey: number;
  /** The real load-state machine, independent of link-hover preview. */
  loadState: LoadState;
  /** What StatusBar should actually be given: link-hover overrides the real
   * load state while a pointer is over a GameLink, exactly as a real
   * browser's status bar behaves (§19.3). */
  statusLoadState: LoadState;
  progressPct: number;
  canStop: boolean;
  previewUrl: string | null;
  navigate: (url: string) => void;
  back: () => void;
  forward: () => void;
  stop: () => void;
  refresh: () => void;
  /** Collapses history back to a single entry — "New run" / presenter reset. */
  resetTo: (url: string) => void;
  setPreviewUrl: (url: string | null) => void;
}

const RouterContext = createContext<RouterValue | null>(null);

export function RouterProvider({
  initialUrl,
  children,
}: {
  initialUrl: string;
  children: ReactNode;
}) {
  const [history, setHistory] = useState<string[]>([initialUrl]);
  const [index, setIndex] = useState(0);
  const [contentKey, setContentKey] = useState(0);
  const [loadState, setLoadState] = useState<LoadState>({ kind: 'done' });
  const [progressPct, setProgressPct] = useState(100);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    for (const t of timersRef.current) window.clearTimeout(t);
    timersRef.current = [];
  }, []);

  const startLoad = useCallback(
    (url: string) => {
      clearTimers();
      setLoadState({ kind: 'opening', url });
      setProgressPct(15);
      const t1 = window.setTimeout(() => {
        setLoadState({ kind: 'transferring' });
        setProgressPct(65);
        const t2 = window.setTimeout(() => {
          setLoadState({ kind: 'done' });
          setProgressPct(100);
        }, LOAD_PHASE_MS);
        timersRef.current.push(t2);
      }, LOAD_PHASE_MS);
      timersRef.current.push(t1);
    },
    [clearTimers],
  );

  // Unmount only — clears any in-flight load timer so it can't fire setState
  // after the provider is gone.
  useEffect(() => clearTimers, [clearTimers]);

  const navigate = useCallback(
    (url: string) => {
      setHistory((h) => [...h.slice(0, index + 1), url]);
      setIndex(index + 1);
      startLoad(url);
    },
    [index, startLoad],
  );

  const back = useCallback(() => {
    if (index <= 0) return; // §19.3: Back is greyed on the first page — and inert to match
    const target = history[index - 1];
    setIndex(index - 1);
    startLoad(target);
  }, [index, history, startLoad]);

  const forward = useCallback(() => {
    if (index >= history.length - 1) return;
    const target = history[index + 1];
    setIndex(index + 1);
    startLoad(target);
  }, [index, history, startLoad]);

  const stop = useCallback(() => {
    clearTimers();
    setLoadState({ kind: 'done' });
  }, [clearTimers]);

  const refresh = useCallback(() => {
    setContentKey((k) => k + 1);
    startLoad(history[index]);
  }, [history, index, startLoad]);

  const resetTo = useCallback(
    (url: string) => {
      clearTimers();
      setHistory([url]);
      setIndex(0);
      setContentKey((k) => k + 1);
      setLoadState({ kind: 'done' });
      setProgressPct(100);
    },
    [clearTimers],
  );

  const url = history[index];
  const canGoBack = index > 0;
  const canGoForward = index < history.length - 1;
  const visitedUrls = useMemo(() => Array.from(new Set(history)), [history]);
  const canStop = loadState.kind !== 'done';
  const statusLoadState: LoadState = previewUrl
    ? { kind: 'link-hover', url: previewUrl }
    : loadState;

  const value: RouterValue = {
    url,
    title: titleFor(url),
    canGoBack,
    canGoForward,
    visitedUrls,
    contentKey,
    loadState,
    statusLoadState,
    progressPct,
    canStop,
    previewUrl,
    navigate,
    back,
    forward,
    stop,
    refresh,
    resetTo,
    setPreviewUrl,
  };

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter(): RouterValue {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used inside <RouterProvider>');
  return ctx;
}

/** §19.3 — "hovering the INVEST NOW button... reveals the real target URL
 * in the status bar." Any page element wired through this (or <GameLink>)
 * gets the preview for free; no page has to reimplement it. */
export function useLinkPreview(): {
  previewUrl: string | null;
  setPreviewUrl: (url: string | null) => void;
} {
  const { previewUrl, setPreviewUrl } = useRouter();
  return { previewUrl, setPreviewUrl };
}

export interface GameLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

/** The only way pages should link to another URL in the game — wires
 * navigation and the §19.3 hover preview together so neither can be
 * forgotten by a page author. Renders a real `<a href>` so native
 * accessibility (and the browser's own title-tooltip) still works. */
export function GameLink({ href, children, className }: GameLinkProps) {
  const { navigate, setPreviewUrl } = useRouter();
  return (
    <a
      href={href}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        navigate(href);
      }}
      onMouseEnter={() => setPreviewUrl(href)}
      onMouseLeave={() => setPreviewUrl(null)}
      onFocus={() => setPreviewUrl(href)}
      onBlur={() => setPreviewUrl(null)}
    >
      {children}
    </a>
  );
}
