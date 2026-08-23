/**
 * The engine interface — the seam between the pure simulation (/sim) and every
 * React surface (/chrome, /pages, /dev).
 *
 * Pages read `state` and call `dispatch`. They never mutate state, never
 * advance time, and never reach into /sim directly for anything other than the
 * pure selectors in `src/sim/selectors.ts`.
 *
 * This interface is stable. Step 24 (the scheduler) replaces the implementation
 * behind it without any page changing.
 */

import { createContext, useContext } from 'react';
import type { Band, Decision, DeathCauseId, EventId, GameState, PopupItem } from '../sim/types';
import type { MonthIndex } from '../sim/month';

/** §7.4 — one simulated month is 1.2 real seconds at 1x. */
export const MS_PER_MONTH = 1200;

/** §7.4 — held fast-forward is 4x. */
export const RATE_NORMAL = 1;
export const RATE_FAST = 4;

/** §25.4 presenter tool — 20x is for skipping quiet years live. */
export const RATE_PRESENTER = 20;

export interface PopupPresentationState {
  active: PopupItem | null;
  pending: PopupItem[];
  phase: 'showing' | 'gap';
}

export interface Engine {
  state: GameState;
  /** True while a blocking dialog is open, or the player pressed pause (§20.1). */
  paused: boolean;
  /** True while one or more reading/decision contexts request a pause. */
  autoPaused: boolean;
  /** Effective multiplier on MS_PER_MONTH. 0 while paused. */
  timeRate: number;
  popupPresentation: PopupPresentationState;
  /** Changes when reset/presenter navigation rebuilds state, allowing
   * presentation hooks to suppress historical arrival notices. */
  mailNoticeResetKey?: number;

  dispatch(decision: Decision): void;
  setPaused(paused: boolean): void;
  setAutoPaused(reason: 'route' | 'mail-message', paused: boolean): void;
  /** Hold-to-fast-forward sets RATE_FAST on press and RATE_NORMAL on release. */
  setTimeRate(rate: number): void;
  closePresentedPopup(popupId: string): void;
  filePresentedPopup(popup: PopupItem): void;
  deferPresentedPopup(popupId: string): void;
  finishPopupGap(): void;

  /* --- §25.4 presenter tools, behind ?dev=1 --- */
  jumpToMonth(month: MonthIndex): void;
  forceEvent(eventId: EventId): void;
  loadPreset(preset: PresetName): void;
  /**
   * §25.4 "Instant death card — any band, any cause line, one click, for the
   * closing shot." Ends the run and navigates to the card without playing the
   * decade that would have earned it. Real runs never call this; the band and
   * cause a real run produces come from `src/sim/bands.ts` (Step 26).
   */
  showDeathCard(band: Band, causeId: DeathCauseId): void;
  reset(): void;
}

/** §25.4 — one preset per demo beat. */
export type PresetName =
  | 'start'
  | 'just-before-the-crash'
  | 'holding-the-ponzi'
  | 'about-to-be-forced-to-sell'
  | 'cash-only-march-2000'
  | 'survived-2006';

export const EngineContext = createContext<Engine | null>(null);

export function useEngine(): Engine {
  const engine = useContext(EngineContext);
  if (!engine) throw new Error('useEngine must be used inside <EngineProvider>');
  return engine;
}
