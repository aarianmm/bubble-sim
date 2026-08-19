/**
 * Presenter tools (Step 15, §25.4) — behind `?dev=1` or Help > About
 * clicked five times (wired in App.tsx). Built as insurance on the demo,
 * not a debug panel: styled as a period utility window so it doesn't break
 * the illusion on the accidental occasion it's visible in front of judges.
 *
 * Two of the six tools genuinely can't do more than move the clock yet:
 * "Force any event" needs src/script/timeline.ts (Step 5), and "Load a
 * saved state"'s portfolio presets need holdings (Steps 7-9/24) — neither
 * is merged into this worktree. Both are wired end-to-end with a clearly
 * marked seam in src/ui/EngineProvider.tsx rather than left unwired.
 * "Instant death card" has the same shape of gap for a different reason:
 * GameState carries no `band` field (Band is computed from RunStats by the
 * death-card step, 27-28) and the Engine interface — frozen for this step
 * — has no death-forcing method. See the comment on killNow() below.
 */
import { useState } from 'react';
import { useEngine, RATE_NORMAL, RATE_FAST, RATE_PRESENTER, type PresetName } from '../ui/engine';
import { useRouter, GameLink } from '../chrome/router';
import { HOME_URL, GAME_OVER_URL } from '../pages/registry';
import { monthIndex, monthLabel, MONTH_COUNT } from '../sim/month';
import type { Band, DeathCauseId } from '../sim/types';
import './presenter.css';

const PRESETS: { name: PresetName; label: string }[] = [
  { name: 'start', label: 'Start (Jan 1996)' },
  { name: 'just-before-the-crash', label: 'Just before the crash' },
  { name: 'holding-the-ponzi', label: 'Holding the Ponzi' },
  { name: 'about-to-be-forced-to-sell', label: 'About to be forced to sell' },
  { name: 'cash-only-march-2000', label: 'Cash-only, Mar 2000' },
  { name: 'survived-2006', label: 'Survived to 2006' },
];

const BANDS: Band[] = ['OUCH', 'OKAY', 'SOLID', 'IMPRESSIVE', 'LEGENDARY'];

const DEATH_CAUSES: DeathCauseId[] = [
  'broke-as-bubble-peaked',
  'ground-down-by-rent',
  'funded-a-scam',
  'sold-at-the-bottom',
  'eaten-by-fees',
  'the-card-ate-you',
  'the-fake-dialog',
  'survived',
];

const ALL_MONTHS = Array.from({ length: MONTH_COUNT }, (_, m) => m);

export interface PresenterProps {
  open: boolean;
  onClose: () => void;
}

export function Presenter({ open, onClose }: PresenterProps) {
  const engine = useEngine();
  const router = useRouter();
  const [eventId, setEventId] = useState('');
  const [band, setBand] = useState<Band>('OUCH');
  const [cause, setCause] = useState<DeathCauseId>('broke-as-bubble-peaked');

  if (!open) return null;

  function landOnDashboard() {
    if (router.url !== HOME_URL) router.navigate(HOME_URL);
  }

  function jumpTo(month: number) {
    engine.jumpToMonth(month);
    landOnDashboard();
  }

  function killNow() {
    // SEAM: no sanctioned way to set an arbitrary band/cause exists yet —
    // see the file header. forceEvent's stub is the only mutation surface
    // available without changing the frozen Engine interface, so the
    // chosen band/cause travel through it as a documented dev-only
    // convention (`dev:instant-death:<band>:<cause>`) until Step 24 gives
    // this tool its own method. Pausing is real, though — §19.3 means the
    // clock shouldn't keep ticking in the background under a page that's
    // telling the player (or a judge) the run is over.
    engine.forceEvent(`dev:instant-death:${band}:${cause}`);
    engine.setPaused(true);
    router.navigate(GAME_OVER_URL);
  }

  return (
    <div className="chrome bevel-out presenter">
      <div className="presenter__titlebar">
        <span>Presenter Tools</span>
        <button
          type="button"
          className="bevel-out presenter__close"
          onClick={onClose}
          aria-label="Close"
          title="Close"
        >
          ✕
        </button>
      </div>

      <div className="presenter__body sunken-field win-scrollbar">
        <section className="presenter__section">
          <h2>Jump to date</h2>
          <div className="presenter__row">
            <button type="button" className="bevel-out" onClick={() => jumpTo(monthIndex(2000, 3))}>
              Mar 2000 — the crash
            </button>
            <button type="button" className="bevel-out" onClick={() => jumpTo(monthIndex(2006, 12))}>
              Dec 2006 — the win card
            </button>
          </div>
          <select
            className="sunken-field presenter__select"
            value={engine.state.month}
            onChange={(e) => jumpTo(Number(e.target.value))}
            aria-label="Jump to any month"
          >
            {ALL_MONTHS.map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </select>
        </section>

        <section className="presenter__section">
          <h2>Load a saved state</h2>
          <div className="presenter__row presenter__row--wrap">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                className="bevel-out"
                onClick={() => {
                  engine.loadPreset(p.name);
                  landOnDashboard();
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </section>

        <section className="presenter__section">
          <h2>Force any event</h2>
          <p className="presenter__note">
            Seam: src/script/timeline.ts isn't merged into this worktree yet — this
            calls the stub in EngineProvider.tsx, which logs to the console.
          </p>
          <div className="presenter__row">
            <input
              className="sunken-field presenter__input"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              placeholder="event id"
              aria-label="Event id"
            />
            <button
              type="button"
              className="bevel-out"
              disabled={!eventId}
              onClick={() => engine.forceEvent(eventId)}
            >
              Force
            </button>
          </div>
        </section>

        <section className="presenter__section">
          <h2>Instant death card</h2>
          <div className="presenter__row">
            <select
              className="sunken-field presenter__select"
              value={band}
              onChange={(e) => setBand(e.target.value as Band)}
              aria-label="Band"
            >
              {BANDS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <select
              className="sunken-field presenter__select"
              value={cause}
              onChange={(e) => setCause(e.target.value as DeathCauseId)}
              aria-label="Cause of death"
            >
              {DEATH_CAUSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <button type="button" className="bevel-out" onClick={killNow}>
            Show death card now
          </button>
        </section>

        <section className="presenter__section">
          <h2>Time-rate override</h2>
          <div className="presenter__row">
            <button type="button" className="bevel-out" onClick={() => engine.setTimeRate(RATE_NORMAL)}>
              1×
            </button>
            <button type="button" className="bevel-out" onClick={() => engine.setTimeRate(RATE_FAST)}>
              4×
            </button>
            <button type="button" className="bevel-out" onClick={() => engine.setTimeRate(RATE_PRESENTER)}>
              20×
            </button>
          </div>
        </section>

        <section className="presenter__section">
          <h2>Reset</h2>
          <button
            type="button"
            className="bevel-out"
            onClick={() => {
              engine.reset();
              router.resetTo(HOME_URL);
            }}
          >
            Reset to Jan 1996
          </button>
        </section>

        <section className="presenter__section">
          <h2>Router smoke test</h2>
          <p className="presenter__note">
            §19.3: hovering a link previews its real target in the status bar,
            even when the link text says something else.
          </p>
          <p>
            <GameLink href={HOME_URL}>Back to /home</GameLink>
            {' · '}
            <GameLink href="http://www.cavendish-assets.co.uk.offers.net/tech-fund">
              INVEST NOW
            </GameLink>
          </p>
        </section>
      </div>
    </div>
  );
}
