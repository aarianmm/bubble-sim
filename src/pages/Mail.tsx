/**
 * `/mail` — the inbox (Step 18, §22.2).
 *
 * "Vehicles only arrive as messages... Triage *is* the game" (§6 decision 2).
 * This page is the triage surface. Its single hardest constraint is §10.3:
 * "Junk, legit and scam rows are visually identical in the inbox list. Only
 * the message body, the site it links to, and the fact sheet distinguish
 * them." Concretely: `MailItem.cls` is never read by any branch in this
 * file that produces a className, an icon, a colour or a sort order — the
 * only per-item inputs to the row's markup are `status` (unread dot),
 * `from`, `subject` and the derived expiry label. `mail.test.tsx` renders
 * the same fields under every class and asserts byte-identical row markup.
 *
 * No preview pane (Era A, §22.2 — "preview pane appears in Era B", out of
 * MVP scope). List <-> single open message, nothing else.
 */
import { useLayoutEffect, useMemo, useState } from 'react';
import { useEngine } from '../ui/engine';
import { GameLink } from '../chrome/router';
import { visibleInbox, unreadCount } from '../sim/selectors';
import type { MailItem } from '../sim/types';
import { DAYS_PER_MONTH, type MonthIndex } from '../sim/month';
import { MAIL_MESSAGES } from '../content/messages';
import { VEHICLES } from '../sim/vehicles';
import './mail.css';

type SortKey = 'from' | 'subject' | 'expires';
type SortDir = 'asc' | 'desc';

/**
 * Remaining days until expiry, or null for "never" (rendered as `—`).
 * `MailItem.expiresMonth` only has month resolution (§10.2's countdown is
 * authored in whole simulated months until Step 24's scheduler exists at
 * finer grain) — floored to at least 1 day so a message still sitting in
 * the visible inbox never reads as "0d", which would look already expired.
 */
function daysUntilExpiry(item: MailItem, currentMonth: MonthIndex): number | null {
  if (item.expiresMonth == null) return null;
  const monthsLeft = item.expiresMonth - currentMonth;
  return Math.max(1, monthsLeft * DAYS_PER_MONTH);
}

function expiresLabel(days: number | null): string {
  return days == null ? '—' : `${days}d`;
}

function sortValue(item: MailItem, key: SortKey, currentMonth: MonthIndex): string | number {
  switch (key) {
    case 'from':
      return item.from.toLowerCase();
    case 'subject':
      return item.subject.toLowerCase();
    case 'expires': {
      const days = daysUntilExpiry(item, currentMonth);
      // Never-expiring sorts after everything with a real countdown.
      return days == null ? Number.POSITIVE_INFINITY : days;
    }
  }
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
}) {
  return (
    <button type="button" className="bevel-out mail-th" onClick={onClick}>
      {label}
      {active ? <span className="mail-th__arrow">{dir === 'asc' ? ' ▲' : ' ▼'}</span> : null}
    </button>
  );
}

export function Mail() {
  const engine = useEngine();
  const { state, dispatch } = engine;
  const inbox = visibleInbox(state);
  const unread = unreadCount(state);

  const [sortKey, setSortKey] = useState<SortKey>('expires');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useLayoutEffect(() => {
    engine.setAutoPaused('mail-message', openId !== null);
    return () => engine.setAutoPaused('mail-message', false);
  }, [engine.setAutoPaused, openId]);

  const sorted = useMemo(() => {
    const rows = [...inbox];
    rows.sort((a, b) => {
      const av = sortValue(a, sortKey, state.month);
      const bv = sortValue(b, sortKey, state.month);
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return rows;
  }, [inbox, sortKey, sortDir, state.month]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function openSelected(id: string) {
    dispatch({ type: 'open-mail', month: state.month, mailId: id });
    setOpenId(id);
  }

  function deleteSelected() {
    if (!selectedId) return;
    dispatch({ type: 'delete-mail', month: state.month, mailId: selectedId });
    if (openId === selectedId) setOpenId(null);
    setSelectedId(null);
  }

  // §22.2 — "[ Delete all ] exists and is a real strategy. It will also
  // delete a windfall. Do not warn the player about that." No confirm(),
  // no dialog — a single dispatch, exactly as free and immediate as
  // deleting one message (§10.2: "deleting is always free and always
  // safe").
  function deleteAll() {
    dispatch({ type: 'delete-all-mail', month: state.month });
    setOpenId(null);
    setSelectedId(null);
  }

  const openItem = openId ? inbox.find((m) => m.id === openId) ?? null : null;

  if (openItem) {
    const body = MAIL_MESSAGES[openItem.contentId]?.body ?? [];
    const vehicle = openItem.vehicleId ? VEHICLES[openItem.vehicleId] : undefined;
    return (
      <div className="mail-page">
        <div className="mail-header">
          <span className="mail-header__title">✉ BUBBLE MAIL — inbox</span>
          <span className="mail-header__unread">{unread} unread</span>
        </div>
        <div className="mail-message sunken-field">
          <div className="mail-message__meta">
            <div>
              <strong>From:</strong> {openItem.from}
            </div>
            <div>
              <strong>Subject:</strong> {openItem.subject}
            </div>
          </div>
          <div className="mail-message__body">
            {body.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          {vehicle ? (
            <div className="mail-message__offer">
              <GameLink href={vehicle.url} className="mail-message__offer-link">
                Go to {vehicle.name} →
              </GameLink>
            </div>
          ) : null}
        </div>
        <div className="mail-actions">
          <button type="button" className="bevel-out" onClick={() => setOpenId(null)}>
            [ Back ]
          </button>
          <button
            type="button"
            className="bevel-out"
            onClick={() => {
              dispatch({ type: 'delete-mail', month: state.month, mailId: openItem.id });
              setOpenId(null);
              setSelectedId(null);
            }}
          >
            [ Delete ]
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mail-page">
      <div className="mail-header">
        <span className="mail-header__title">✉ BUBBLE MAIL — inbox</span>
        <span className="mail-header__unread">{unread} unread</span>
      </div>

      <table className="mail-table sunken-field">
        <thead>
          <tr>
            <th className="mail-col-dot" />
            <th className="mail-col-from">
              <SortHeader
                label="From"
                active={sortKey === 'from'}
                dir={sortDir}
                onClick={() => toggleSort('from')}
              />
            </th>
            <th className="mail-col-subject">
              <SortHeader
                label="Subject"
                active={sortKey === 'subject'}
                dir={sortDir}
                onClick={() => toggleSort('subject')}
              />
            </th>
            <th className="mail-col-expires">
              <SortHeader
                label="Expires"
                active={sortKey === 'expires'}
                dir={sortDir}
                onClick={() => toggleSort('expires')}
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((item) => {
            const days = daysUntilExpiry(item, state.month);
            const isSelected = item.id === selectedId;
            return (
              <tr
                key={item.id}
                data-testid={`mail-row-${item.id}`}
                data-message-id={item.id}
                className={isSelected ? 'mail-row mail-row--selected' : 'mail-row'}
                onClick={() => setSelectedId(item.id)}
                onDoubleClick={() => openSelected(item.id)}
              >
                <td className="mail-col-dot">{item.status === 'unread' ? '●' : ''}</td>
                <td className="mail-col-from">{item.from}</td>
                <td className="mail-col-subject">{item.subject}</td>
                <td className="mail-col-expires">{expiresLabel(days)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mail-actions">
        <button
          type="button"
          className="bevel-out"
          disabled={!selectedId}
          onClick={() => selectedId && openSelected(selectedId)}
        >
          [ Open ]
        </button>
        <button type="button" className="bevel-out" disabled={!selectedId} onClick={deleteSelected}>
          [ Delete ]
        </button>
        <button type="button" className="bevel-out mail-actions__delete-all" onClick={deleteAll}>
          [ Delete all ]
        </button>
      </div>
    </div>
  );
}
