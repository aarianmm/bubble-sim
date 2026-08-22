/**
 * The owner-directed Jan 1998 / Jan 2000 evolution beat. This component owns
 * copy and blocking presentation only; App.tsx owns when it appears and when
 * the root milestone attribute flips. Both destinations render one identical
 * tree; `data-ui-target` tokens provide their period-specific presentation.
 */
import { Dialog } from './Dialog';
import type { LoadState } from './Chrome.types';
import type { DialogItem } from '../sim/types';
import type { MonthIndex } from '../sim/month';
import './era-transition.css';

type EvolutionYear = '1998' | '2000';

export function EraWelcomeDialog({
  year,
  month,
  onContinue,
}: {
  year: EvolutionYear;
  month: MonthIndex;
  onContinue: () => void;
}) {
  const dialog: DialogItem = {
    id: `ui-era-welcome-${year}`,
    eventId: `ui-era-welcome-${year}`,
    title: `Welcome to the year ${year}`,
    contentId: `ui-era-welcome-${year}`,
    cls: 'era-switch',
    raisedMonth: month,
    buttons: [{ label: 'Continue', action: 'acknowledge', isDefault: true }],
  };

  return (
    <Dialog
      dialog={dialog}
      titleOverride={`Welcome to the year ${year}`}
      bodyOverride={
        <div className="era-welcome-copy">
          <p className="era-welcome-kicker">COMET NAVIGATOR UPDATE</p>
          <h2 className="era-welcome-title">
            <span>WELCOME TO</span>
            <strong>{year}</strong>
          </h2>
          <div className="era-transition-signal" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <p className="era-welcome-note">A new browser interface is ready.</p>
        </div>
      }
      onResolve={onContinue}
    />
  );
}

function loadingText(loadState: LoadState): string {
  if (loadState.kind === 'opening') return 'Opening system update…';
  if (loadState.kind === 'transferring') return 'Transferring interface files…';
  return 'Installing browser chrome…';
}

export function EraLoadingPage({
  year,
  loadState,
  progressPct,
}: {
  year: EvolutionYear;
  loadState: LoadState;
  progressPct: number;
}) {
  const progress = Math.max(0, Math.min(100, progressPct));
  return (
    <section className="era-loading-page" role="status" aria-live="polite" aria-busy="true">
      <div className="bevel-out era-loading-panel">
        <div className="era-loading-brand" aria-hidden="true">
          <span className="era-loading-brand__name">COMET NAVIGATOR</span>
          <span className="era-loading-brand__year">{year}</span>
        </div>
        <div className="era-loading-content">
          <p className="era-loading-kicker">SYSTEM UPDATE / {year}</p>
          <h1>Loading the <strong>{year}</strong> interface…</h1>
          <div
            className="sunken-field era-loading-progress"
            role="progressbar"
            aria-label={`Loading the ${year} interface`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <span className="era-loading-progress__fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="era-loading-meta">
            <p className="era-loading-state">{loadingText(loadState)}</p>
            <p className="era-loading-note">Game clock paused</p>
          </div>
        </div>
      </div>
    </section>
  );
}
