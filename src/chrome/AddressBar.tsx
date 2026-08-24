/**
 * The address bar (§18.1, §17.1). Shows the live URL with a document icon
 * and a dropdown of visited URLs — "This is where lookalike domains are
 * caught." Editable is not required, so this is a read-only field plus a
 * history dropdown.
 *
 * The `Go` button is always in the DOM behind a visibility token, so visual
 * milestones never require this component to branch or change structure.
 */
import { useEffect, useRef, useState } from 'react';
import type { AddressBarProps } from './Chrome.types';
import { noop } from './Chrome.types';

function DocumentIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="comet-addressbar__doc-icon">
      <polygon points="3,1 10,1 13,4 13,15 3,15" fill="var(--field)" stroke="var(--dk-shadow)" strokeWidth="1" />
      <polyline points="10,1 10,4 13,4" fill="none" stroke="var(--dk-shadow)" strokeWidth="1" />
      <rect x="5" y="7" width="6" height="1" fill="var(--shadow)" />
      <rect x="5" y="9" width="6" height="1" fill="var(--shadow)" />
      <rect x="5" y="11" width="4" height="1" fill="var(--shadow)" />
    </svg>
  );
}

export function AddressBar({
  url,
  visitedUrls = [],
  onSelectUrl = noop,
  onGo = noop,
}: AddressBarProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  return (
    <div className="chrome comet-addressbar">
      <span className="bevel-out comet-addressbar__label">Address</span>
      <div className="sunken-field comet-addressbar__field" ref={rootRef}>
        <DocumentIcon />
        <span className="comet-addressbar__url">{url}</span>
        <button
          type="button"
          className="comet-addressbar__dropdown-btn"
          aria-label="Visited URLs"
          aria-expanded={open}
          disabled={visitedUrls.length === 0}
          onClick={() => setOpen((v) => !v)}
        >
          ▾
        </button>
        {open && visitedUrls.length > 0 && (
          <ul className="bevel-out comet-addressbar__dropdown" role="listbox">
            {visitedUrls.map((visited) => (
              <li key={visited}>
                <button
                  type="button"
                  className="comet-addressbar__dropdown-item"
                  onClick={() => {
                    setOpen(false);
                    onSelectUrl(visited);
                  }}
                >
                  <DocumentIcon />
                  <span>{visited}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button type="button" className="bevel-out comet-addressbar__go" onClick={onGo}>
        Go
      </button>
    </div>
  );
}
