/**
 * §22.6 — the cause-of-death line library.
 *
 * Every DeathCauseId gets a headline line and a supporting detail line.
 * The six §22.6 example lines appear verbatim (or near-verbatim, where the
 * spec's own example names a specific scam we then generalise slightly so
 * the line is truthful whichever scam actually got the player — see the
 * comment on 'funded-a-scam').
 *
 * §5.1 / §11.2 r5: the death card always names the flags you missed, quoting
 * them from the sheet you could have read. These lines are the headline;
 * the run/UI layer is responsible for splicing in the specific missed flags
 * and numbers (fees paid, rent rise %, etc.) where a line has a blank to fill.
 */

import type { DeathCauseId } from '../sim/types';

export interface DeathLine {
  /** The big line under GAME OVER. One sentence, dry, never patronising (§5). */
  headline: string;
  /** The supporting sentence beneath it. */
  detail: string;
}

export const DEATH_LINES: Record<DeathCauseId, DeathLine> = {
  'broke-as-bubble-peaked': {
    headline: 'You went broke the same month the bubble peaked.',
    detail: 'March 2000. The market had two more years to fall. You didn’t have two more months.',
  },
  'ground-down-by-rent': {
    headline: 'Ground down. Your rent rose 71%. Your pay rose £0.',
    detail: 'No single month killed you. All ten did, a little at a time.',
  },
  // §22.6's own example names Cavendish specifically. We keep that wording
  // (it's the canonical death line for the run's most-demoed scam) but the
  // UI layer may substitute whichever scam actually killed this run.
  'funded-a-scam': {
    headline: 'Cavendish Asset Management was never real. Two things on that fact sheet said so.',
    detail: 'The sheet was one click away, free, and untimed. Nobody made you skip it.',
  },
  'sold-at-the-bottom': {
    headline: 'You sold at the bottom three times. That’s what got you.',
    detail: 'Each sale was the right call in the moment. Together they were fatal.',
  },
  'eaten-by-fees': {
    headline: 'You paid £1,840 in fees. The tracker would have charged you £96.',
    detail: 'Nobody stole that money. You signed for it, a little every month.',
  },
  'the-card-ate-you': {
    headline: 'The card bridged you through 2001 and then ate you in 2003.',
    detail: '29.8% doesn’t feel real until it’s the only number still moving.',
  },
  'the-fake-dialog': {
    headline: 'That wasn’t a warning from your computer. It was an advert. The clock never stopped.',
    detail: 'A real dialog freezes the clock. This one didn’t, and you were the only one who could have noticed.',
  },
  // The win card (§22.6 "LEGENDARY") — not one of the seven death lines,
  // but DeathCauseId's eighth value, for a run that reaches Dec 2006.
  survived: {
    headline: 'Ten years. You’re still here.',
    detail: 'Nobody rings a bell for surviving. That was the whole game.',
  },
};
