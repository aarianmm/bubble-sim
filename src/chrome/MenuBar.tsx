/**
 * The menu bar (§18.1): File / Edit / View / Go / Favorites / Help. Real
 * dropdowns, mostly greyed out — "correct for the era and it hides the
 * settings where they belong." Only the six items named in §26.2 Step 12 do
 * anything; every other entry renders `disabled`.
 *
 * Live-item handlers are props with no-op defaults (Chrome.types.ts) so
 * later steps can wire New run / Quit / the money-base toggle / Sounds /
 * About / the disclaimer without touching this file.
 */
import { useEffect, useRef, useState } from 'react';
import type { MenuBarProps } from './Chrome.types';
import { noop } from './Chrome.types';

type MenuEntry =
  | { kind: 'separator' }
  | {
      kind: 'item';
      label: string;
      onSelect?: () => void;
      disabled?: boolean;
      checked?: boolean;
    };

interface Menu {
  label: string;
  items: MenuEntry[];
}

export function MenuBar({
  onNewRun = noop,
  onQuit = noop,
  onToggleMoneyBase = noop,
  moneyBaseIs2026 = false,
  onToggleSounds = noop,
  soundsOn = true,
  onAbout = noop,
  onDisclaimer = noop,
}: MenuBarProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const menus: Menu[] = [
    {
      label: 'File',
      items: [
        { kind: 'item', label: 'New run', onSelect: onNewRun },
        { kind: 'separator' },
        { kind: 'item', label: 'Open...', disabled: true },
        { kind: 'item', label: 'Save As...', disabled: true },
        { kind: 'item', label: 'Print...', disabled: true },
        { kind: 'separator' },
        { kind: 'item', label: 'Quit', onSelect: onQuit },
      ],
    },
    {
      label: 'Edit',
      items: [
        { kind: 'item', label: 'Cut', disabled: true },
        { kind: 'item', label: 'Copy', disabled: true },
        { kind: 'item', label: 'Paste', disabled: true },
        { kind: 'separator' },
        { kind: 'item', label: 'Select All', disabled: true },
        { kind: 'item', label: 'Find on this Page...', disabled: true },
      ],
    },
    {
      label: 'View',
      items: [
        { kind: 'item', label: 'Toolbar', disabled: true },
        { kind: 'item', label: 'Status Bar', disabled: true },
        { kind: 'separator' },
        {
          kind: 'item',
          label: 'Money as 2026 £',
          onSelect: onToggleMoneyBase,
          checked: moneyBaseIs2026,
        },
        { kind: 'item', label: 'Sounds', onSelect: onToggleSounds, checked: soundsOn },
        { kind: 'separator' },
        { kind: 'item', label: 'Refresh', disabled: true },
      ],
    },
    {
      label: 'Go',
      items: [
        { kind: 'item', label: 'Back', disabled: true },
        { kind: 'item', label: 'Forward', disabled: true },
        { kind: 'item', label: 'Home Page', disabled: true },
      ],
    },
    {
      label: 'Favorites',
      items: [
        { kind: 'item', label: 'Add to Favorites...', disabled: true },
        { kind: 'item', label: 'Organize Favorites...', disabled: true },
      ],
    },
    {
      label: 'Help',
      items: [
        { kind: 'item', label: 'About Bubble Navigator...', onSelect: onAbout },
        { kind: 'item', label: 'This is not financial advice', onSelect: onDisclaimer },
        { kind: 'separator' },
        { kind: 'item', label: 'Contents and Index', disabled: true },
      ],
    },
  ];

  useEffect(() => {
    if (!openMenu) return;
    function handlePointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenMenu(null);
    }
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openMenu]);

  function handleTopClick(label: string) {
    setOpenMenu((cur) => (cur === label ? null : label));
  }

  function handleItemSelect(entry: MenuEntry) {
    if (entry.kind !== 'item' || entry.disabled) return;
    setOpenMenu(null);
    entry.onSelect?.();
  }

  return (
    <div className="chrome comet-menubar" ref={rootRef}>
      {menus.map((menu) => (
        <div className="comet-menubar__menu" key={menu.label}>
          <button
            type="button"
            className={
              'comet-menubar__top' +
              (openMenu === menu.label ? ' comet-menubar__top--open' : '')
            }
            aria-haspopup="menu"
            aria-expanded={openMenu === menu.label}
            onClick={() => handleTopClick(menu.label)}
            onMouseEnter={() => {
              if (openMenu && openMenu !== menu.label) setOpenMenu(menu.label);
            }}
          >
            {menu.label}
          </button>
          {openMenu === menu.label && (
            <div className="comet-menubar__dropdown bevel-out" role="menu">
              {menu.items.map((entry, i) =>
                entry.kind === 'separator' ? (
                  <div className="comet-menubar__separator" key={`sep-${i}`} role="separator" />
                ) : (
                  <button
                    type="button"
                    key={entry.label}
                    className="comet-menubar__item"
                    role="menuitem"
                    disabled={entry.disabled}
                    onClick={() => handleItemSelect(entry)}
                  >
                    <span className="comet-menubar__check" aria-hidden="true">
                      {entry.checked ? '✓' : ''}
                    </span>
                    <span>{entry.label}</span>
                  </button>
                ),
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
