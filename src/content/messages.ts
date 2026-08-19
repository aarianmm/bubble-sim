/**
 * Body copy for every mail message and every popup in the timeline, keyed by
 * contentId. Voice per §5 ("never patronising") and §17 ("the humour comes
 * from what things say"). Plain data — no JSX, no components.
 */

export interface MessageBody {
  from: string;
  subject: string;
  /** Paragraphs. Rendered with blank lines between them. */
  body: string[];
}

/** §5.1 rule 5 — the required, visible in-game line. */
export const SIMULATED_DISCLAIMER =
  'Simulated. Historical data is real; every company and fund in this game is invented. This is not financial advice.';

/* ------------------------------------------------------------------ *
 * Mail (§22.2) — 17 messages
 * ------------------------------------------------------------------ */

export const MAIL_MESSAGES: Record<string, MessageBody> = {
  'msg.northmoor-bond': {
    from: 'Northmoor Building Society',
    subject: 'Your savings, working harder',
    body: [
      'Dear Member,',
      'Northmoor Building Society is pleased to offer a new fixed-rate savings bond to members of your branch.',
      // §16 — the discoverability floor. The rate lives on the fact sheet only.
      'Full terms, including the rate, are set out in the attached fund fact sheet. Please read it before applying.',
      'Yours faithfully,\nNorthmoor Building Society',
    ],
  },

  'msg.northmoor-annual-statement': {
    from: 'Northmoor Building Society',
    subject: 'Your annual statement',
    body: [
      'Dear Member,',
      'Your account earned £31.00 in interest this year. A full statement is enclosed for your records.',
      'Yours faithfully,\nNorthmoor Building Society',
    ],
  },

  'msg.windfall-1997-02': {
    from: 'Meadowbank Savings',
    subject: 'Your child savings account has matured',
    body: [
      'Your Meadowbank Savings account, opened on your behalf in 1985, matured this month.',
      'Balance: £2,000.00, now transferred to your current account.',
    ],
  },

  'msg.brightwell-pension': {
    from: 'Payroll @ Brightwell Ltd',
    subject: 'Your workplace pension',
    body: [
      'Brightwell Ltd operates a workplace pension scheme, administered by Kingsley Asset Management.',
      'Opt in and the company matches your contribution, pound for pound, up to 4% of salary. That match is money you will not see any other way — opting out forfeits it, not just your own contribution.',
      'You can change your contribution or opt out again at any time.',
    ],
  },

  'msg.fenwick-index': {
    from: 'Fenwick Fund Management',
    subject: 'Fenwick Index Trust',
    body: [
      'The Fenwick Index Trust holds the same 623 companies as the FTSE All-Share, in the same proportions, for a 0.4% annual fee.',
      'It will never beat the market. It will also never try to.',
      'Fund fact sheet enclosed.',
    ],
  },

  'msg.dave-fomo-1998-02': {
    from: 'Dave',
    subject: 'mate you have to see this',
    body: [
      'alright mate',
      "put £500 into this tech fund my cousin told me about, it's already up loads. technova something. check it out before it closes",
      'dave',
    ],
  },

  'msg.capital-direct-card-1998-05': {
    from: 'Capital Direct',
    subject: "You're pre-approved",
    body: [
      "You're pre-approved for a Capital Direct Gold Card. £2,000 credit limit.",
      '0% on purchases for 6 months, then 29.8% APR representative. No annual fee.',
    ],
  },

  'msg.ashcombe-managed': {
    from: 'Ashcombe Wealth Management',
    subject: "A managed portfolio, for people who'd rather not choose",
    body: [
      "Ashcombe's Managed Portfolio service charges 3% annually plus 20% of any gains, in exchange for a professionally managed blend of funds, rebalanced quarterly on your behalf.",
      'Full fee schedule enclosed.',
    ],
  },

  'msg.fenwick-world': {
    from: 'Fenwick Fund Management',
    subject: 'Fenwick World Trust — now available',
    body: [
      'The same idea as the Index Trust, further afield: 1,850 companies across global developed markets, for a 0.5% annual fee.',
    ],
  },

  'msg.dave-up-300-1999-07': {
    from: 'Dave',
    subject: "I'm up 300%",
    body: [
      'mate',
      "i put my isa into halcyon reserve back in june, i'm up over 300% since. you need to get in mate seriously, before it's too late",
      'dave',
    ],
  },

  'msg.quicksilver-com': {
    from: 'Quicksilver.com Investor Relations',
    subject: 'Quicksilver.com — now listed',
    body: [
      'Quicksilver.com listed on the London Stock Exchange this month.',
      'Shares are available through your usual broker.',
    ],
  },

  'msg.windfall-2000-02': {
    from: 'Brightwell Ltd HR',
    subject: 'Your redundancy payment',
    body: [
      'Following last month’s restructuring notice, your redundancy payment has been processed.',
      'Amount: £1,800.00. We wish you well.',
    ],
  },

  'msg.capital-direct-card-2000-10': {
    from: 'Capital Direct',
    subject: 'A second chance to apply',
    body: [
      'Your Capital Direct Gold Card offer is still available. £2,000 limit, 0% for 6 months.',
      'Applications take two minutes.',
    ],
  },

  'msg.restitution-partners': {
    from: 'Restitution Partners',
    subject: 'Lost money in a failed fund? We can help.',
    body: [
      'If you held units in a fund that has ceased trading, our specialists may be able to recover some or all of your losses.',
      'A £150 administration fee applies on application.',
    ],
  },

  'msg.windfall-2003-02': {
    from: 'Hepworth & Grey, Solicitors',
    subject: 'Estate settlement — your legacy',
    body: [
      'Following the settlement of the estate, a legacy has been transferred to your account.',
      'Amount: £2,500.00. Our condolences.',
    ],
  },

  'msg.marlow-corporate-bond': {
    from: 'Marlow Investment Partners',
    subject: 'Marlow Corporate Bond Fund',
    body: [
      '140 investment-grade corporate bonds, 0.9% annual fee.',
      'A dampener for a portfolio that has had an eventful few years.',
    ],
  },

  'msg.pension-top-up-2004-08': {
    from: 'Payroll @ Brightwell Ltd',
    subject: 'Increase your pension contribution?',
    body: [
      "You're currently contributing the scheme minimum to your workplace pension.",
      'Increasing your contribution increases the company match. No action needed if you would rather not.',
    ],
  },
};

/* ------------------------------------------------------------------ *
 * Popups (§20.2) — 14 messages
 * ------------------------------------------------------------------ */

export const POPUP_MESSAGES: Record<string, MessageBody> = {
  'pop.freestuff-1996-02': {
    from: 'FREEST0FF.NET',
    subject: 'FREE RINGTONES 4 U!!!',
    body: ['Get 10 FREE ringtones sent straight to your phone!', 'Click below. No catch. 100% free!!!'],
  },

  'pop.junk-1996-09': {
    from: 'PrizeAlert',
    subject: 'YOU MAY ALREADY HAVE WON!',
    body: ["Congratulations! You've been selected to claim a FREE prize.", 'Click to find out what you have won!'],
  },

  'pop.meridian-1997-03': {
    from: 'Meridian Capital',
    subject: 'GUARANTEED 30% GROWTH',
    body: [
      'Guaranteed 30% p.a. returns. No downside.',
      'Limited places for new investors this month. Click to invest.',
    ],
  },

  'pop.junk-1997-11': {
    from: 'ChainMail',
    subject: 'FWD: read this or 7 years bad luck',
    body: [
      'Forward this message to 10 friends within 24 hours or you will have bad luck for 7 years.',
      'This is NOT a joke.',
    ],
  },

  // §10 rule 1 — the popup channel's non-scam offer, and §21's central case:
  // LOUD, and completely legitimate. Placed the same month as Dave's email,
  // above, which now links here instead of to Cavendish.
  'pop.technova-1998-02': {
    from: 'Technova Growth Fund',
    subject: 'BACKING TOMORROW, TODAY',
    body: [
      '58 hand-picked technology companies. Actively managed, actively priced.',
      'Click to invest — places are limited this quarter.',
    ],
  },

  'pop.cavendish-1998-03': {
    // §22.3's own worked example.
    from: 'Cavendish Asset Mgmt',
    subject: 'A once-in-a-generation opportunity',
    body: [
      'Our fund has returned 64% in twelve months with a guaranteed minimum of 40% per annum for early participants.',
      'Places close Friday.',
    ],
  },

  'pop.junk-1998-12': {
    from: 'Millennium Solutions',
    subject: 'Is YOUR PC ready for the Year 2000?',
    body: [
      'The Millennium Bug could wipe your hard drive on 1 January.',
      'Order our Y2K Protection Kit today — only £19.99.',
    ],
  },

  // §10 rule 1 — dull, correct, and ignored: exactly the shape a gilt fund
  // ad should have two months ahead of the 1999 mania peak.
  'pop.kingsley-gilt-1999-03': {
    from: 'Kingsley Asset Management',
    subject: 'Not every fund needs to be exciting',
    body: ['UK government gilts, various maturities. 0.75% annual fee.', 'Steady income. Low drama.'],
  },

  'pop.vertex-1999-05': {
    from: 'Vertex Communications',
    subject: 'UP 200% AND CLIMBING',
    body: ['Insider tip: Vertex Communications is up 200% this year and still climbing.', 'Ground floor. Act fast.'],
  },

  'pop.halcyon-1999-06': {
    from: 'Halcyon Reserve',
    subject: 'A private reserve, now open to new clients',
    body: [
      'Fourteen months of consistent returns.',
      'Halcyon Reserve is now accepting a limited number of new private clients.',
    ],
  },

  'pop.y2k-1999-12': {
    from: 'Millennium Solutions',
    subject: '48 HOURS UNTIL THE MILLENNIUM BUG',
    body: ['The clocks roll over in 48 hours.', 'Is your money safe? Click here to find out.'],
  },

  'pop.buy-the-dip-2000-06': {
    from: 'MarketWatch Alerts',
    subject: 'BUY THE DIP — this is the bottom',
    body: ['Every crash is a buying opportunity. Analysts agree: this is the bottom.', "Don't miss the rebound."],
  },

  // §10 rule 1 — legit, undiversified, plain. Lands in the quiet stretch
  // between the Halcyon collapse and the Sep 2001 trough shock.
  'pop.granville-2001-03': {
    from: 'Granville plc Investor Relations',
    subject: 'Own a piece of the FTSE 100',
    body: [
      'Granville plc is a FTSE-listed manufacturer with a 15-year dividend record.',
      'Shares are available through your usual broker.',
    ],
  },

  'pop.recovery-room-2002-03': {
    from: 'Global Asset Recovery',
    subject: 'Recover funds lost in failed investments',
    body: ['Our specialists have recovered over £2m for investors this year alone.', 'No recovery, no fee.'],
  },

  // §20.5 — the one exception. Imitates system chrome; content mirrors the mock-up.
  'pop.security-alert-2003-04': {
    from: 'Comet Navigator',
    subject: 'SECURITY ALERT',
    body: ['SECURITY ALERT: Your savings are at risk.', 'Immediate action required.'],
  },

  'pop.late-junk-2005-11': {
    from: 'FREEST0FF.NET',
    subject: 'Remember us? Still free.',
    body: ["It's been a while. Ringtones are still free.", 'Click here.'],
  },
};
