/**
 * Copy for every DLG event: the shocks, the job loss, the year turns, the
 * crash, the Halcyon suspension, the era switch and the win.
 *
 * §20.1 is binding: at most two sentences of body copy, never a [Dismiss]
 * or [Later] button, at most two buttons. §20.4: the dialog channel never
 * carries an offer — every line below tells the truth, however unwelcome.
 */

import type { DialogButton } from '../sim/types';

export interface DialogCopy {
  title: string;
  body: string;
  buttons: DialogButton[];
}

const PAY_OR_SELL: DialogButton[] = [
  { label: 'Pay from cash', action: 'pay-from-cash', isDefault: true },
  { label: 'Sell to cover', action: 'sell-to-cover' },
];

const ACKNOWLEDGE = (label = 'Go on'): DialogButton[] => [
  { label, action: 'acknowledge', isDefault: true },
];

export const DIALOGS: Record<string, DialogCopy> = {
  'start.1996-01': {
    title: 'January 1996',
    body: '£760 a month in, £645 a month out. Nothing saved yet.',
    buttons: ACKNOWLEDGE('Begin'),
  },

  'dlg.shock-1997-09': {
    title: 'Deposit top-up and a phone bill',
    body: 'Your landlord wants another £400 down. BT wants the rest today.',
    buttons: PAY_OR_SELL,
  },

  'dlg.shock-1998-08': {
    title: 'The car failed its MOT',
    body: 'A new one isn’t in the budget. The repair is £500, due now.',
    buttons: PAY_OR_SELL,
  },

  'dlg.job-loss-1999-11': {
    title: 'Redundant',
    body: 'Brightwell Ltd is restructuring. Your last paycheque was October’s.',
    buttons: ACKNOWLEDGE('I see'),
  },

  // §8.3 — the thesis of the game, delivered as a game event. Verbatim.
  'dlg.year-turn-2000-01': {
    title: 'January 2000',
    body: 'This year, your pay covers your life exactly. From here it doesn’t.',
    buttons: ACKNOWLEDGE(),
  },

  'dlg.crash-2000-03': {
    title: 'The market has fallen sharply',
    body: 'The NASDAQ fell 9% overnight. Every fund on your screen is red.',
    buttons: ACKNOWLEDGE(),
  },

  'dlg.shock-2000-03-boiler': {
    title: 'The boiler has gone',
    body: 'It needs replacing today, not repairing. £900.',
    buttons: PAY_OR_SELL,
  },

  'dlg.halcyon-suspended-2000-11': {
    title: 'HALCYON RESERVE — SUSPENDED PENDING REVIEW',
    body: 'Seventeen months of reported returns, and then nothing. Investor balances are now valued at £0.',
    buttons: ACKNOWLEDGE(),
  },

  'dlg.shock-2001-09-trough': {
    title: 'Another bill, at the worst possible time',
    body: 'The market is still down 40% from the peak. This one is £900, due now.',
    buttons: PAY_OR_SELL,
  },

  'dlg.year-turn-2001-12': {
    title: 'December 2001',
    body: 'Another year, another squeeze. Rent outpaced your pay again.',
    buttons: ACKNOWLEDGE(),
  },

  // §18.2 — Era A -> Era B. Deliberately no further explanation.
  'dlg.era-switch-2002-01': {
    title: 'Your computer has been upgraded.',
    body: 'That’s it. That’s the upgrade.',
    buttons: ACKNOWLEDGE('Continue'),
  },

  'dlg.shock-2002-10': {
    title: 'The washing machine has died',
    body: 'Not covered, not optional. £500.',
    buttons: PAY_OR_SELL,
  },

  'dlg.shock-2004-03': {
    title: 'Moving day',
    body: 'Rent is up again and the deposit is due this month. £1,200.',
    buttons: PAY_OR_SELL,
  },

  'dlg.shock-2005-05': {
    title: 'A dental bill',
    body: 'Not covered, not optional, not going away. £700.',
    buttons: PAY_OR_SELL,
  },

  'dlg.shock-2006-06': {
    title: 'One more, right at the end',
    body: '£600. Same as it ever was.',
    buttons: PAY_OR_SELL,
  },

  'dlg.win-2006-12': {
    title: 'THE DECADE ENDS',
    body: 'Ten years, real inflation, one salary that never moved. You’re still standing.',
    buttons: [{ label: 'Run it again', action: 'restart', isDefault: true }],
  },
};
