/**
 * The left nav's live parts (Step 14, §22.1): the clock, hold-to-fast-
 * forward, and the year progress spine. Slots into Sidebar.tsx's dateSlot /
 * timeControlsSlot / yearSpineSlot — Sidebar itself still owns HOME / INBOX
 * (n) / MY MONEY (§18.1) and never imports this file.
 */
import { useEffect, useRef, useState } from 'react';
import { useEngine, RATE_FAST, RATE_NORMAL } from '../ui/engine';
import { unreadCount as selectUnreadCount } from '../sim/selectors';
import { monthLabel, START_YEAR, END_YEAR, yearOf } from '../sim/month';
import './nav.css';

/** Sidebar's own `unreadCount` prop and the toolbar's Mail badge both read
 * this, so the two badges can never disagree (§19.3). */
export function useUnreadCount(): number {
  const { state } = useEngine();
  return selectUnreadCount(state);
}

/**
 * §20.3 — Tier 3, the quietest notification. New mail increments the count
 * with a single 200ms bold flash and a transient status-bar line, and does
 * nothing else. Nothing covers content; nothing demands a click. A player can
 * go a full simulated year without opening the inbox, and the design intends
 * for some of them to try and to learn what it cost.
 */
export const UNREAD_FLASH_MS = 200;

export interface UnreadNotice {
  count: number;
  /** True for 200ms after the count rises. Drives the bold flash. */
  flashing: boolean;
  /** `1 new message` / `3 new messages`, or null when there is nothing to say. */
  statusLine: string | null;
  /** The same arrival notice, formatted for the toolbar Mail callout. */
  bannerText: string | null;
}

export function useUnreadNotice(): UnreadNotice {
  const engine = useEngine();
  const count = selectUnreadCount(engine.state);
  const resetKey = engine.mailNoticeResetKey ?? 0;
  const previous = useRef(count);
  const previousResetKey = useRef(resetKey);
  const [flashing, setFlashing] = useState(false);
  const [statusLine, setStatusLine] = useState<string | null>(null);

  useEffect(() => {
    if (resetKey !== previousResetKey.current) {
      previousResetKey.current = resetKey;
      previous.current = count;
      setFlashing(false);
      setStatusLine(null);
      return;
    }
    const arrived = count - previous.current;
    previous.current = count;
    // Only a rise is news. A decrease never creates a notice, but it does
    // immediately retire any notice for unread mail the player has already
    // dealt with. The effect cleanup above also cancels the old timers.
    if (arrived < 0) {
      setFlashing(false);
      setStatusLine(null);
      return;
    }
    if (arrived === 0) return;

    setFlashing(true);
    setStatusLine(arrived === 1 ? '1 new message' : `${arrived} new messages`);
    const flashTimer = window.setTimeout(() => setFlashing(false), UNREAD_FLASH_MS);
    const lineTimer = window.setTimeout(() => setStatusLine(null), 2000);
    return () => {
      window.clearTimeout(flashTimer);
      window.clearTimeout(lineTimer);
    };
  }, [count, resetKey]);

  const bannerText = statusLine
    ? `New Mail — ${statusLine.replace(/ new messages?$/, (match) => (match.endsWith('messages') ? ' messages' : ' message'))}`
    : null;

  return { count, flashing, statusLine, bannerText };
}

export function DateReadout() {
  const { state } = useEngine();
  return <div className="chrome sunken-field comet-nav__date">{monthLabel(state.month)}</div>;
}

function PauseButton() {
  const { paused, setPaused } = useEngine();
  return (
    <button
      type="button"
      className="chrome bevel-out comet-nav__time-btn"
      aria-pressed={paused}
      aria-label={paused ? 'Play' : 'Pause'}
      title={paused ? 'Play' : 'Pause'}
      onClick={() => setPaused(!paused)}
    >
      {paused ? '▶' : '⏸'}
    </button>
  );
}

/** §22.1: "held not toggled — it keeps a hand on the game." Pointer-down
 * sets 4x; pointer-up, pointer-leave *and* window blur all release it, so
 * losing the pointer (drag off the button, alt-tab, focus loss mid-hold)
 * can never leave the clock stuck at 4x — this step's explicit
 * done-condition. */
function FastForwardButton() {
  const { setTimeRate } = useEngine();
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (!held) return;
    function release() {
      setHeld(false);
      setTimeRate(RATE_NORMAL);
    }
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    window.addEventListener('blur', release);
    return () => {
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('blur', release);
    };
  }, [held, setTimeRate]);

  function press() {
    setHeld(true);
    setTimeRate(RATE_FAST);
  }

  function releaseIfHeld() {
    if (!held) return;
    setHeld(false);
    setTimeRate(RATE_NORMAL);
  }

  return (
    <button
      type="button"
      className={'chrome bevel-out comet-nav__time-btn' + (held ? ' comet-nav__time-btn--held' : '')}
      aria-pressed={held}
      aria-label="Hold to fast-forward"
      title="Hold to fast-forward (4x)"
      onPointerDown={press}
      onPointerLeave={releaseIfHeld}
    >
      ▶▶
    </button>
  );
}

export function TimeControls() {
  const { autoPaused } = useEngine();
  return (
    <>
      <div className="chrome comet-nav__time-controls">
        <FastForwardButton />
        <PauseButton />
      </div>
      {autoPaused && <div className="comet-nav__auto-pause">Paused while reviewing</div>}
    </>
  );
}

const YEARS = Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i);

/** §22.1: "the left-nav year bars are a live progress spine showing how far
 * you've got and quietly implying how far there is to go." Each year's bar
 * is a fixed staircase length (year N gets N blocks, matching the §22.1
 * mockup); the live part is the ◄ marker tracking the current year, with
 * years not yet reached reading as greyed-out. */
export function YearSpine() {
  const { state } = useEngine();
  const currentYear = yearOf(state.month);
  return (
    <ul className="chrome comet-nav__spine" aria-label="Year progress">
      {YEARS.map((year, i) => {
        const isCurrent = year === currentYear;
        const isFuture = year > currentYear;
        return (
          <li
            key={year}
            className={
              'comet-nav__spine-row' +
              (isCurrent ? ' comet-nav__spine-row--current' : '') +
              (isFuture ? ' disabled-text' : '')
            }
          >
            <span className="comet-nav__spine-year">{year}</span>
            <span className="comet-nav__spine-bar" aria-hidden="true">
              {'▓'.repeat(i + 1)}
            </span>
            {isCurrent && (
              <span className="comet-nav__spine-marker" aria-hidden="true">
                ◄
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
