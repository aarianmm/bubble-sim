/**
 * The toolbar (§18.1): Back, Forward, Stop, Refresh, Home, Search,
 * Favourites, Mail. Every visual milestone keeps the same button slots, labels
 * and handlers. Each SVG contains both hand-drawn legacy and millennium art;
 * root tokens select the visible group, so this component never asks which
 * year or era it is in.
 *
 * Icons are hand-drawn inline SVG: 16-colour legacy art plus a richer shaded
 * IE5/Windows 2000 group, using only tokened colours (§24 — no external
 * assets, nothing copied from Microsoft).
 */
import type { ReactNode } from 'react';
import type { ToolbarProps } from './Chrome.types';
import { noop } from './Chrome.types';

function BackIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <g className="comet-icon__legacy" transform="scale(2)">
        <polygon points="6,2 6,14 1,8" fill="var(--icon-blue)" />
        <rect x="6" y="7" width="9" height="2" fill="var(--icon-blue)" />
      </g>
      <g className="comet-icon__millennium">
        <path d="M3 16 15 4v7h14v10H15v7z" fill="var(--icon2-blue-dark)" />
        <path d="M5 15 14 6v7h13v6H14v6z" fill="var(--icon2-blue)" />
        <path d="M7 14 13 8v7h13v2H13v5l-6-6z" fill="var(--icon2-blue-light)" />
      </g>
    </svg>
  );
}

function ForwardIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <g className="comet-icon__legacy" transform="scale(2)">
        <polygon points="10,2 10,14 15,8" fill="var(--icon-blue)" />
        <rect x="1" y="7" width="9" height="2" fill="var(--icon-blue)" />
      </g>
      <g className="comet-icon__millennium">
        <path d="m29 16-12-12v7H3v10h14v7z" fill="var(--icon2-blue-dark)" />
        <path d="m27 15-9-9v7H5v6h13v6l9-9z" fill="var(--icon2-blue)" />
        <path d="m25 14-6-6v7H6v2h13v5l6-6z" fill="var(--icon2-blue-light)" />
      </g>
    </svg>
  );
}

function StopIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <g className="comet-icon__legacy" transform="scale(2)">
        <polygon
          points="5,1 11,1 15,5 15,11 11,15 5,15 1,11 1,5"
          fill="var(--icon-red)"
          stroke="var(--dk-shadow)"
          strokeWidth="1"
        />
        <rect x="3.5" y="7" width="9" height="2" fill="var(--hilite)" />
      </g>
      <g className="comet-icon__millennium">
        <path d="m9 3 14 0 6 6v14l-6 6H9l-6-6V9z" fill="var(--icon2-red-dark)" />
        <path d="m10 5 12 0 5 5v12l-5 5H10l-5-5V10z" fill="var(--icon2-red)" />
        <path d="m10 7 11 0 3 3H8z" fill="var(--icon2-red-light)" />
        <rect x="9" y="14" width="14" height="4" fill="var(--icon2-paper)" />
      </g>
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <g className="comet-icon__legacy" transform="scale(2)">
        <path
          d="M 3 8 A 5 5 0 1 1 4.5 11.5"
          fill="none"
          stroke="var(--icon-green)"
          strokeWidth="2"
        />
        <polygon points="3,11 3,7 7,8" fill="var(--icon-green)" />
      </g>
      <g className="comet-icon__millennium">
        <path d="M7 15A10 10 0 0 1 24 8" fill="none" stroke="var(--icon2-green-dark)" strokeWidth="6" />
        <path d="M7 15A10 10 0 0 1 24 8" fill="none" stroke="var(--icon2-green)" strokeWidth="3" />
        <path d="m20 4 8 2-4 7z" fill="var(--icon2-green-light)" stroke="var(--icon2-green-dark)" />
        <path d="M25 17A10 10 0 0 1 8 24" fill="none" stroke="var(--icon2-blue-dark)" strokeWidth="6" />
        <path d="M25 17A10 10 0 0 1 8 24" fill="none" stroke="var(--icon2-blue)" strokeWidth="3" />
        <path d="m12 28-8-2 4-7z" fill="var(--icon2-blue-light)" stroke="var(--icon2-blue-dark)" />
      </g>
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <g className="comet-icon__legacy" transform="scale(2)">
        <polygon points="8,1 15,7 13,7 13,15 3,15 3,7 1,7" fill="var(--icon-red)" />
        <rect x="5" y="9" width="6" height="6" fill="var(--icon-blue)" />
        <rect x="7" y="10" width="2" height="3" fill="var(--face-light)" />
      </g>
      <g className="comet-icon__millennium">
        <path d="M4 14 16 3l12 11-3 3-9-8-9 8z" fill="var(--icon2-red-dark)" />
        <path d="m6 14 10-9 10 9-2 2-8-7-8 7z" fill="var(--icon2-red-light)" />
        <path d="M8 15 16 9l8 6v14H8z" fill="var(--icon2-gold)" stroke="var(--icon2-gold-dark)" />
        <rect x="18" y="18" width="4" height="4" fill="var(--icon2-blue-light)" stroke="var(--icon2-blue-dark)" />
        <rect x="11" y="19" width="5" height="10" fill="var(--icon2-blue)" />
      </g>
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <g className="comet-icon__legacy" transform="scale(2)">
        <circle cx="6.5" cy="6.5" r="4.5" fill="none" stroke="var(--dk-shadow)" strokeWidth="2" />
        <rect x="10.5" y="11" width="2" height="5" fill="var(--dk-shadow)" transform="rotate(-45 11.5 13.5)" />
      </g>
      <g className="comet-icon__millennium">
        <circle cx="13" cy="12" r="9" fill="var(--icon2-blue-light)" stroke="var(--icon2-steel-dark)" strokeWidth="2" />
        <path d="M5 12h16M13 3c-5 5-5 13 0 18M13 3c5 5 5 13 0 18" fill="none" stroke="var(--icon2-blue)" />
        <path d="m19 19 10 10" stroke="var(--icon2-steel-dark)" strokeWidth="6" />
        <path d="m19 19 10 10" stroke="var(--icon2-steel-light)" strokeWidth="3" />
        <path d="M7 7a8 8 0 0 1 8-3" fill="none" stroke="var(--icon2-paper)" strokeWidth="2" />
      </g>
    </svg>
  );
}

function FavouritesIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <g className="comet-icon__legacy" transform="scale(2)">
        <polygon
          points="8,1 10,6 15,6 11,9.5 12.5,15 8,11.8 3.5,15 5,9.5 1,6 6,6"
          fill="var(--icon-yellow)"
          stroke="var(--dk-shadow)"
          strokeWidth="0.75"
        />
      </g>
      <g className="comet-icon__millennium">
        <path d="m17 2 4 10h10l-8 7 3 11-9-6-9 6 3-11-8-7h10z" fill="var(--icon2-blue-dark)" />
        <path d="m16 3 4 11h9l-8 6 3 8-8-5-8 5 3-8-8-6h9z" fill="var(--icon2-gold)" stroke="var(--icon2-gold-dark)" />
        <path d="m16 6 2 8h-5z" fill="var(--icon2-gold-light)" />
      </g>
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <g className="comet-icon__legacy" transform="scale(2)">
        <rect x="1" y="3" width="14" height="10" fill="var(--field)" stroke="var(--dk-shadow)" strokeWidth="1" />
        <polyline points="1,3 8,9 15,3" fill="none" stroke="var(--icon-blue)" strokeWidth="1" />
      </g>
      <g className="comet-icon__millennium">
        <path d="M3 7h26v20H3z" fill="var(--icon2-steel-dark)" />
        <path d="M5 9h22v16H5z" fill="var(--icon2-paper)" />
        <path d="m5 9 11 9L27 9" fill="var(--icon2-blue-light)" stroke="var(--icon2-blue-dark)" strokeWidth="2" />
        <path d="m5 25 8-8 3 3 3-3 8 8" fill="var(--icon2-steel-light)" stroke="var(--icon2-steel-dark)" />
        <rect x="22" y="4" width="7" height="7" fill="var(--icon2-red)" stroke="var(--icon2-red-dark)" />
      </g>
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
          aria-label={btn.label}
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
