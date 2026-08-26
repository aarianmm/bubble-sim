/**
 * URL -> page. The router (Step 13) reads this; nothing else does.
 *
 * Each page owns exactly one file and appears here once, so page agents never
 * touch a shared file (§26.2 rule 3: steps marked parallel touch disjoint
 * files). Offer pages are matched by prefix — every vehicle's site is one
 * component driven by /content.
 */

import type { ComponentType } from 'react';
import { Home } from './Home';
import { Mail } from './Mail';
import { MoneyPage } from './Money';
import { Offer } from './Offer';
import { DeathCard } from './DeathCard';

export interface PageDef {
  /** Shown in the title bar. §19.3: the title bar always matches the page. */
  title: string;
  component: ComponentType;
}

/** §17.1 — the portal's own pages. */
export const PORTAL_ROUTES: Record<string, PageDef> = {
  'http://www.bubble.net/home': { title: 'BUBBLE — Your account', component: Home },
  'http://www.bubble.net/mail': { title: 'BUBBLE Mail — inbox', component: Mail },
  'http://www.bubble.net/money': { title: 'BUBBLE — My money', component: MoneyPage },
  'http://www.bubble.net/over': { title: 'BUBBLE — Game Over', component: DeathCard },
};

export const HOME_URL = 'http://www.bubble.net/home';
export const MAIL_URL = 'http://www.bubble.net/mail';
export const MONEY_URL = 'http://www.bubble.net/money';
export const GAME_OVER_URL = 'http://www.bubble.net/over';

/** Popups belong to the running Home surface. Reading, allocation, offer,
 * ending and unknown routes keep arrivals queued until Home is restored. */
export function shouldPresentPopupUrl(url: string): boolean {
  return url === HOME_URL;
}

/** Home and the Mail inbox are normal running surfaces. Opening a message
 * adds its own pause reason; every other current or future route pauses. */
export function shouldAutoPauseSimulationUrl(url: string): boolean {
  return url !== HOME_URL && url !== MAIL_URL;
}

/** Any URL not in PORTAL_ROUTES is an external offer site (§17.1, §22.3). */
export const OFFER_PAGE: PageDef = { title: '', component: Offer };

export function resolveRoute(url: string): PageDef {
  return PORTAL_ROUTES[url] ?? OFFER_PAGE;
}
