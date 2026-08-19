/**
 * The status bar (§18.1). Left: load state (`Done`, `Opening page http://…`,
 * `Transferring data…`). Centre: load progress. Right: zone indicator, with
 * a slot for the Era B popup-blocker count.
 *
 * §19.3: "Chrome must never lie about state" — this component only ever
 * displays what it is told; the truthfulness is the caller's job (Step 13+).
 * The popup-blocker segment is always in the DOM; `--popup-blocker-display`
 * hides it in Era A so this file never asks which era it is in.
 */
import type { StatusBarProps } from './Chrome.types';

function loadStateText(state: StatusBarProps['loadState']): string {
  switch (state.kind) {
    case 'done':
      return 'Done';
    case 'opening':
      return `Opening page ${state.url}`;
    case 'transferring':
      return 'Transferring data…';
    case 'link-hover':
      return state.url;
  }
}

export function StatusBar({
  loadState,
  progressPct = 0,
  zoneLabel = '🌐 Internet',
  popupsBlockedCount = 0,
}: StatusBarProps) {
  const clampedPct = Math.max(0, Math.min(100, progressPct));

  return (
    <div className="chrome comet-statusbar window-face">
      <div className="sunken-field comet-statusbar__state">{loadStateText(loadState)}</div>
      <div
        className="sunken-field comet-statusbar__progress"
        role="progressbar"
        aria-valuenow={clampedPct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="comet-statusbar__progress-fill" style={{ width: `${clampedPct}%` }} />
      </div>
      <div className="sunken-field comet-statusbar__popups">
        Popups blocked: {popupsBlockedCount}
      </div>
      <div className="sunken-field comet-statusbar__zone">{zoneLabel}</div>
    </div>
  );
}
