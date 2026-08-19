import { describe, expect, it } from 'vitest';
import { TICKER_HEADLINES, headlinesForYear, tickerTextForMonth } from './ticker';
import { FACT_SHEETS } from './factsheets';
import { monthIndex, START_YEAR, END_YEAR } from '../sim/month';
import { VEHICLE_IDS } from '../sim/ids';

const YEARS = Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i);

// The invented fund/manager names (§5.1) — none of these may appear on a
// ticker line, which only ever carries real indices and real events.
const INVENTED_NAMES = VEHICLE_IDS.filter((id) => id !== 'cash').flatMap((id) => [
  FACT_SHEETS[id].name,
  FACT_SHEETS[id].manager,
]);

describe('news ticker (§22.1, §5.1)', () => {
  it('has 2-4 lines for every year 1996-2006', () => {
    for (const year of YEARS) {
      const lines = headlinesForYear(year);
      expect(lines.length, `${year}`).toBeGreaterThanOrEqual(2);
      expect(lines.length, `${year}`).toBeLessThanOrEqual(4);
    }
  });

  it('never mentions an invented fund or manager (§5.1)', () => {
    for (const { text } of TICKER_HEADLINES) {
      for (const name of INVENTED_NAMES) {
        if (name === 'n/a' || name === '— none —') continue;
        expect(text, `"${text}" should not reference "${name}"`).not.toContain(name);
      }
    }
  });

  it('every line is non-empty, factual-reading text', () => {
    for (const { text } of TICKER_HEADLINES) {
      expect(text.length).toBeGreaterThan(8);
    }
  });

  it('tickerTextForMonth pulls only the current year\'s lines, bulleted', () => {
    const text = tickerTextForMonth(monthIndex(1998, 9));
    for (const line of headlinesForYear(1998)) {
      expect(text).toContain(line);
    }
    for (const line of headlinesForYear(1999)) {
      expect(text).not.toContain(line);
    }
    expect(text.startsWith('▪ ')).toBe(true);
  });
});
