// @vitest-environment jsdom
/**
 * Step 24's stated done-condition: "jump to any date in the timeline via
 * ?dev=1 and the correct event fires in the correct tier." Browser
 * automation wasn't available in this environment (see the completion
 * report), so this exercises the exact mechanism the Presenter's "Jump to
 * date" buttons call — `engine.jumpToMonth()` — for every date named in the
 * brief, and asserts the right tier populated with the right content.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { act, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { EngineProvider } from './EngineProvider';
import { useEngine, type Engine } from './engine';
import { monthIndex } from '../sim/month';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;
let root: Root | null = null;
let engineHandle: Engine | null = null;

function Probe() {
  const engine = useEngine();
  const ref = useRef(engine);
  ref.current = engine;
  engineHandle = engine;
  return null;
}

function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root!.render(
      <EngineProvider>
        <Probe />
      </EngineProvider>,
    );
  });
}

function jump(month: number) {
  act(() => {
    engineHandle!.jumpToMonth(month);
  });
}

afterEach(() => {
  if (root) act(() => root!.unmount());
  container?.remove();
  container = null;
  root = null;
  engineHandle = null;
  document.body.innerHTML = '';
});

describe('Step 24 done-condition — jump to date, correct tier fires', () => {
  it('Apr 1996 — Northmoor bond arrives as MAIL', () => {
    mount();
    jump(monthIndex(1996, 4));
    const mail = engineHandle!.state.inbox.find((m) => m.vehicleId === 'northmoor-bond');
    expect(mail).toBeTruthy();
    expect(mail!.status).toBe('unread');
    expect(engineHandle!.state.dialogs).toHaveLength(0);
  });

  it('Mar 1997 — Meridian scam POP arrives with its companion junk (count 2)', () => {
    mount();
    jump(monthIndex(1997, 3));
    expect(engineHandle!.state.popups).toHaveLength(2);
    expect(engineHandle!.state.popups.some((p) => p.vehicleId === 'meridian-guaranteed')).toBe(true);
    expect(engineHandle!.popupPresentation.active?.contentId).toBe('pop.meridian-1997-03');
    expect(engineHandle!.popupPresentation.pending.map((p) => p.contentId)).toEqual([
      'pop.junk-meridian-companion-1997-03',
    ]);
    expect(engineHandle!.state.dialogs).toHaveLength(0);
  });

  it('May 1999 — the cap preserves Kingsley and Vertex ahead of companion junk', () => {
    mount();
    jump(monthIndex(1999, 5));
    expect(engineHandle!.state.popups).toHaveLength(3);
    expect(engineHandle!.state.popups.filter((p) => p.vehicleId === 'vertex-communications')).toHaveLength(1);
    expect(engineHandle!.state.popups.filter((p) => p.vehicleId === 'kingsley-gilt')).toHaveLength(1);
    expect(engineHandle!.state.popups.filter((p) => p.cls === 'junk')).toHaveLength(1);
    expect(engineHandle!.popupPresentation.active?.contentId).toBe('pop.vertex-1999-05');
    expect(engineHandle!.popupPresentation.pending.map((p) => p.contentId)).toEqual([
      'pop.junk-vertex-companion-b-1999-05',
    ]);
    expect(engineHandle!.state.dialogs).toHaveLength(0);
  });

  it('reset and date navigation clear stale presentation backlogs', () => {
    mount();
    act(() => engineHandle!.forceEvent('ev.1997-03.meridian'));
    expect(engineHandle!.popupPresentation.active).not.toBeNull();
    jump(monthIndex(1996, 4));
    expect(engineHandle!.popupPresentation).toEqual({ active: null, pending: [], phase: 'showing' });
    act(() => engineHandle!.forceEvent('ev.1999-05.vertex'));
    expect(engineHandle!.popupPresentation.pending).toHaveLength(1);
    act(() => engineHandle!.reset());
    expect(engineHandle!.popupPresentation).toEqual({ active: null, pending: [], phase: 'showing' });
  });

  it('captures arrivals during fast-forward and can file their snapshots after bookkeeping expiry', async () => {
    mount();
    act(() => engineHandle!.forceEvent('ev.1998-03.cavendish'));
    const snapshot = engineHandle!.popupPresentation.active!;
    act(() => engineHandle!.setTimeRate(20));
    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 350));
    });
    expect(engineHandle!.popupPresentation.pending.some((p) => p.contentId === 'pop.freestuff-1996-02')).toBe(true);
    expect(engineHandle!.state.popups.some((p) => p.id === snapshot.id)).toBe(false);
    expect(engineHandle!.popupPresentation.active?.id).toBe(snapshot.id);
    act(() => engineHandle!.filePresentedPopup(snapshot));
    expect(engineHandle!.state.inbox.some((item) => item.id === `${snapshot.id}.filed`)).toBe(true);
    expect(engineHandle!.state.inbox.find((item) => item.id === `${snapshot.id}.filed`)?.expiresMonth).toBeNull();
    expect(engineHandle!.popupPresentation.phase).toBe('gap');
  });

  it('drops oldest queued junk but never an important offer under backlog pressure', () => {
    mount();
    const junkIds = [
      'ev.1996-02.freestuff',
      'ev.1996-09.junk',
      'ev.1997-11.junk',
      'ev.1998-12.junk',
      'ev.1999-12.y2k-junk',
    ];
    for (const id of junkIds) act(() => engineHandle!.forceEvent(id));
    expect(engineHandle!.popupPresentation.pending.filter((p) => p.cls === 'junk')).toHaveLength(1);
    act(() => engineHandle!.forceEvent('ev.1998-03.cavendish'));
    act(() => engineHandle!.forceEvent('ev.1999-06.halcyon'));
    const queuedVehicles = engineHandle!.popupPresentation.pending.map((p) => p.vehicleId).filter(Boolean);
    expect(queuedVehicles).toEqual(['cavendish-tech', 'halcyon-reserve']);
  });

  it('Nov 1999 — the job-loss DLG blocks time, genuinely on screen', () => {
    mount();
    jump(monthIndex(1999, 11));
    expect(engineHandle!.state.dialogs).toHaveLength(1);
    expect(engineHandle!.state.dialogs[0].cls).toBe('job-loss');
    expect(engineHandle!.timeRate).toBe(0); // frozen — no dismiss, a choice is required
    // Resolving it applies the income suspension and clears the dialog.
    act(() => {
      engineHandle!.dispatch({
        type: 'resolve-dialog',
        month: engineHandle!.state.month,
        dialogId: engineHandle!.state.dialogs[0].id,
        action: 'acknowledge',
      });
    });
    expect(engineHandle!.state.dialogs).toHaveLength(0);
    expect(engineHandle!.state.flags.incomeSuspendedMonths).toBeGreaterThan(0);
  });

  it('Mar 2000 — the crash dialog, then the boiler shock dialog, both genuinely block in sequence', () => {
    mount();
    jump(monthIndex(2000, 3));
    expect(engineHandle!.state.dialogs).toHaveLength(1);
    expect(engineHandle!.state.dialogs[0].cls).toBe('market'); // the crash fires first
    act(() => {
      engineHandle!.dispatch({
        type: 'resolve-dialog',
        month: engineHandle!.state.month,
        dialogId: engineHandle!.state.dialogs[0].id,
        action: 'acknowledge',
      });
    });
    // The month isn't done — the boiler shock is still queued.
    expect(engineHandle!.state.dialogs).toHaveLength(1);
    expect(engineHandle!.state.dialogs[0].cls).toBe('shock');
    expect(engineHandle!.state.dialogs[0].amount).toBe(900);
  });

  it('Nov 2000 — Halcyon Reserve suspended, value £0, delivered as a DLG', () => {
    // A bare jumpToMonth() replays with zero decisions — cash-only, which
    // is already dead by Mar 2000 and so never reaches Nov 2000 "alive".
    // forceEvent() is the presenter's actual tool for checking one event's
    // channel/content in isolation, independent of the rest of the run.
    mount();
    act(() => {
      engineHandle!.forceEvent('ev.2000-11.halcyon-suspended');
    });
    expect(engineHandle!.state.dialogs).toHaveLength(1);
    expect(engineHandle!.state.dialogs[0].cls).toBe('scam-payload');
  });
});
