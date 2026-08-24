/**
 * The owner-directed Jan 1998 / Jan 2000 evolution beat. This component owns
 * copy and blocking presentation only; App.tsx owns when it appears and when
 * the root milestone attribute flips. Both destinations render one identical
 * tree; `data-ui-target` tokens provide their period-specific presentation.
 */
import { useEffect, useRef } from 'react';
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
  const previousYear = year === '1998' ? '1996' : '1998';
  const dialog: DialogItem = {
    id: `ui-era-welcome-${year}`,
    eventId: `ui-era-welcome-${year}`,
    title: `System update required for ${year}`,
    contentId: `ui-era-welcome-${year}`,
    cls: 'era-switch',
    raisedMonth: month,
    buttons: [{ label: 'Update the system', action: 'acknowledge', isDefault: true }],
  };

  return (
    <Dialog
      dialog={dialog}
      titleOverride="Bubble Navigator — System Update"
      bodyOverride={
        <div className="era-welcome-copy">
          <div className="era-welcome-hero">
            <div className="era-update-orb" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="era-welcome-message">
              <p className="era-welcome-kicker">IMPORTANT SYSTEM UPDATE</p>
              <h2 className="era-welcome-title">
                We are now entering the year <strong>{year}</strong>.
              </h2>
              <p className="era-welcome-note">
                Please update the system to install the new Bubble Navigator interface.
              </p>
            </div>
          </div>

          <div className="era-update-path" aria-label="Interface update path">
            <div className="era-update-path__card">
              <span>Current system</span>
              <strong>Bubble Navigator {previousYear}</strong>
            </div>
            <div className="era-update-path__arrow" aria-hidden="true">
              →
            </div>
            <div className="era-update-path__card era-update-path__card--new">
              <span>Ready to install</span>
              <strong>Bubble Navigator {year}</strong>
            </div>
          </div>

          <ul className="era-update-features">
            <li>New window chrome and navigation</li>
            <li>Updated sidebar and system controls</li>
            <li>Your game progress will be preserved</li>
          </ul>

          <div className="era-transition-signal" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
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
    <section className="chrome era-loading-page" role="status" aria-live="polite" aria-busy="true">
      <div className="era-loading-atmosphere" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="bevel-out era-loading-panel">
        <div className="era-loading-brand" aria-hidden="true">
          <span className="era-loading-brand__name">BUBBLE NAVIGATOR SYSTEM UPDATE</span>
          <span className="era-loading-brand__year">{year} EDITION</span>
        </div>
        <div className="era-loading-content">
          <div className="era-loading-heading">
            <div className="era-loading-orb" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div>
              <p className="era-loading-kicker">PLEASE WAIT / SYSTEM YEAR {year}</p>
              <h1>Updating your system for <strong>{year}</strong>…</h1>
              <p className="era-loading-description">
                Bubble Navigator is replacing the interface. Do not turn off the system.
              </p>
            </div>
          </div>

          <ol className="era-loading-steps" aria-label="System update stages">
            <li className={progress >= 20 ? 'era-loading-step--done' : 'era-loading-step--active'}>
              Preparing
            </li>
            <li
              className={
                progress >= 70
                  ? 'era-loading-step--done'
                  : progress >= 20
                    ? 'era-loading-step--active'
                    : ''
              }
            >
              Installing interface
            </li>
            <li className={progress >= 70 ? 'era-loading-step--active' : ''}>Applying settings</li>
          </ol>

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
            <p className="era-loading-percent">{Math.round(progress)}%</p>
          </div>
          <p className="era-loading-note">Game clock paused · progress saved automatically</p>
        </div>
      </div>
    </section>
  );
}

export function EraUpdateCompletePage({
  year,
  onEnter,
}: {
  year: EvolutionYear;
  onEnter: () => void;
}) {
  const enterButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    enterButtonRef.current?.focus();
  }, []);

  return (
    <section
      className="chrome era-update-complete-page"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`era-update-complete-${year}`}
    >
      <div className="era-loading-atmosphere" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="era-update-complete-panel">
        <div className="era-update-complete-badge" aria-hidden="true">
          ✓
        </div>
        <p className="era-welcome-kicker">SYSTEM UPDATE COMPLETE</p>
        <h1 id={`era-update-complete-${year}`}>
          Welcome to <strong>{year}</strong>
        </h1>
        <p className="era-update-complete-copy">
          Your new Bubble Navigator interface is installed and ready to use.
        </p>

        <div className="era-update-complete-features" aria-label="Installed interface features">
          <div>
            <span aria-hidden="true">◫</span>
            <strong>Glass chrome</strong>
            <small>Layered window surfaces</small>
          </div>
          <div>
            <span aria-hidden="true">◆</span>
            <strong>Clear navigation</strong>
            <small>Updated sidebar and year spine</small>
          </div>
          <div>
            <span aria-hidden="true">▰</span>
            <strong>Live status</strong>
            <small>Brighter system feedback</small>
          </div>
        </div>

        <button
          ref={enterButtonRef}
          type="button"
          className="chrome bevel-out era-update-complete-button"
          onClick={onEnter}
        >
          Enter the updated system
        </button>
      </div>
    </section>
  );
}
