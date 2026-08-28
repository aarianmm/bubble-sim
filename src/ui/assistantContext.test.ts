/**
 * The fairness contract in executable form (PLAN-COMET-ASSISTANT.md §1, C3).
 * `buildAssistantContext` must never emit anything the player cannot
 * currently see. This file constructs a state deliberately loaded with
 * every kind of spoiler — a held scam vehicle, unread mail with a body, a
 * fake system-dialog popup, and a future-dated script event — and asserts
 * none of it survives serialization.
 */
import { describe, expect, it } from 'vitest';
import { buildAssistantContext } from './assistantContext';
import { monthIndex } from '../sim/month';
import { VEHICLES } from '../sim/vehicles';
import type {
  GameState,
  Holding,
  MailItem,
  PopupItem,
  RunFlags,
  RunStats,
  ScriptEvent,
} from '../sim/types';

/* ------------------------------------------------------------------ *
 * Fixtures — mirrors the makeState/makeHolding shape src/pages/mail.test.tsx
 * and src/sim/tick.test.ts already use (§26.2 rule 3: no shared fixture
 * file; each test file owns its own).
 * ------------------------------------------------------------------ */

function baseFlags(overrides: Partial<RunFlags> = {}): RunFlags {
  return {
    onScamList: false,
    incomeSuspendedMonths: 0,
    era: 'a',
    moneyBase: 'period',
    everOpenedInbox: true,
    everOpenedFactSheet: true,
    ...overrides,
  };
}

function baseStats(overrides: Partial<RunStats> = {}): RunStats {
  return {
    peakWealth: 0,
    peakWealth1996: 0,
    finalWealth: 0,
    feesPaid: 0,
    trackerCounterfactualFees: 0,
    scamsFunded: 0,
    scamsDodged: 0,
    forcedSales: 0,
    monthsUnderwater: 0,
    scamsFundedIds: [],
    scamsDodgedIds: [],
    redFlagsMissed: [],
    ...overrides,
  };
}

function baseState(overrides: Partial<GameState> = {}): GameState {
  return {
    month: monthIndex(1998, 9),
    status: 'running',
    cash: 500,
    holdings: {},
    unlocked: [],
    debt: null,
    inbox: [],
    popups: [],
    dialogs: [],
    flags: baseFlags(),
    stats: baseStats(),
    wealthHistory: [],
    marketHistory: [],
    deathMonth: null,
    deathCauseId: null,
    decisions: [],
    ...overrides,
  };
}

function makeHolding(overrides: Partial<Holding> = {}): Holding {
  return {
    vehicleId: 'fenwick-index',
    value: 1000,
    contributed: 900,
    withdrawn: 0,
    feesPaid: 12,
    targetPct: 50,
    locked: false,
    unlockedMonth: monthIndex(1997, 1),
    collapsed: false,
    ...overrides,
  };
}

// A real MAIL_MESSAGES content id (src/content/messages.ts) — Ashcombe's
// mediocre managed-portfolio pitch — with distinctive, non-empty body
// prose, reused across the read/unread fixtures below. Deliberately a
// `msg.*` key, not a `pop.*` one: `buildAssistantContext` mirrors
// `Mail.tsx`'s own MAIL_MESSAGES-only lookup (see assistantContext.ts's
// file header), so a fixture must use a body that actually resolves there.
const ASHCOMBE_CONTENT_ID = 'msg.ashcombe-managed';
const ASHCOMBE_BODY_TELL = 'rebalanced quarterly';

function makeMail(overrides: Partial<MailItem> = {}): MailItem {
  return {
    id: 'm1',
    eventId: 'ev.m1',
    from: 'Ashcombe Wealth Management',
    subject: "A managed portfolio, for people who'd rather not choose",
    contentId: ASHCOMBE_CONTENT_ID,
    cls: 'mediocre',
    arrivedMonth: monthIndex(1998, 8),
    expiresMonth: monthIndex(1998, 10),
    status: 'unread',
    ...overrides,
  };
}

function makePopup(overrides: Partial<PopupItem> = {}): PopupItem {
  return {
    id: 'p1',
    eventId: 'ev.p1',
    title: 'System warning',
    contentId: 'pop.security-alert-2003-04',
    cls: 'scam',
    openedMonth: monthIndex(1998, 9),
    closesMonth: monthIndex(1998, 9),
    x: 40,
    y: 40,
    width: 320,
    height: 180,
    ...overrides,
  };
}

const SPOILER_VEHICLE = 'halcyon-reserve' as const; // §11.5 scam, isScam: true

describe('buildAssistantContext (plan §1 / §5) — the no-spoiler contract', () => {
  it('never emits isScam, collapseMonth, sellableAfterCollapse or tier for a scam the player holds', () => {
    const state = baseState({
      holdings: {
        [SPOILER_VEHICLE]: makeHolding({ vehicleId: SPOILER_VEHICLE, value: 300, feesPaid: 8 }),
      },
      unlocked: [SPOILER_VEHICLE],
    });
    const vehicle = VEHICLES[SPOILER_VEHICLE];
    expect(vehicle.isScam).toBe(true); // sanity — the fixture really is a scam

    const json = JSON.stringify(buildAssistantContext(state, { url: 'http://www.bubble.net/money', title: 'BUBBLE — My money' }));

    expect(json).not.toContain('isScam');
    expect(json).not.toContain('collapseMonth');
    expect(json).not.toContain('sellableAfterCollapse');
    expect(json).not.toContain('"tier"');
    // The display name IS allowed through — the player sees it on /money.
    expect(json).toContain(vehicle.name);
  });

  it('never emits the body of unread mail, but does emit sender/subject/expiry', () => {
    const unread = makeMail({ id: 'unread-1', status: 'unread' });
    const state = baseState({ inbox: [unread] });

    const context = buildAssistantContext(state, { url: 'http://www.bubble.net/mail', title: 'BUBBLE Mail — inbox' });
    const json = JSON.stringify(context);

    expect(context.inbox).toHaveLength(1);
    expect(context.inbox[0].unread).toBe(true);
    expect(context.inbox[0].body).toBeUndefined();
    expect(context.inbox[0].from).toBe(unread.from);
    expect(context.inbox[0].subject).toBe(unread.subject);
    // Confirm the actual message body text is genuinely absent, not just the
    // `body` key — spot-check a distinctive phrase from the real content.
    expect(json).not.toContain(ASHCOMBE_BODY_TELL);
  });

  it('DOES emit the body of opened (read) mail — the fairness contract cuts both ways', () => {
    const read = makeMail({ id: 'read-1', status: 'read' });
    const state = baseState({ inbox: [read] });

    const context = buildAssistantContext(state, { url: 'http://www.bubble.net/mail', title: 'BUBBLE Mail — inbox' });
    const json = JSON.stringify(context);

    expect(context.inbox[0].unread).toBe(false);
    expect(context.inbox[0].body).toBeDefined();
    expect(context.inbox[0].body!.length).toBeGreaterThan(0);
    expect(json).toContain(ASHCOMBE_BODY_TELL);
  });

  it('never emits a popup imitatesDialog tell — titles only', () => {
    const fakeDialogPopup = makePopup({ title: 'System warning', imitatesDialog: true });
    const state = baseState({ popups: [fakeDialogPopup] });

    const context = buildAssistantContext(state, { url: 'http://www.bubble.net/home', title: 'BUBBLE — Your account' });
    const json = JSON.stringify(context);

    expect(context.popups).toEqual([{ title: 'System warning' }]);
    expect(json).not.toContain('imitatesDialog');
  });

  it('never reflects a date beyond the current month, and never touches the script at all', () => {
    const state = baseState({ month: monthIndex(1999, 3), wealthHistory: [100, 150, 200] });
    // A future ScriptEvent — never passed to buildAssistantContext (the
    // function has no parameter for it), constructed here only to prove
    // its distinctive marker cannot appear in the output by any path.
    const futureEvent: ScriptEvent = {
      id: 'ev.future-marker-zzq',
      date: '2003-01',
      month: monthIndex(2003, 1),
      channel: 'DLG',
      cls: 'shock',
      contentId: 'msg.future-marker-zzq',
      blocksTime: true,
    };
    void futureEvent; // exists only for the assertion below

    const context = buildAssistantContext(state, { url: 'http://www.bubble.net/home', title: 'BUBBLE — Your account' });
    const json = JSON.stringify(context);

    expect(context.date).toBe('March 1999');
    expect(json).not.toContain('future-marker-zzq');
    expect(json).not.toContain('"2003-01"');
  });

  it("never emits red-flag ids, even when the current page is that scam vehicle's fact sheet", () => {
    const vehicle = VEHICLES[SPOILER_VEHICLE];
    expect(vehicle.factSheet.redFlags.length).toBeGreaterThanOrEqual(2); // §11.2 rule 1 sanity check

    const state = baseState();
    const context = buildAssistantContext(state, {
      url: `${vehicle.url}/factsheet`,
      title: vehicle.name,
    });
    const json = JSON.stringify(context);

    expect(context.factSheet).toBeDefined();
    expect(context.factSheet!.name).toBe(vehicle.name);
    for (const flag of vehicle.factSheet.redFlags) {
      expect(json).not.toContain(flag);
    }
    expect(json).not.toContain('redFlags');
    expect(json).not.toContain('returnChart');
  });

  it("shows the fact sheet's ten public fields on an offer page, verbatim, lookalike domain included", () => {
    const vehicle = VEHICLES[SPOILER_VEHICLE];
    const state = baseState();
    const context = buildAssistantContext(state, { url: vehicle.url, title: vehicle.name });

    expect(context.page.url).toBe(vehicle.url);
    expect(context.page.url).toContain('.gg'); // §17.1 — the lookalike-domain tell, visible verbatim
    expect(context.factSheet).toEqual({
      view: 'offer',
      name: vehicle.factSheet.name,
      manager: vehicle.factSheet.manager,
      twelveMonthReturn: vehicle.factSheet.twelveMonthReturn,
      annualFee: vehicle.factSheet.annualFee,
      exitFee: vehicle.factSheet.exitFee,
      holdings: vehicle.factSheet.holdings,
      launched: vehicle.factSheet.launched,
      regulatedBy: vehicle.factSheet.regulatedBy,
      minimumReturn: vehicle.factSheet.minimumReturn,
      introducerCommission: vehicle.factSheet.introducerCommission,
    });
  });

  it('omits factSheet entirely on an ordinary portal page', () => {
    const state = baseState();
    const context = buildAssistantContext(state, { url: 'http://www.bubble.net/home', title: 'BUBBLE — Your account' });
    expect(context.factSheet).toBeUndefined();
    expect(JSON.stringify(context)).not.toContain('factSheet');
  });

  it('stays within the ~4 KB budget for a maximally-loaded late-game state', () => {
    const inbox: MailItem[] = [];
    const contentIds = [
      ASHCOMBE_CONTENT_ID,
      'msg.quicksilver-com',
      'msg.restitution-partners',
      'msg.fenwick-world',
    ];
    for (let i = 0; i < 30; i++) {
      inbox.push(
        makeMail({
          id: `mail-${i}`,
          contentId: contentIds[i % contentIds.length],
          status: i % 2 === 0 ? 'read' : 'unread',
          arrivedMonth: monthIndex(1996, 1) + i,
          expiresMonth: monthIndex(1996, 1) + i + 6,
        }),
      );
    }

    const holdings: GameState['holdings'] = {};
    const unlocked: GameState['unlocked'] = [];
    for (const id of [
      'fenwick-index',
      'fenwick-world',
      'northmoor-bond',
      'kingsley-gilt',
      'marlow-corporate-bond',
      'brightwell-pension',
      'technova-growth',
      'ashcombe-managed',
      'granville-plc',
      'quicksilver-com',
      SPOILER_VEHICLE,
    ] as const) {
      holdings[id] = makeHolding({ vehicleId: id, value: 500, feesPaid: 40 });
      unlocked.push(id);
    }

    const wealthHistory = Array.from({ length: 120 }, (_, i) => 1000 + i * 37);

    const popups: PopupItem[] = [
      makePopup({ id: 'p1', title: "Congratulations! You are today's visitor" }),
      makePopup({ id: 'p2', title: 'Free credit check', imitatesDialog: false }),
      makePopup({ id: 'p3', title: 'System warning', imitatesDialog: true }),
    ];

    const state = baseState({
      month: monthIndex(2006, 6),
      cash: 4200,
      holdings,
      unlocked,
      inbox,
      popups,
      wealthHistory,
      stats: baseStats({ feesPaid: 812, forcedSales: 3 }),
    });

    const context = buildAssistantContext(state, {
      url: `${VEHICLES[SPOILER_VEHICLE].url}/factsheet`,
      title: 'Halcyon Reserve',
    });
    const bytes = new TextEncoder().encode(JSON.stringify(context)).length;
    expect(bytes).toBeLessThanOrEqual(4096);
  });
});
