/**
 * BUBBLE — the /home news ticker (Step 17, §22.1).
 *
 * §5.1: "real indices and real events are fine; no real company may ever be
 * depicted as a scam or a bad investment." Every line below is a real,
 * verifiable 1996–2006 event or index level — no invented company appears
 * here (the invented funds live in src/sim/ids.ts and src/content/factsheets.ts,
 * never on this list). Rates and index levels are drawn from public Bank of
 * England and market records, not guessed.
 *
 * 2–4 lines per year, keyed by year so the ticker on /home always reflects
 * the current month without a lookup table maintained anywhere else.
 */
import { yearOf, type MonthIndex } from '../sim/month';

export interface TickerHeadline {
  year: number;
  text: string;
}

export const TICKER_HEADLINES: readonly TickerHeadline[] = [
  // 1996
  { year: 1996, text: 'Bank of England base rate holds around 6%' },
  { year: 1996, text: 'England lose Euro 96 semi-final to Germany on penalties' },
  { year: 1996, text: 'FTSE 100 climbs steadily through the year' },

  // 1997
  { year: 1997, text: 'Bank of England gains independence to set interest rates' },
  { year: 1997, text: 'Scientists at the Roslin Institute reveal Dolly, the cloned sheep' },
  { year: 1997, text: 'Hong Kong returned to China after 156 years of British rule' },

  // 1998
  { year: 1998, text: 'NASDAQ closes above 2,000 for the first time' },
  { year: 1998, text: 'FTSE 100 closes above 6,000 for the first time' },
  { year: 1998, text: 'Bank holds rates' },

  // 1999
  { year: 1999, text: 'FTSE 100 hits a record high above 6,900' },
  { year: 1999, text: 'Euro launched in eleven European countries' },
  { year: 1999, text: 'Millennium Bug fears dominate the headlines' },

  // 2000
  { year: 2000, text: 'Dot-com boom peaks on NASDAQ, then starts to unwind' },
  { year: 2000, text: 'Millennium Dome opens in Greenwich' },
  { year: 2000, text: 'Bank of England holds rates as markets wobble' },

  // 2001
  { year: 2001, text: 'September 11 attacks shake markets worldwide' },
  { year: 2001, text: 'Bank of England cuts rates twice, to 4.50%' },
  { year: 2001, text: "NASDAQ extends its slide from last year's peak" },

  // 2002
  { year: 2002, text: 'Euro notes and coins enter circulation across the eurozone' },
  { year: 2002, text: 'FTSE 100 slides for a third straight year' },
  { year: 2002, text: 'Stock markets stay volatile after the dot-com bust' },

  // 2003
  { year: 2003, text: 'Bank of England cuts base rate to 3.5%' },
  { year: 2003, text: 'War in Iraq unsettles global markets' },
  { year: 2003, text: "FTSE 100 recovers from its March low" },

  // 2004
  { year: 2004, text: 'Bank of England raises base rate to 4.75%' },
  { year: 2004, text: 'UK house prices keep climbing' },
  { year: 2004, text: 'Facebook launches at US universities' },

  // 2005
  { year: 2005, text: 'London wins bid to host the 2012 Olympics' },
  { year: 2005, text: "Bombings hit London's transport network" },
  { year: 2005, text: 'Bank of England trims base rate to 4.50%' },

  // 2006
  { year: 2006, text: 'Bank of England raises base rate to 4.75%' },
  { year: 2006, text: 'FTSE 100 climbs back above 6,000' },
  { year: 2006, text: 'UK unemployment stays low as growth continues' },
];

export function headlinesForYear(year: number): string[] {
  return TICKER_HEADLINES.filter((h) => h.year === year).map((h) => h.text);
}

/** §22.1's marquee: the current year's headlines, bulleted, ready to feed
 * straight into a `<marquee>`. */
export function tickerTextForMonth(month: MonthIndex): string {
  return headlinesForYear(yearOf(month))
    .map((text) => `▪ ${text}`)
    .join('   ');
}
