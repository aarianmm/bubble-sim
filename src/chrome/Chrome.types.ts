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
  /** Full title bar text, e.g. "BUBBLE — Bubble Navigator" or a page title. */
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
  /** View > Money as 2026 £ — the dual-money toggle. */
  onToggleMoneyBase?: () => void;
  /** Whether 2026 £ is currently the primary figure — drives the checkmark. */
  moneyBaseIs2026?: boolean;
  /** View > Sounds — global mute (§23). */
  onToggleSounds?: () => void;
  soundsOn?: boolean;
  onAbout?: () => void;
  onDisclaimer?: () => void;
  /** Help > Comet Assistant (PLAN-COMET-ASSISTANT.md, Step C5) — opens the
   * same panel the toolbar throbber does, via useAssistant.ts's lifted
   * `open` state. Follows the same live-item idiom as onAbout/onDisclaimer;
   * every other Help item stays disabled. */
  onOpenAssistant?: () => void;
}

/* ------------------------------------------------------------------ *
 * Toolbar — Back / Forward / Stop / Refresh / Home / Search / Favourites /
 * Mail (§18.1). Milestone-specific sizing and the visible SVG art group are
 * CSS tokens; this component always renders one icon slot and one label.
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
  /** Rendered at the right end of the toolbar row, after the button
   * inventory above — the throbber spot (PLAN-COMET-ASSISTANT.md §2: "the
   * exact spot where IE4 kept its animated throbber logo"). Optional and
   * additive: omitting it reproduces the exact toolbar this file always
   * rendered, so no existing caller or test needs to change. Right-alignment
   * is the slotted content's own concern (e.g. `.comet-assistant`'s
   * `margin-left: auto` in assistant.css) — this component stays ignorant of
   * what, if anything, it is carrying. */
  rightSlot?: ReactNode;
}

/* ------------------------------------------------------------------ *
 * AssistantButton / AssistantPanel — the Comet Assistant
 * (PLAN-COMET-ASSISTANT.md, Step C1; chat wiring Step C5).
 *
 * Step C1 had the button own its open/closed state locally (the same
 * uncontrolled pattern AddressBar's visited-URL dropdown and MenuBar's open
 * menu use). Step C5 lifts that state into `useAssistant.ts` instead,
 * because `Help > Comet Assistant` (MenuBarProps.onOpenAssistant) must open
 * the very same panel the toolbar throbber does — two independent pieces of
 * UI driving one open/closed value needs a single owner. AssistantButton is
 * now a plain controlled component; AssistantPanel and AssistantBalloon are
 * composed alongside it by whoever mounts them (App.tsx's AppShell), inside
 * a shared `.comet-assistant` positioning wrapper (assistant.css) so the
 * panel/balloon's `position: absolute` still anchors under the button.
 * ------------------------------------------------------------------ */

/** One transcript turn (PLAN-COMET-ASSISTANT.md §8). Plain data, not game
 * state — lives here rather than in /ui so /chrome components stay
 * importable without a /ui dependency for their prop types alone. */
export interface AssistantTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantButtonProps {
  /** Defaults keep the standalone `<AssistantButton />` in VisualGallery.tsx
   * compiling and rendering (closed, inert) without that file needing to
   * adopt the controlled contract — it is a static design preview, not a
   * caller that needs real open/close behaviour. */
  open?: boolean;
  onToggle?: () => void;
}

export interface AssistantPanelProps {
  /** Closes the panel. Wired to the ✕ button and to Escape. */
  onClose: () => void;
  /** In-memory transcript owned by useAssistant.ts; cleared on run reset. */
  transcript: AssistantTurn[];
  /** True while a question is in flight (network attempt or fallback
   * resolution) — disables the input so a second question can't jump the
   * queue mid-stream. */
  inFlight: boolean;
  /** Latches true once any reply in this run came from the offline
   * fallback (plan §7) — drives the status line, never clears itself. */
  offline: boolean;
  /** Send-on-Enter and the Ask button both call this; empty input is a
   * no-op the panel itself enforces. */
  onSend: (question: string) => void;
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
  /** The token seam can reveal a Go button without changing component
   * structure; current milestones keep the visible control inventory fixed. */
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
  /** Rendered unconditionally behind a visibility token; current milestones
   * keep it hidden so the status-bar functions do not change. */
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
