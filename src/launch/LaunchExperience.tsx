import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import './launch.css';

type HubTab = 'overview' | 'simulation' | 'leaderboard' | 'reports' | 'settings';
export type LaunchScreen = 'hub' | 'library';

const TABS: { id: HubTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'simulation', label: 'Simulation' },
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'reports', label: 'User reports' },
  { id: 'settings', label: 'Settings' },
];

const DECADES = [
  { years: '1996–2006', title: 'The dot-com bubble', available: true },
  { years: '2001–2004', title: 'The long aftermath', available: false },
  { years: '2005–2008', title: 'Credit everywhere', available: false },
  { years: '2009–2012', title: 'After the crash', available: false },
];

function BubbleMark() {
  return (
    <span className="launch-mark" aria-hidden="true">
      <span className="launch-mark__orb launch-mark__orb--one" />
      <span className="launch-mark__orb launch-mark__orb--two" />
      <span className="launch-mark__orb launch-mark__orb--three" />
    </span>
  );
}

function OverviewPanel({
  onStart,
  onTutorial,
  tutorialButtonRef,
}: {
  onStart: () => void;
  onTutorial: () => void;
  tutorialButtonRef: RefObject<HTMLButtonElement>;
}) {
  return (
    <div className="launch-hero">
      <div className="launch-hero__copy">
        <p className="launch-eyebrow">A financial time machine</p>
        <h1>Can your money survive the bubble?</h1>
        <p className="launch-hero__lede">
          Step into the late 1990s, live on a salary that never rises, and decide what deserves your trust while
          markets, prices and persuasion accelerate around you.
        </p>
        <div className="launch-hero__actions">
          <button type="button" className="launch-primary" onClick={onStart}>
            Start simulation <span aria-hidden="true">↗</span>
          </button>
          <button ref={tutorialButtonRef} type="button" className="launch-secondary" onClick={onTutorial}>
            How to play
          </button>
        </div>
        <p className="launch-hero__note">No financial knowledge required · no account required · about 12 minutes</p>
      </div>
      <div className="launch-preview" aria-label="Preview of the simulation's market and money story">
        <div className="launch-preview__topline">
          <span>MARKET / PERSONAL</span>
          <span className="launch-live-dot">LIVE HISTORY</span>
        </div>
        <svg viewBox="0 0 520 260" role="img" aria-label="A market line rises sharply and falls while a steadier personal money line continues">
          <g className="launch-preview__grid" aria-hidden="true">
            <path d="M24 44H496 M24 92H496 M24 140H496 M24 188H496 M24 236H496" />
            <path d="M24 20V236 M142 20V236 M260 20V236 M378 20V236 M496 20V236" />
          </g>
          <path className="launch-preview__area" d="M24 220 L72 208 L118 193 L166 170 L214 132 L260 72 L304 30 L340 128 L382 190 L430 172 L496 146 L496 236 L24 236 Z" />
          <path className="launch-preview__market" d="M24 220 L72 208 L118 193 L166 170 L214 132 L260 72 L304 30 L340 128 L382 190 L430 172 L496 146" />
          <path className="launch-preview__wealth" d="M24 224 L72 212 L118 202 L166 190 L214 176 L260 160 L304 151 L340 157 L382 166 L430 150 L496 132" />
          <circle className="launch-preview__peak" cx="304" cy="30" r="5" />
        </svg>
        <div className="launch-preview__legend">
          <span><i className="launch-preview__key launch-preview__key--market" /> Market pressure</span>
          <span><i className="launch-preview__key launch-preview__key--wealth" /> Your choices</span>
          <b>1996 → 2006</b>
        </div>
      </div>
    </div>
  );
}

function TutorialStep({ step }: { step: number }) {
  if (step === 0) {
    return (
      <>
        <p className="launch-eyebrow">Your mission</p>
        <h2 id="launch-tutorial-title">Welcome to BUBBLE</h2>
        <p>Live through 10 years of financial decisions in around 12 minutes. You’ll earn money, receive financial offers, face unexpected costs and watch the world change around you.</p>
        <div className="launch-tutorial__callout">
          <h3>Your goal isn’t simply to get rich.</h3>
          <p>Try to make decisions that keep you financially resilient — even when you don’t know what’s coming next.</p>
        </div>
      </>
    );
  }
  if (step === 1) {
    return (
      <>
        <p className="launch-eyebrow">How to play</p>
        <h2 id="launch-tutorial-title">Three places help you decide</h2>
        <div className="launch-tutorial__areas">
          <TutorialCard title="HOME — See your situation">Check your money, monthly income and expenses, and what’s happening in the economy.</TutorialCard>
          <TutorialCard title="MAIL — Make decisions">You’ll receive financial offers and important life events. Read carefully — not everything that looks attractive is necessarily a good decision.</TutorialCard>
          <TutorialCard title="MY MONEY — Manage your money">Decide how much to keep as cash and how much to put into different financial products.</TutorialCard>
        </div>
        <p className="launch-tutorial__reassurance">Don’t recognise a financial term? That’s okay. BUBBLE is designed for you to learn as you play.</p>
      </>
    );
  }
  if (step === 2) {
    return (
      <>
        <p className="launch-eyebrow">Time keeps moving</p>
        <h2 id="launch-tutorial-title">Every month changes your situation</h2>
        <p>Each month you earn money and pay living costs. Markets change, new opportunities appear and unexpected events can happen.</p>
        <div className="launch-tutorial__timeline" aria-label="The simulation runs from 1996 to 2006">
          <span>1996</span><i aria-hidden="true">→</i><span>1998</span><i aria-hidden="true">→</i><span>2000</span><i aria-hidden="true">→</i><span>2003</span><i aria-hidden="true">→</i><span>2006</span>
        </div>
        <div className="launch-tutorial__callout">
          <h3>You don’t know what’s coming next.</h3>
          <p>Make the best decision you can with the information you have.</p>
        </div>
      </>
    );
  }
  return (
    <>
      <p className="launch-eyebrow">What you’ll learn</p>
      <h2 id="launch-tutorial-title">Learn by making decisions</h2>
      <div className="launch-tutorial__lessons">
        <TutorialCard title="Managing your money">Balancing what you spend, save and invest.</TutorialCard>
        <TutorialCard title="Keeping money available">Understanding why you might need cash for unexpected costs.</TutorialCard>
        <TutorialCard title="Understanding risk">Seeing why higher potential rewards can come with greater uncertainty.</TutorialCard>
        <TutorialCard title="Spreading your risk">Learning why putting everything in one place can be dangerous.</TutorialCard>
        <TutorialCard title="Questioning financial offers">Looking beyond persuasive advertising before trusting something.</TutorialCard>
      </div>
      <p className="launch-tutorial__finish">There is no perfect strategy. Make your decisions, experience the consequences, and try again.</p>
    </>
  );
}

function TutorialCard({ title, children }: { title: string; children: ReactNode }) {
  return <article><h3>{title}</h3><p>{children}</p></article>;
}

function HowToPlay({ onClose, onStart }: { onClose: () => void; onStart: () => void }) {
  const [step, setStep] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="launch-tutorial" role="presentation">
      <div
        ref={dialogRef}
        className="launch-tutorial__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="launch-tutorial-title"
        tabIndex={-1}
      >
        <header className="launch-tutorial__header">
          <div className="launch-brand"><BubbleMark /><span>BUBBLE</span></div>
          <span>HOW TO PLAY · {step + 1} / 4</span>
          <button type="button" className="launch-tutorial__close" onClick={onClose} aria-label="Close tutorial">×</button>
        </header>
        <div className="launch-tutorial__body"><TutorialStep step={step} /></div>
        <footer className="launch-tutorial__controls">
          <div className="launch-tutorial__progress" aria-label={`Tutorial step ${step + 1} of 4`}>
            {[0, 1, 2, 3].map((index) => <i key={index} className={index === step ? 'is-active' : ''} />)}
          </div>
          <div className="launch-tutorial__buttons">
            {step > 0 && <button type="button" className="launch-secondary" onClick={() => setStep(step - 1)}>← Back</button>}
            {step < 3 ? (
              <button type="button" className="launch-primary" onClick={() => setStep(step + 1)}>Next →</button>
            ) : (
              <button type="button" className="launch-primary" onClick={onStart}>Start my simulation →</button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

function SimulationPanel({ onStart }: { onStart: () => void }) {
  return (
    <div className="launch-section launch-section--simulation">
      <p className="launch-eyebrow">How to play</p>
      <h1>Read the signals. Allocate deliberately. Keep enough cash to live.</h1>
      <div className="launch-guide-grid">
        <article><span>01</span><h2>Time keeps moving</h2><p>Your pay is fixed while rent, food and shocks become more expensive.</p></article>
        <article><span>02</span><h2>Offers need evidence</h2><p>Open the fact sheet. Fees, regulation and impossible promises matter more than polish.</p></article>
        <article><span>03</span><h2>Targets are drafts</h2><p>Set a 100% mix, keep a cash buffer, then explicitly confirm before any money moves.</p></article>
      </div>
      <div className="launch-tutorial-strip">
        <span>INBOX</span><i aria-hidden="true">→</i><span>FACT SHEET</span><i aria-hidden="true">→</i><span>ALLOCATE</span><i aria-hidden="true">→</i><span>SURVIVE</span>
      </div>
      <button type="button" className="launch-primary launch-primary--center" onClick={onStart}>Choose a decade</button>
    </div>
  );
}

function PlaceholderPanel({ tab }: { tab: Exclude<HubTab, 'overview' | 'simulation'> }) {
  const content = {
    leaderboard: {
      label: 'Leaderboard',
      title: 'Good decisions are not a high score.',
      body: 'The local demo does not rank wealth. Survival date is the only band; risk, fees and judgment stay visible in your report without turning the lesson into a casino.',
      status: 'Online rankings are intentionally unavailable in this demo.',
    },
    reports: {
      label: 'User reports',
      title: 'Your report is written by your choices.',
      body: 'Finish a run to see your market path, peak and final savings, fee drag, forced sales, scam exposure and practical next-run guidance.',
      status: 'No report yet — complete the unlocked simulation first.',
    },
    settings: {
      label: 'Settings',
      title: 'Built for focus, privacy and unreliable Wi-Fi.',
      body: 'The simulation is fully offline. It stores no account, sends no analytics and follows your system reduced-motion preference. Period sound controls live inside the simulation.',
      status: 'Local-only mode · no data leaves this browser.',
    },
  }[tab];
  return (
    <div className="launch-section launch-section--placeholder">
      <p className="launch-eyebrow">{content.label}</p>
      <h1>{content.title}</h1>
      <p className="launch-section__lede">{content.body}</p>
      <div className="launch-status-card"><span aria-hidden="true">●</span>{content.status}</div>
    </div>
  );
}

function DecadeLibrary({ onBack, onSelect }: { onBack: () => void; onSelect: () => void }) {
  return (
    <main className="decade-page">
      <header className="decade-header">
        <button type="button" className="launch-text-button" onClick={onBack}>← Back</button>
        <div className="launch-brand"><BubbleMark /><span>BUBBLE</span></div>
        <span className="decade-header__mode">DECADE LIBRARY</span>
      </header>
      <section className="decade-intro">
        <p className="launch-eyebrow">Choose your market</p>
        <h1>History only feels obvious afterwards.</h1>
        <p>Each chapter fixes the prices, headlines and persuasion of its period. Only the original demo is unlocked.</p>
      </section>
      <section className="decade-grid" aria-label="Available simulation decades">
        {DECADES.map((decade, index) => (
          <button
            key={decade.years}
            type="button"
            className={`decade-card ${decade.available ? 'decade-card--available' : 'decade-card--locked'}`}
            disabled={!decade.available}
            onClick={decade.available ? onSelect : undefined}
            aria-label={`${decade.years}, ${decade.title}, ${decade.available ? 'unlocked' : 'locked'}`}
          >
            <span className="decade-card__index">0{index + 1}</span>
            <span className="decade-card__years">{decade.years}</span>
            <span className="decade-card__title">{decade.title}</span>
            <span className="decade-card__status">{decade.available ? 'UNLOCKED DEMO ↗' : 'LOCKED ◇'}</span>
            {decade.available && (
              <svg viewBox="0 0 240 72" aria-hidden="true">
                <path d="M2 66 L28 62 L52 55 L76 48 L99 38 L123 26 L146 8 L164 34 L184 60 L205 54 L238 45" />
              </svg>
            )}
          </button>
        ))}
      </section>
      <p className="decade-footnote">Additional chapters are presentation-only placeholders. The demo remains deterministic and offline.</p>
    </main>
  );
}

function RetroTransition({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onComplete, 3800);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <main className="retro-transition" aria-label="Entering the 1996 simulation">
      <div className="retro-transition__scanlines" aria-hidden="true" />
      <div className="retro-transition__grid" aria-hidden="true" />
      <div className="retro-transition__years" aria-hidden="true">
        <span>1996</span><span>1997</span><span>1998</span><span>1999</span><span>2000</span>
      </div>
      <div className="retro-terminal" role="status" aria-live="polite">
        <div className="retro-terminal__bar"><span>BUBBLE.EXE</span><span>□ ×</span></div>
        <div className="retro-terminal__body">
          <p className="retro-terminal__kicker">FINANCIAL TIME LINK / CHANNEL 96</p>
          <div className="retro-terminal__logo">BUBBLE</div>
          <p className="retro-terminal__message">Reconstructing the market before everyone knew how it ended.</p>
          <div className="retro-market" aria-hidden="true">
            {[22, 30, 38, 50, 64, 82, 96, 58, 34, 44].map((height, index) => (
              <i key={index} style={{ '--retro-bar-height': `${height}%`, '--retro-bar-index': index } as CSSProperties} />
            ))}
          </div>
          <div className="retro-terminal__progress"><span /></div>
          <div className="retro-terminal__readout"><span>MODEM HANDSHAKE</span><span>MARKET FEED</span><span>JAN 1996</span></div>
        </div>
      </div>
      <button type="button" className="retro-transition__skip" onClick={onComplete}>Skip intro</button>
    </main>
  );
}

export function LaunchExperience({
  initialScreen = 'hub',
  onLaunch,
}: {
  initialScreen?: LaunchScreen;
  onLaunch: () => void;
}) {
  const [screen, setScreen] = useState<LaunchScreen | 'transition'>(initialScreen);
  const [activeTab, setActiveTab] = useState<HubTab>('overview');
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const tutorialButtonRef = useRef<HTMLButtonElement>(null);

  const closeTutorial = () => {
    setTutorialOpen(false);
    window.setTimeout(() => tutorialButtonRef.current?.focus(), 0);
  };

  if (screen === 'library') {
    return <DecadeLibrary onBack={() => setScreen('hub')} onSelect={() => setScreen('transition')} />;
  }
  if (screen === 'transition') return <RetroTransition onComplete={onLaunch} />;

  return (
    <main className="launch-page">
      <header className="launch-header">
        <div className="launch-brand"><BubbleMark /><span>BUBBLE</span><small>MARKET SIMULATION</small></div>
        <nav className="launch-tabs" role="tablist" aria-label="BUBBLE sections">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={activeTab === tab.id ? 'launch-tabs__tab launch-tabs__tab--active' : 'launch-tabs__tab'}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <span className="launch-header__edition">DEMO / 01</span>
      </header>
      <section className="launch-main" role="tabpanel">
        {activeTab === 'overview' && (
          <OverviewPanel
            onStart={() => setScreen('library')}
            onTutorial={() => setTutorialOpen(true)}
            tutorialButtonRef={tutorialButtonRef}
          />
        )}
        {activeTab === 'simulation' && <SimulationPanel onStart={() => setScreen('library')} />}
        {activeTab !== 'overview' && activeTab !== 'simulation' && <PlaceholderPanel tab={activeTab} />}
      </section>
      <footer className="launch-footer">
        <span>REAL HISTORY / FICTIONAL FIRMS</span>
        <span>OFFLINE · DETERMINISTIC · NO FINANCIAL ADVICE</span>
      </footer>
      {tutorialOpen && (
        <HowToPlay onClose={closeTutorial} onStart={() => setScreen('library')} />
      )}
    </main>
  );
}
