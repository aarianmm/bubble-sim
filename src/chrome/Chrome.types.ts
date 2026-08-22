/**
 * BUBBLE — the chrome props contract (Step 12, §18.1).
 *
 * Every component in /chrome is static this step: no navigation logic, no
 * game state, no time. Everything is a prop. Steps 13–15 (router, left-nav
 * clock, presenter tools) wire real values into these shapes without
 * touching a single component defined here.
 *
 * §25.1 hard rule: no component may know which era it is in. These types
 * carry no `era` field anywhere — era-dependent look lives entirely in
 * tokens.css, read automatically off `:root[data-era]`.
 */

import type { ReactNode } from 'react';

/* ------------------------------------------------------------------ *
 * Shared primitives
 * ------------------------------------------------------------------ */

/** §18.1 status bar left segment. */
export type LoadState =
  | { kind: 'done' }
  | { kind: 'opening'; url: string }
  | { kind: 'transferring' }
  /** §19.3 — link-hover URL preview. A real browser's status bar shows the
   * raw target URL, not "Opening page…", while the pointer is merely
   * hovering (no navigation has happened yet). Set by router.tsx whenever a
   * <GameLink> or useLinkPreview() consumer is hovered/focused; it always
   * takes priority over the real load state so the chrome can never show
   * both an in-progress load and a hover preview at once. */
  | { kind: 'link-hover'; url: string };

/** The portal's own three sections (§17.1), as shown in the left nav. */
export type NavSection = 'home' | 'inbox' | 'money';

/** A no-op the real handler steps in for. Never renders as "broken". */
export const noop = (): void => {};

/* ------------------------------------------------------------------ *
 * TitleBar
 * ------------------------------------------------------------------ */

export interface TitleBarProps {
  /** Full title bar text, e.g. "BUBBLE — Comet Navigator" or a page title. */
  title: string;
  /** Clicking ✕ prompts "Are you sure you want to leave?" (§18.1); this
   * fires only after the player confirms. */
  onCloseConfirmed?: () => void;
}

/* ------------------------------------------------------------------ *
 * MenuBar — File / Edit / View / Go / Favorites / Help (§18.1)
 *
 * Only the items named below do anything; every other item in every menu
 * renders disabled. "Take the live-item handlers as props with no-op
 * defaults so later steps can wire them."
 * ------------------------------------------------------------------ */

export interface MenuBarProps {
  onNewRun?: () => void;
  onQuit?: () => void;
  /** View > Money as 1996 £ — the dual-money toggle (§19.4). */
  onToggleMoneyBase?: () => void;
  /** Whether 1996 £ is currently the primary figure — drives the checkmark. */
  moneyBaseIs1996?: boolean;
  /** View > Sounds — global mute (§23). */
  onToggleSounds?: () => void;
  soundsOn?: boolean;
  onAbout?: () => void;
  onDisclaimer?: () => void;
}

/* ------------------------------------------------------------------ *
 * Toolbar — Back / Forward / Stop / Refresh / Home / Search / Favourites /
 * Mail (§18.1). Era A vs B icon size and label visibility is a CSS token
 * (--toolbar-icon-size, --toolbar-label-display) — this component always
 * renders both the icon and the label.
 * ------------------------------------------------------------------ */

export interface ToolbarProps {
  canGoBack?: boolean;
  canGoForward?: boolean;
  onBack?: () => void;
  onForward?: () => void;
  /** Only meaningful mid-load; static step defaults to disabled. */
  canStop?: boolean;
  onStop?: () => void;
  onRefresh?: () => void;
  onHome?: () => void;
  onSearch?: () => void;
  onFavourites?: () => void;
  onMail?: () => void;
  /** Envelope badge — the Mail icon shows a badge on unread (§18.1). */
  unreadCount?: number;
  /** Transient, presentation-only notice anchored to the Mail icon. */
  newMailNotice?: string | null;
}

/* ------------------------------------------------------------------ *
 * AddressBar
 * ------------------------------------------------------------------ */

export interface AddressBarProps {
  /** The live URL. Always matches the page, including on scam sites (§19.3). */
  url: string;
  /** Dropdown of visited URLs — where lookalike domains get caught (§17.1). */
  visitedUrls?: string[];
  onSelectUrl?: (url: string) => void;
  /** Era B only shows a Go button; the token --go-button-display controls
   * visibility, so this handler is always wired, never conditionally. */
  onGo?: () => void;
}

/* ------------------------------------------------------------------ *
 * StatusBar
 * ------------------------------------------------------------------ */

export interface StatusBarProps {
  loadState: LoadState;
  /** 0..100. Centre segment. */
  progressPct?: number;
  /** Right: zone indicator, e.g. "🌐 Internet". */
  zoneLabel?: string;
  /** Era B only — the popup-blocker count. Rendered unconditionally; the
   * --popup-blocker-display token hides it in Era A. */
  popupsBlockedCount?: number;
}

/* ------------------------------------------------------------------ *
 * Sidebar — the portal's left nav shell (§18.1).
 *
 * Owns HOME / INBOX (n) / MY MONEY and a divider. Does NOT own the clock or
 * the year spine (Step 14) — those are slots, passed in as nodes.
 * ------------------------------------------------------------------ */

export interface SidebarProps {
  active?: NavSection;
  onNavigate?: (section: NavSection) => void;
  unreadCount?: number;
  /** §20.3 — true for 200ms after the count rises, driving the single bold
   * flash that is the entire visual weight of the quietest tier. */
  unreadFlashing?: boolean;
  /** Slot: Step 14 owns the current-date readout (e.g. "SEP 1998"). */
  dateSlot?: ReactNode;
  /** Slot: Step 14 owns play/pause and fast-forward. */
  timeControlsSlot?: ReactNode;
  /** Slot: Step 14 owns the 1996–2006 year progress spine. */
  yearSpineSlot?: ReactNode;
}

/* ------------------------------------------------------------------ *
 * Window — composes everything around a content area (§18.1).
 * ------------------------------------------------------------------ */

export interface WindowProps {
  titleBar: TitleBarProps;
  menuBar?: MenuBarProps;
  toolbar?: ToolbarProps;
  addressBar: AddressBarProps;
  statusBar: StatusBarProps;
  sidebar?: SidebarProps;
  children?: ReactNode;
}
