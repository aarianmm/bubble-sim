/**
 * The toolbar (§18.1): Back, Forward, Stop, Refresh, Home, Search,
 * Favourites, Mail. Era A shows large icons with text labels underneath;
 * Era B shows small icons with no labels (§18.2) — controlled entirely by
 * the `--toolbar-icon-size` / `--toolbar-label-display` tokens, so this
 * component always renders both the icon and the label and never asks which
 * era it is in.
 *
 * Icons are hand-drawn inline SVG, 16-colour flavour, using only tokened
 * colours (§24 — no external assets, nothing from Microsoft).
 */
import type { ReactNode } from 'react';
import type { ToolbarProps } from './Chrome.types';
import { noop } from './Chrome.types';

function BackIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <polygon points="6,2 6,14 1,8" fill="var(--icon-blue)" />
      <rect x="6" y="7" width="9" height="2" fill="var(--icon-blue)" />
    </svg>
  );
}

function ForwardIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <polygon points="10,2 10,14 15,8" fill="var(--icon-blue)" />
      <rect x="1" y="7" width="9" height="2" fill="var(--icon-blue)" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <polygon
        points="5,1 11,1 15,5 15,11 11,15 5,15 1,11 1,5"
        fill="var(--icon-red)"
        stroke="var(--dk-shadow)"
        strokeWidth="1"
      />
      <rect x="3.5" y="7" width="9" height="2" fill="var(--hilite)" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M 3 8 A 5 5 0 1 1 4.5 11.5"
        fill="none"
        stroke="var(--icon-green)"
        strokeWidth="2"
      />
      <polygon points="3,11 3,7 7,8" fill="var(--icon-green)" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <polygon points="8,1 15,7 13,7 13,15 3,15 3,7 1,7" fill="var(--icon-red)" />
      <rect x="5" y="9" width="6" height="6" fill="var(--icon-blue)" />
      <rect x="7" y="10" width="2" height="3" fill="var(--face-light)" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="4.5" fill="none" stroke="var(--dk-shadow)" strokeWidth="2" />
      <rect x="10.5" y="11" width="2" height="5" fill="var(--dk-shadow)" transform="rotate(-45 11.5 13.5)" />
    </svg>
  );
}

function FavouritesIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <polygon
        points="8,1 10,6 15,6 11,9.5 12.5,15 8,11.8 3.5,15 5,9.5 1,6 6,6"
        fill="var(--icon-yellow)"
        stroke="var(--dk-shadow)"
        strokeWidth="0.75"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <rect x="1" y="3" width="14" height="10" fill="var(--field)" stroke="var(--dk-shadow)" strokeWidth="1" />
      <polyline points="1,3 8,9 15,3" fill="none" stroke="var(--icon-blue)" strokeWidth="1" />
    </svg>
  );
}

interface ToolbarButtonSpec {
  key: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  badge?: number;
  notice?: string | null;
}

export function Toolbar({
  canGoBack = false,
  canGoForward = false,
  onBack = noop,
  onForward = noop,
  canStop = false,
  onStop = noop,
  onRefresh = noop,
  onHome = noop,
  onSearch = noop,
  onFavourites = noop,
  onMail = noop,
  unreadCount = 0,
  newMailNotice = null,
}: ToolbarProps) {
  const buttons: ToolbarButtonSpec[] = [
    { key: 'back', label: 'Back', icon: <BackIcon />, onClick: onBack, disabled: !canGoBack },
    {
      key: 'forward',
      label: 'Forward',
      icon: <ForwardIcon />,
      onClick: onForward,
      disabled: !canGoForward,
    },
    { key: 'stop', label: 'Stop', icon: <StopIcon />, onClick: onStop, disabled: !canStop },
    { key: 'refresh', label: 'Refresh', icon: <RefreshIcon />, onClick: onRefresh },
    { key: 'home', label: 'Home', icon: <HomeIcon />, onClick: onHome },
    { key: 'search', label: 'Search', icon: <SearchIcon />, onClick: onSearch },
    { key: 'favourites', label: "Fav'ts", icon: <FavouritesIcon />, onClick: onFavourites },
    {
      key: 'mail',
      label: 'Mail',
      icon: <MailIcon />,
      onClick: onMail,
      badge: unreadCount > 0 ? unreadCount : undefined,
      notice: newMailNotice,
    },
  ];

  return (
    <div className="chrome comet-toolbar" role="toolbar">
      {buttons.map((btn) => (
        <button
          type="button"
          key={btn.key}
          className="bevel-out comet-toolbar__btn"
          disabled={btn.disabled}
          onClick={btn.onClick}
        >
          <span className="comet-toolbar__icon">
            {btn.icon}
            {btn.badge !== undefined && (
              <span className="comet-toolbar__badge">{btn.badge}</span>
            )}
          </span>
          <span className="comet-toolbar__label">{btn.label}</span>
          {btn.notice && (
            <span className="comet-toolbar__mail-notice" role="status" aria-live="polite">
              {btn.notice}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
