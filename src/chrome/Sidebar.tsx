/**
 * The left nav (§18.1) — the portal's own navigation, styled as a period
 * sidebar. Owns HOME / INBOX (n) / MY MONEY and the divider beneath them.
 *
 * Does NOT own the clock, the time controls or the year spine — Step 14
 * owns those. This component only exposes named slots for them so it can
 * compose without ever importing that step's code.
 */
import type { SidebarProps } from './Chrome.types';
import { noop } from './Chrome.types';

const SECTIONS: { key: SidebarProps['active'] & string; label: string }[] = [
  { key: 'home', label: 'HOME' },
  { key: 'inbox', label: 'INBOX' },
  { key: 'money', label: 'MY MONEY' },
];

export function Sidebar({
  active = 'home',
  onNavigate = noop,
  unreadCount = 0,
  unreadFlashing = false,
  dateSlot = null,
  timeControlsSlot = null,
  yearSpineSlot = null,
}: SidebarProps) {
  return (
    <nav className="chrome comet-sidebar window-face">
      <ul className="comet-sidebar__list">
        {SECTIONS.map((section) => (
          <li key={section.key}>
            <button
              type="button"
              className={
                'comet-sidebar__item' +
                (active === section.key ? ' comet-sidebar__item--active' : '')
              }
              onClick={() => onNavigate(section.key)}
              aria-current={active === section.key ? 'page' : undefined}
            >
              <span className="comet-sidebar__bullet" aria-hidden="true">
                ▸
              </span>
              <span>{section.label}</span>
              {section.key === 'inbox' && (
                <span
                  className={`comet-sidebar__count${unreadFlashing ? ' comet-sidebar__count--flash' : ''}`}
                >
                  ({unreadCount})
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      <div className="comet-sidebar__divider" role="separator" />
      <div className="comet-sidebar__date-slot">{dateSlot}</div>
      <div className="comet-sidebar__time-controls-slot">{timeControlsSlot}</div>
      <div className="comet-sidebar__year-spine-slot">{yearSpineSlot}</div>
    </nav>
  );
}
