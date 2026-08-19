/**
 * The browser window (§18.1) — composes the title bar, menu bar, toolbar,
 * address bar, sidebar and status bar around a content area with a real
 * 16px scrollbar, at a maximised 1024×768-minimum viewport.
 *
 * Static this step (§26.2 Step 12): every value below is a prop. No
 * navigation logic, no game state, no time. Steps 13–15 wire real values in
 * without editing this file.
 */
import './window.css';
import { TitleBar } from './TitleBar';
import { MenuBar } from './MenuBar';
import { Toolbar } from './Toolbar';
import { AddressBar } from './AddressBar';
import { StatusBar } from './StatusBar';
import { Sidebar } from './Sidebar';
import type { WindowProps } from './Chrome.types';

export function Window({
  titleBar,
  menuBar,
  toolbar,
  addressBar,
  statusBar,
  sidebar,
  children,
}: WindowProps) {
  return (
    <div className="comet-window window-face" data-testid="comet-window">
      <TitleBar {...titleBar} />
      <MenuBar {...menuBar} />
      <Toolbar {...toolbar} />
      <AddressBar {...addressBar} />
      <div className="comet-body">
        <Sidebar {...sidebar} />
        <div className="comet-content win-scrollbar sunken-field">{children}</div>
      </div>
      <StatusBar {...statusBar} />
    </div>
  );
}
