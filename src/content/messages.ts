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
 * Mail (§22.2) — 23 messages
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
    subject: 'Your annual bond illustration',
    body: [
      'Dear Member,',
      'Our 5.2% fixed-rate bond paid about £31 this year on a £600 balance. Over the same year, typical rent on your room rose by about £28.',
      'These illustrative figures are enclosed for your records.',
      'Yours faithfully,\nNorthmoor Building Society',
    ],
  },

  'msg.windfall-1997-02': {
    from: 'Meadowbank Savings',
    subject: 'Your child savings account has matured',
    body: [
      'Your Meadowbank Savings account, opened on your behalf in 1985, matured this month.',
      'Your matured balance of £2,000.00 is ready for release. The funds will be credited to your current account when this maturity notice is acknowledged.',
    ],
  },

  'msg.brightwell-pension': {
    from: 'Payroll @ Brightwell Ltd',
    subject: 'Your workplace pension',
    body: [
      'Brightwell Ltd operates a workplace pension scheme, administered by Kingsley Asset Management.',
      'Opt in and the company matches your contribution, pound for pound, up to 4% of salary. That match is money you will not see any other way — opting out forfeits it, not just your own contribution.',
      'If you opt in, you can choose how much of your monthly saving is allocated to the pension fund.',
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
    subject: '0% on purchases for 6 months',
    body: [
      'THE CAPITAL DIRECT GOLD CARD: advertised £2,000 credit limit, with 0% on purchases for the first 6 months.',
      'After the introductory period, 29.8% APR representative applies. No annual fee. The headline rate is temporary; any remaining balance would then be charged at the higher rate.',
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

  'pop.kingsley-gilt-1999-03': {
    from: 'Kingsley Asset Management',
    subject: 'Not every fund needs to be exciting',
    body: ['UK government gilts, various maturities. 0.75% annual fee.', 'Steady income. Low drama.'],
  },

  'msg.dave-up-300-1999-07': {
    from: 'Dave',
    subject: "it's up again",
    body: [
      'mate',
      "i put my isa into halcyon reserve last month and it's up again already. they reckon they've never had a down month. you need to look at this mate, seriously",
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
      'Following the restructuring announced in November, your redundancy payment is ready for release.',
      'Amount: £1,800.00. The funds will be credited to your current account when this payment notice is acknowledged. We wish you well.',
    ],
  },

  'msg.capital-direct-card-2000-10': {
    from: 'Capital Direct',
    subject: 'The Gold Card offer, revisited',
    body: [
      'THE CAPITAL DIRECT GOLD CARD is being advertised again: £2,000 credit limit and 0% on purchases for 6 months.',
      'After the introductory period, 29.8% APR representative applies. Offers like this can look especially attractive when money is tight; the higher rate still follows.',
    ],
  },

  'msg.restitution-partners': {
    from: 'Restitution Partners',
    subject: 'Recent investment losses? We can help.',
    body: [
      'If your investments fell in the recent market crash, our specialists may be able to recover losses and protect what remains.',
      'A £150 administration fee applies on application.',
    ],
  },

  'pop.buy-the-dip-2000-06': {
    from: 'MarketWatch Alerts',
    subject: 'BUY THE DIP — this is the bottom',
    body: ['Every crash is a buying opportunity. Analysts agree: this is the bottom.', "Don't miss the rebound."],
  },

  'pop.granville-2001-03': {
    from: 'Granville plc Investor Relations',
    subject: 'Own a piece of the FTSE 100',
    body: [
      'Granville plc is a FTSE-listed manufacturer with a 15-year dividend record.',
      'Shares are available through your usual broker.',
    ],
  },

  'msg.investor-bulletin-2002-06': {
    from: 'Fenwick Investor Bulletin',
    subject: 'After the market fall: what now?',
    body: [
      'Share prices have been falling for more than two years. Recent losses cannot tell anyone whether the low point has arrived, or how soon a recovery may follow.',
      'Holding a spread of investments can reduce the damage caused by relying on one company, sector or market. Diversification manages uncertainty; it does not predict the bottom.',
    ],
  },

  'msg.windfall-2003-02': {
    from: 'Hepworth & Grey, Solicitors',
    subject: 'Estate settlement — your legacy',
    body: [
      'Following the settlement of the estate, a legacy of £2,500.00 is ready for release to you.',
      'The funds will be credited to your current account when this settlement notice is acknowledged. Our condolences.',
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
    from: 'Kingsley Pension Services',
    subject: 'A reminder about workplace pensions',
    body: [
      'If your current employer offers a workplace pension, check whether it also offers matching contributions.',
      'Increasing an eligible contribution may increase the employer match. Your payroll team can confirm the terms available to you.',
    ],
  },

  'msg.investment-charges-2005-02': {
    from: 'Marlow Investor Bulletin',
    subject: 'The cost you do not see',
    body: [
      'An annual investment charge that looks small is deducted year after year, reducing the amount left to benefit from future growth.',
      'When comparing investments, consider ongoing charges alongside headline performance. A higher fee has to be earned back before it adds value.',
    ],
  },

  'msg.long-term-planning-2006-08': {
    from: 'Personal Finance Review',
    subject: 'Keeping long-term plans on track',
    body: [
      'Long-term saving works best when it is reviewed occasionally rather than abandoned after one difficult year or left unchanged forever.',
      'Whatever arrangements are available to you, consider regular saving, pension contributions and a diversified mix suited to the time remaining before you expect to need the money.',
    ],
  },

};

/* ------------------------------------------------------------------ *
 * Popups (§20.2) — 8 authored messages
 * ------------------------------------------------------------------ */

export const POPUP_MESSAGES: Record<string, MessageBody> = {
  'pop.buy-now-pay-later-1996-02': {
    from: 'EasyPay Credit',
    subject: '0% INTEREST — BUY NOW, PAY LATER',
    body: [
      'Spread the cost today with nothing to pay for the first 3 months.',
      'Standard interest applies after the introductory period.',
    ],
  },

  'pop.meridian-1997-03': {
    from: 'Meridian Capital',
    subject: 'GUARANTEED 30% GROWTH',
    body: [
      'Guaranteed 30% p.a. returns. No downside.',
      'Limited places for new investors this month. Click to invest.',
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

  // §20.5 — the one exception. Imitates system chrome; content mirrors the mock-up.
  'pop.security-alert-2003-04': {
    from: 'Bubble Navigator',
    subject: 'SECURITY ALERT',
    body: ['SECURITY ALERT: Your savings are at risk.', 'Immediate action required.'],
  },

  'pop.meadowbank-phishing-2005-09': {
    from: 'Meadowbank Online Banking',
    subject: 'ACCOUNT VERIFICATION REQUIRED',
    body: [
      'We were unable to verify your online banking details.',
      'Access to your account may be restricted unless your account information is verified within 24 hours.',
    ],
  },

};
