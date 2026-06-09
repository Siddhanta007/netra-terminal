// Marketing 'About' page.

import Footer from '../components/Layout/Footer';

/* ── tokens ─────────────────────────────────────────────────────── */
const BLUE    = '#4169E1';
const BLUE_BG = '#edf2fc';       // desaturated blue
const BLUE_MID= '#dce8fa';

const ORANGE    = '#f97316';
const ORANGE_BG = '#fff4ed';     // desaturated orange
const ORANGE_MID= '#ffe8d4';

const NEON      = '#00e57a';     // neon mint — Maya
const NEON_BG   = '#edfff5';

const NAVY   = '#0d1528';
const TEXT   = '#1e293b';
const MUTED  = '#64748b';
const SERIF  = "Georgia, 'Times New Roman', serif";
const MONO   = "'JetBrains Mono', monospace";

/* ── corner circles ──────────────────────────────────────────────── */
const TR: {cx:number;cy:number;r:number;c:string}[] = [
  { cx: 720, cy: 10,  r: 55, c: BLUE      }, { cx: 648, cy: -5,  r: 36, c: ORANGE    },
  { cx: 580, cy: 38,  r: 48, c: '#8b5cf6' }, { cx: 730, cy: 98,  r: 42, c: '#10b981' },
  { cx: 505, cy: 12,  r: 28, c: '#6366f1' }, { cx: 662, cy: 118, r: 52, c: BLUE      },
  { cx: 428, cy: 32,  r: 24, c: '#ef4444' }, { cx: 572, cy: 135, r: 34, c: '#0ea5e9' },
  { cx: 725, cy: 180, r: 38, c: ORANGE    }, { cx: 352, cy: 58,  r: 22, c: '#8b5cf6' },
  { cx: 490, cy: 105, r: 42, c: BLUE      }, { cx: 620, cy: 198, r: 26, c: '#10b981' },
  { cx: 275, cy: 28,  r: 18, c: '#6366f1' }, { cx: 548, cy: 225, r: 46, c: ORANGE    },
  { cx: 718, cy: 258, r: 30, c: '#0ea5e9' }, { cx: 400, cy: 172, r: 20, c: BLUE      },
  { cx: 670, cy: 298, r: 24, c: '#ef4444' }, { cx: 320, cy: 148, r: 36, c: '#8b5cf6' },
  { cx: 580, cy: 285, r: 22, c: '#10b981' }, { cx: 460, cy: 260, r: 40, c: '#6366f1' },
  { cx: 200, cy: 55,  r: 16, c: ORANGE    }, { cx: 245, cy: 118, r: 28, c: BLUE      },
  { cx: 138, cy: 32,  r: 20, c: '#10b981' }, { cx: 730, cy: 355, r: 28, c: BLUE      },
  { cx: 505, cy: 335, r: 18, c: ORANGE    }, { cx: 352, cy: 305, r: 32, c: '#0ea5e9' },
];
const BL: typeof TR = [
  { cx: 18,  cy: 640, r: 55, c: BLUE      }, { cx: 105, cy: 658, r: 36, c: '#10b981' },
  { cx: 188, cy: 622, r: 48, c: ORANGE    }, { cx: 10,  cy: 568, r: 42, c: '#8b5cf6' },
  { cx: 288, cy: 648, r: 28, c: BLUE      }, { cx: 125, cy: 558, r: 52, c: '#0ea5e9' },
  { cx: 378, cy: 628, r: 24, c: '#ef4444' }, { cx: 228, cy: 548, r: 34, c: ORANGE    },
  { cx: 16,  cy: 492, r: 38, c: BLUE      }, { cx: 448, cy: 615, r: 22, c: '#8b5cf6' },
  { cx: 155, cy: 472, r: 42, c: '#6366f1' }, { cx: 328, cy: 532, r: 26, c: '#10b981' },
  { cx: 68,  cy: 398, r: 20, c: '#0ea5e9' }, { cx: 255, cy: 435, r: 46, c: BLUE      },
  { cx: 22,  cy: 318, r: 30, c: '#ef4444' }, { cx: 418, cy: 505, r: 20, c: ORANGE    },
  { cx: 178, cy: 348, r: 24, c: '#8b5cf6' }, { cx: 385, cy: 408, r: 36, c: '#6366f1' },
  { cx: 105, cy: 278, r: 22, c: BLUE      }, { cx: 295, cy: 332, r: 40, c: '#0ea5e9' },
  { cx: 488, cy: 468, r: 18, c: BLUE      }, { cx: 52,  cy: 228, r: 28, c: ORANGE    },
  { cx: 198, cy: 242, r: 16, c: '#10b981' }, { cx: 342, cy: 268, r: 30, c: '#8b5cf6' },
  { cx: 480, cy: 368, r: 24, c: '#ef4444' }, { cx: 135, cy: 185, r: 20, c: BLUE      },
];

function Corners() {
  return (
    <>
      <div style={{ position: 'fixed', top: 0, right: 0, width: 780, height: 680, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <svg width="780" height="680" viewBox="0 0 780 680" fill="none">
          {TR.map((s, i) => <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="none" stroke={s.c} strokeWidth="5.5" strokeOpacity="0.38" />)}
        </svg>
      </div>
      <div style={{ position: 'fixed', bottom: 0, left: 0, width: 660, height: 720, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <svg width="660" height="720" viewBox="0 0 660 720" fill="none">
          {BL.map((s, i) => <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="none" stroke={s.c} strokeWidth="5.5" strokeOpacity="0.38" />)}
        </svg>
      </div>
    </>
  );
}

/* ── section eyebrow ─────────────────────────────────────────────── */
function Eyebrow({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '40px' }}>
      <div style={{ width: '28px', height: '2px', background: color }} />
      <span style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.38em', color }}>{label}</span>
    </div>
  );
}

/* ── data ────────────────────────────────────────────────────────── */
const PHASES = [
  { n: 'P1',  name: 'Bias',            desc: 'Daily directional read. Long or short — set before anything else opens.' },
  { n: 'P2',  name: 'HTF Structure',   desc: 'Higher-timeframe structure must confirm the bias.' },
  { n: 'P3',  name: 'Liquidity',       desc: 'Map where liquidity sits — who gets stopped before the real move.' },
  { n: 'P4',  name: 'Command',         desc: 'STRIKE, INTERCEPT, or ABORT. One call. No reversals mid-session.' },
  { n: 'P5',  name: 'Weapon',          desc: 'Select the instrument: Strike, Agni, Vajra, Manthan.' },
  { n: 'P6',  name: 'Mission Intel',   desc: 'AI-assisted confluence check against doctrine and trade log.' },
  { n: 'P7',  name: 'Risk Frame',      desc: 'Entry, stop, and target locked before any execution.' },
  { n: 'P8',  name: 'Trading Data',    desc: 'Live position tracking — entries, partial exits, P&L.' },
  { n: 'P9',  name: 'Maya Audit',      desc: 'Post-trade AI review: did execution follow the doctrine?' },
  { n: 'P10', name: 'Mission Control', desc: 'Final log, outcome classification, archive.' },
];

const AGENTS = [
  { n: '01', name: 'Researcher',    desc: 'RAG retrieval over doctrine documents and historical trade log.' },
  { n: '02', name: 'Doctrine Gate', desc: 'Hard block — cannot produce any suggestion outside doctrine bounds.' },
  { n: '03', name: 'Strategist',    desc: 'Generates confluence arguments within the permitted doctrine space.' },
  { n: '04', name: 'Critic',        desc: 'Challenges the strategist before the output reaches the user.' },
  { n: '05', name: 'Auditor',       desc: 'Post-trade: compares execution against doctrine, flags deviations.' },
];

/* ════════════════════════════════════════════════════════════════════
   PAGE
════════════════════════════════════════════════════════════════════ */
export default function AboutPage() {
  return (
    <div style={{ background: '#ffffff', flex: 1, position: 'relative', overflowX: 'hidden' }}>
      <Corners />

      <div style={{ maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '72px 56px 0', position: 'relative', zIndex: 1 }}>


        {/* ════════════════════════════════════════
            ABOUT ME
        ════════════════════════════════════════ */}
        <Eyebrow label="About Me" color={BLUE} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px', marginBottom: '24px', alignItems: 'stretch' }}>

          {/* name + pitch */}
          <div style={{ background: '#fff4ed', padding: '48px 52px', border: '1px solid rgba(249,115,22,0.15)' }}>
            <div style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.32em', color: MUTED, marginBottom: '24px' }}>
              Quant Researcher · Systems Builder
            </div>
            <h1 style={{ fontFamily: SERIF, fontSize: '84px', fontWeight: 700, color: NAVY, letterSpacing: '-0.04em', lineHeight: 0.9, margin: '0 0 28px 0' }}>
              Sri<br />Krishna
            </h1>
            <div style={{ width: '36px', height: '2px', background: BLUE, marginBottom: '28px' }} />
            <p style={{ fontSize: '16px', lineHeight: 1.85, color: TEXT, margin: '0 0 18px 0', maxWidth: '500px' }}>
              I reverse-engineer how markets actually move — from price itself, not a syllabus — and turn that read into systematic, rules-first strategies. Then I build the software that runs them end to end.
            </p>
            <p style={{ fontSize: '14px', lineHeight: 1.85, color: MUTED, margin: '0 0 40px 0', maxWidth: '500px' }}>
              Range is the edge: I do the statistics and the ML, and I ship the production system around it — the doctrine, the multi-agent AI engine, the entire platform you're looking at right now. Headed into quant research and ML engineering, where the work speaks louder than the résumé.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <a href="https://github.com/Siddhanta007" target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 22px', background: NAVY, color: '#fff', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', textDecoration: 'none' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
                GitHub
              </a>
              <a href="mailto:www.srikrishna111@gmail.com"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 22px', border: `1px solid ${NAVY}`, color: NAVY, fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', textDecoration: 'none', background: 'transparent' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = NAVY; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = NAVY; }}
              >
                Contact
              </a>
            </div>
          </div>

          {/* research focus */}
          <div style={{ background: '#f3f0ff', padding: '40px 36px', border: '1px solid rgba(139,92,246,0.15)' }}>
            <div style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.32em', color: '#7c3aed', marginBottom: '28px' }}>
              Research Focus
            </div>
            {[
              { label: 'Statistical Inference',  sub: 'Hypothesis testing, distribution fitting, backtesting edge validity' },
              { label: 'Time Series Analysis',   sub: 'ARIMA, stationarity testing, regime detection, volatility modelling' },
              { label: 'ML for Finance',         sub: 'Feature engineering from OHLCV data, classification, sequential models' },
              { label: 'Multi-Agent AI Systems', sub: 'LangGraph pipelines, RAG over structured knowledge, tool-use agents — built and deployed in production' },
              { label: 'Systematic Execution',   sub: 'Rules-based doctrine design, position lifecycle management, structured decision frameworks' },
            ].map((item, i) => (
              <div key={item.label} style={{ borderTop: `1px solid ${BLUE}22`, padding: '16px 0' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: TEXT, marginBottom: '4px' }}>{item.label}</div>
                <div style={{ fontSize: '11px', color: MUTED, lineHeight: 1.55 }}>{item.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* NETRA platform strip */}
        <div style={{ borderLeft: `3px solid #0d9488`, padding: '20px 32px', marginBottom: '88px', background: '#edfafa' }}>
          <div style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#0d9488', marginBottom: '8px' }}>NETRA Platform</div>
          <p style={{ fontSize: '15px', fontWeight: 500, color: TEXT, margin: 0, lineHeight: 1.7, fontFamily: SERIF, fontStyle: 'italic' }}>
            NETRA is the platform. Each model inside it is a separate doctrine — its own scope, its own rules, its own AI layer. Pinaka is live. Trishul is in design. More follow as the research matures.
          </p>
        </div>


        {/* ════════════════════════════════════════
            PINAKA
        ════════════════════════════════════════ */}
        {/* Pinaka hero — 2 col */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>

          {/* description card */}
          <div style={{ background: BLUE_BG, padding: '44px 48px', border: `1px solid ${BLUE}22` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
              <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#10b981' }}>Live · NSE F&O · Intraday</span>
            </div>
            <h2 style={{ fontFamily: SERIF, fontSize: '52px', fontWeight: 700, color: NAVY, letterSpacing: '-0.03em', lineHeight: 0.95, margin: '0 0 20px 0' }}>PINAKA</h2>
            <div style={{ width: '32px', height: '2px', background: BLUE, marginBottom: '24px' }} />
            <p style={{ fontSize: '15px', lineHeight: 1.8, color: TEXT, margin: '0 0 16px 0' }}>
              Entry-level AI-assisted trading assistant for the retail trader who wants to think more clearly — not just trade faster.
            </p>
            <p style={{ fontSize: '13px', lineHeight: 1.8, color: MUTED, margin: 0 }}>
              Not a signal generator. A structured reasoning environment. The AI can analyse and audit. It cannot override the doctrine.
            </p>
          </div>

          {/* stats — 2x2 on white */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              { n: '10', label: 'Gating Phases',   sub: 'Each is a hard gate — nothing skips forward' },
              { n: '5',  label: 'AI Agents',        sub: 'MAYA: researcher → gate → critic → audit' },
              { n: '3',  label: 'RAG Collections',  sub: 'Doctrine, trade history, market knowledge' },
              { n: '∅',  label: 'Zero Overrides',   sub: 'The doctrine is the final word' },
            ].map(s => (
              <div key={s.label} style={{ background: BLUE_MID, padding: '28px 24px', border: `1px solid ${BLUE}22` }}>
                <div style={{ fontFamily: MONO, fontSize: '44px', fontWeight: 900, color: BLUE, letterSpacing: '-0.05em', lineHeight: 1, marginBottom: '8px' }}>{s.n}</div>
                <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: NAVY, marginBottom: '5px' }}>{s.label}</div>
                <div style={{ fontSize: '11px', color: MUTED, lineHeight: 1.5 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Phase pipeline */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ background: BLUE_BG, padding: '18px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `2px solid ${BLUE}33` }}>
            <span style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: BLUE }}>The 10-Phase Pipeline</span>
            <span style={{ fontSize: '10px', fontWeight: 600, color: MUTED, fontFamily: MONO }}>PINAKA DOCTRINE v3</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '2px', background: `${BLUE}18` }}>
            {PHASES.map(p => (
              <div key={p.n} style={{ background: BLUE_BG, padding: '22px 20px', borderBottom: `2px solid ${BLUE}22` }}>
                <div style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 900, color: BLUE, marginBottom: '10px' }}>{p.n}</div>
                <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em', color: NAVY, marginBottom: '7px' }}>{p.name}</div>
                <p style={{ fontSize: '11px', color: MUTED, lineHeight: 1.6, margin: 0 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* MAYA — neon */}
        <div style={{ marginBottom: '88px' }}>
          <div style={{ background: NEON_BG, padding: '18px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `2px solid ${NEON}66` }}>
            <span style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#00994d' }}>MAYA — AI Engine</span>
            <span style={{ fontSize: '10px', fontWeight: 600, color: MUTED, fontFamily: MONO }}>LangGraph · Multi-Agent</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '2px', background: `${NEON}33` }}>
            {AGENTS.map(a => (
              <div key={a.name} style={{ background: NEON_BG, padding: '26px 20px', borderBottom: `2px solid ${NEON}55` }}>
                <div style={{ fontFamily: MONO, fontSize: '11px', fontWeight: 900, color: '#00994d', marginBottom: '10px' }}>{a.n}</div>
                <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em', color: NAVY, marginBottom: '7px' }}>{a.name}</div>
                <p style={{ fontSize: '11px', color: MUTED, lineHeight: 1.6, margin: 0 }}>{a.desc}</p>
              </div>
            ))}
          </div>
        </div>


        {/* ════════════════════════════════════════
            HORIZON — the model roadmap (Trishul leads)
        ════════════════════════════════════════ */}
        <Eyebrow label="On the Horizon" color={MUTED} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '88px' }}>
          {[
            { n: '02', name: 'TRISHUL',  sub: 'Swing · Positional · Quant',     color: ORANGE, bg: ORANGE_BG,
              desc: 'A quant-informed positional swing model — same doctrine-first spine as Pinaka, built on statistical edge measurement, regime detection, and institutional-grade risk. In active design as the research deepens.' },
            { n: '03', name: 'DRISHTI',  sub: 'Market Vision · Options Flow',   color: '#8b5cf6', bg: '#f3f0ff',
              desc: 'OI analysis, unusual flow detection, and IV regime interpretation. For options traders who want to read the table before placing a bet.' },
            { n: '04', name: 'CHAKRA',   sub: 'Portfolio · Correlation Engine', color: '#0ea5e9', bg: '#f0f9ff',
              desc: 'Multi-position correlation management. Prevents concentration risk across simultaneously open trades with shared underlying exposure.' },
            { n: '···', name: '···',     sub: 'More as research matures',       color: MUTED, bg: '#f8f9fb',
              desc: 'New models are added when the doctrine behind them is well-defined and testable. Not before. NETRA grows with the research.' },
          ].map(m => (
            <div key={m.name} style={{ background: m.bg, padding: '32px 30px', border: `1px solid ${m.color}22`, borderTop: `3px solid ${m.color}` }}>
              <div style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 700, color: m.color, marginBottom: '8px' }}>{m.n}</div>
              <div style={{ fontFamily: SERIF, fontSize: '22px', fontWeight: 700, color: NAVY, marginBottom: '6px' }}>{m.name}</div>
              <div style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: m.color, marginBottom: '16px' }}>{m.sub}</div>
              <p style={{ fontSize: '12px', color: MUTED, lineHeight: 1.75, margin: 0 }}>{m.desc}</p>
            </div>
          ))}
        </div>


        {/* QUOTE */}
        <div style={{ borderLeft: `4px solid ${BLUE}`, padding: '40px 52px', marginBottom: '72px', background: BLUE_BG }}>
          <div style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.32em', color: BLUE, marginBottom: '20px' }}>Pinaka Doctrine · Core Axiom</div>
          <p style={{ fontFamily: SERIF, fontSize: '24px', fontWeight: 700, color: NAVY, lineHeight: 1.65, margin: '0 0 24px 0', letterSpacing: '-0.01em', maxWidth: '780px' }}>
            "The market does not reward the analyst who knows the most. It rewards the one who has the clearest rules for acting correctly under uncertainty — and the discipline to follow them when it matters."
          </p>
          <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.25em', color: MUTED }}>Sri Krishna · Pinaka Doctrine</div>
        </div>

      </div>
      <Footer />
    </div>
  );
}
