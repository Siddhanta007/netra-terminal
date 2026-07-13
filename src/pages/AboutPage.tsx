import Footer from '../components/Layout/Footer';

const BLUE = '#4169E1';
const INK = '#111827';
const TEXT = '#243041';
const MUTED = '#64748b';
const LINE = 'rgba(17,24,39,0.12)';
const PAPER = '#f7f8fb';
const BLUE_SOFT = '#eef3ff';
const ORANGE_SOFT = '#fff3e8';
const SKY_SOFT = '#edf6ff';
const VIOLET_SOFT = '#f3efff';
const MONO = "'JetBrains Mono', monospace";
const SERIF = "Georgia, 'Times New Roman', serif";

const stack = [
  'NETRA platform shell and terminal workspaces',
  'MAYA retrieval, reasoning, critique, and audit layer',
  'Pinaka model with state tree, command aliases, and child routes',
  'MongoDB app trades and committed learning records',
  'Vector memory over closed trade paths',
  'Postgres tabular path store for structured retrieval',
  'Profile, access, cost, portfolio, and model-level stats',
];

const buildItems = [
  {
    label: 'NETRA Platform',
    body: 'The product layer: authentication, access control, terminal workspaces, model pages, portfolio views, user profile, storage, statistics, and commit workflow.',
  },
  {
    label: 'MAYA Intelligence',
    body: 'The AI layer inside NETRA: retrieval, reasoning, critique, audit, model routing, token visibility, and human-readable guidance without replacing the trader.',
  },
  {
    label: 'Pinaka Model',
    body: 'The first trading model hosted by NETRA. Pinaka owns the doctrine, state tree, command aliases, child routes, execution phases, and learning path format.',
  },
  {
    label: 'Learning Memory',
    body: 'Closed and committed trades become path records: phase dimensions, state, child route, execution events, temporal features, trade stats, and outcome.',
  },
];

const metrics = [
  ['NETRA', 'Platform'],
  ['MAYA', 'AI layer'],
  ['Pinaka', 'First model'],
  ['1', 'End-to-end system'],
];

const layers = [
  {
    name: 'NETRA',
    role: 'Platform',
    body: 'Hosts models, terminals, user access, storage, statistics, profile cost visibility, portfolio views, and the commit pipeline.',
  },
  {
    name: 'MAYA',
    role: 'AI Layer',
    body: 'Reads phase data, retrieves context, reasons over doctrine and history, critiques decisions, audits trades, and exposes model cost.',
  },
  {
    name: 'Pinaka',
    role: 'Trading Model',
    body: 'The first model running inside NETRA. It defines the doctrine tree, state aliases, child routes, execution phases, and learning schema.',
  },
];

const pathRows = [
  ['State', 'NS-02', 'SATURATION alias, dimensions, events'],
  ['Child Route', 'NS-02-CS01', 'Weapon alias, dimensions, events'],
  ['Trade', 'Execution', 'entry, exits, cost, temporal actions'],
  ['Outcome', 'Learning label', 'PnL, R multiple, win/loss, holding time'],
];

const cornerRects = [
  [420, 20, 72, 42, '#4169E1'],
  [528, 6, 46, 46, '#f59e0b'],
  [606, 44, 84, 54, '#8cc6e8'],
  [356, 92, 60, 60, '#64748b'],
  [476, 110, 96, 48, '#4169E1'],
  [604, 142, 52, 52, '#f59e0b'],
  [282, 172, 74, 46, '#8cc6e8'],
  [398, 214, 102, 54, '#4169E1'],
  [552, 246, 68, 68, '#64748b'],
  [320, 306, 56, 56, '#f59e0b'],
];

const pathNodes = [
  [48, 278, 'P1'],
  [128, 220, 'P2'],
  [224, 252, 'P3'],
  [314, 164, 'P5'],
  [410, 202, 'P7'],
  [508, 126, 'T'],
];

function AboutBackground() {
  return (
    <div className="about-bg" aria-hidden="true">
      <svg className="about-bg-top" viewBox="0 0 720 420" fill="none">
        <path d="M356 40H690V310H606V378H260V268H126V112H356V40Z" stroke="#111827" strokeOpacity="0.08" strokeWidth="1" />
        <path d="M126 112H356M356 40V268M260 268H606M606 310V142" stroke="#111827" strokeOpacity="0.08" strokeWidth="1" />
        {cornerRects.map(([x, y, w, h, color], index) => (
          <rect
            key={`${x}-${y}-${index}`}
            x={x}
            y={y}
            width={w}
            height={h}
            stroke={color}
            strokeWidth="4"
            strokeOpacity="0.34"
            fill="rgba(255,255,255,0.18)"
          />
        ))}
        <path d="M266 338C330 300 382 324 436 284C496 240 540 242 626 198" stroke="#4169E1" strokeOpacity="0.22" strokeWidth="3" />
        <path d="M284 362C354 324 398 360 462 326C516 298 560 298 652 264" stroke="#f59e0b" strokeOpacity="0.2" strokeWidth="3" />
      </svg>

      <svg className="about-bg-bottom" viewBox="0 0 600 360" fill="none">
        <path d="M48 278L128 220L224 252L314 164L410 202L508 126" stroke="#111827" strokeOpacity="0.18" strokeWidth="2" />
        <path d="M48 278L224 252L410 202" stroke="#4169E1" strokeOpacity="0.2" strokeWidth="5" />
        <path d="M128 220L314 164L508 126" stroke="#8cc6e8" strokeOpacity="0.18" strokeWidth="5" />
        {pathNodes.map(([cx, cy, label], index) => (
          <g key={label}>
            <rect
              x={Number(cx) - 28}
              y={Number(cy) - 18}
              width="56"
              height="36"
              fill="#ffffff"
              stroke={index % 2 === 0 ? '#4169E1' : '#111827'}
              strokeOpacity={index % 2 === 0 ? 0.32 : 0.18}
              strokeWidth="3"
            />
            <text
              x={Number(cx)}
              y={Number(cy) + 4}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize="13"
              fontWeight="900"
              fill="#111827"
              opacity="0.42"
            >
              {label}
            </text>
          </g>
        ))}
        <path d="M20 320H560M20 80H560M82 42V338M274 42V338M464 42V338" stroke="#111827" strokeOpacity="0.06" />
      </svg>
    </div>
  );
}

function CaseLabel({ children }: { children: string }) {
  return (
    <div className="about-eyebrow">
      <span />
      {children}
    </div>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="about-stat">
      <div>{value}</div>
      <span>{label}</span>
    </div>
  );
}

function SystemDiagram() {
  return (
    <div className="about-diagram" aria-label="NETRA system architecture diagram">
      <div className="diagram-row">
        <div className="diagram-node diagram-node-strong">
          <small>NETRA</small>
          Platform Shell
        </div>
        <div className="diagram-line" />
        <div className="diagram-node">
          <small>Workspace</small>
          Terminal + Pages
        </div>
        <div className="diagram-line" />
        <div className="diagram-node">
          <small>Storage</small>
          App + Stats
        </div>
      </div>

      <div className="diagram-row diagram-row-offset">
        <div className="diagram-node diagram-node-blue">
          <small>MAYA</small>
          AI Layer
        </div>
        <div className="diagram-line" />
        <div className="diagram-node diagram-node-blue">
          <small>Retrieval</small>
          Doctrine + Memory
        </div>
        <div className="diagram-line" />
        <div className="diagram-node diagram-node-blue">
          <small>Audit</small>
          Critique + Cost
        </div>
      </div>

      <div className="diagram-row">
        <div className="diagram-node diagram-node-orange">
          <small>Pinaka</small>
          First Model
        </div>
        <div className="diagram-line" />
        <div className="diagram-node diagram-node-orange">
          <small>Doctrine</small>
          State + Child Route
        </div>
        <div className="diagram-line" />
        <div className="diagram-node diagram-node-sky">
          <small>Learning</small>
          Vector + SQL Path
        </div>
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="about-page">
      <style>{`
        .about-page {
          position: relative;
          min-height: 100%;
          background:
            linear-gradient(180deg, #fbfcff 0%, #f3f6fb 52%, #ffffff 100%);
          color: ${TEXT};
          overflow-x: hidden;
        }

        .about-bg {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }

        .about-bg-top,
        .about-bg-bottom {
          position: absolute;
          display: block;
        }

        .about-bg-top {
          width: min(720px, 54vw);
          top: 6px;
          right: -88px;
          opacity: 0.9;
        }

        .about-bg-bottom {
          width: min(600px, 50vw);
          left: -84px;
          bottom: 44px;
          opacity: 0.74;
        }

        .about-shell {
          position: relative;
          z-index: 1;
          width: min(1180px, calc(100vw - 48px));
          margin: 0 auto;
          padding: 72px 0 0;
        }

        .about-hero {
          min-height: calc(100vh - 148px);
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(360px, 0.95fr);
          gap: 28px;
          align-items: stretch;
          padding-bottom: 44px;
        }

        .about-hero-copy {
          padding: 42px 0 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .about-eyebrow {
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: ${MONO};
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: ${BLUE};
          margin-bottom: 22px;
        }

        .about-eyebrow span {
          width: 30px;
          height: 2px;
          background: ${BLUE};
          display: inline-block;
        }

        .about-title {
          margin: 0;
          font-family: ${SERIF};
          font-size: clamp(62px, 8vw, 112px);
          line-height: 0.88;
          letter-spacing: -0.055em;
          color: ${INK};
        }

        .about-title-mark {
          display: block;
          color: ${BLUE};
        }

        .about-lead {
          max-width: 620px;
          margin: 30px 0 0;
          font-size: 18px;
          line-height: 1.8;
          color: ${TEXT};
        }

        .about-lead strong {
          color: ${INK};
          font-weight: 850;
        }

        .about-sublead {
          max-width: 620px;
          margin: 18px 0 0;
          font-size: 14px;
          line-height: 1.85;
          color: ${MUTED};
        }

        .about-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 34px;
        }

        .about-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 40px;
          padding: 0 20px;
          border: 1px solid ${INK};
          background: ${INK};
          color: #ffffff;
          text-decoration: none;
          font-family: ${MONO};
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          border-radius: 0;
          transition: transform 160ms ease, background 160ms ease, color 160ms ease;
        }

        .about-button:hover {
          transform: translateY(-1px);
          background: ${BLUE};
          border-color: ${BLUE};
        }

        .about-button-secondary {
          background: transparent;
          color: ${INK};
        }

        .about-button-secondary:hover {
          color: #ffffff;
        }

        .about-product-card {
          position: relative;
          background: rgba(247,248,251,0.92);
          border: 1px solid ${LINE};
          border-radius: 0;
          padding: 26px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 24px 70px rgba(15,23,42,0.08);
        }

        .about-product-card:before {
          content: "";
          position: absolute;
          inset: 0 0 auto 0;
          height: 4px;
          background: linear-gradient(90deg, #4169E1, #f59e0b, #8cc6e8);
        }

        .about-card-head {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: flex-start;
          margin-bottom: 22px;
        }

        .about-card-head h2 {
          margin: 0;
          font-size: 28px;
          line-height: 1;
          letter-spacing: -0.03em;
          color: ${INK};
        }

        .about-card-head span {
          font-family: ${MONO};
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #4169E1;
          background: ${SKY_SOFT};
          border: 1px solid rgba(65,105,225,0.18);
          padding: 7px 9px;
          border-radius: 0;
        }

        .about-diagram {
          display: flex;
          flex-direction: column;
          gap: 18px;
          padding: 20px 0 24px;
        }

        .diagram-row {
          display: grid;
          grid-template-columns: 1fr 34px 1fr 34px 1fr;
          align-items: center;
          gap: 8px;
        }

        .diagram-row-offset {
          padding-left: 20px;
          padding-right: 20px;
        }

        .diagram-node {
          min-height: 72px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 7px;
          padding: 14px;
          background: #ffffff;
          border: 1px solid ${LINE};
          border-radius: 0;
          font-family: ${MONO};
          font-size: 11px;
          font-weight: 900;
          color: ${INK};
          letter-spacing: 0.03em;
        }

        .diagram-node small {
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: ${MUTED};
        }

        .diagram-node-strong {
          background: ${INK};
          color: #ffffff;
          border-color: ${INK};
        }

        .diagram-node-blue {
          background: ${BLUE_SOFT};
          border-color: rgba(65,105,225,0.24);
        }

        .diagram-node-sky {
          background: ${SKY_SOFT};
          border-color: rgba(140,198,232,0.24);
        }

        .diagram-node-orange {
          background: ${ORANGE_SOFT};
          border-color: rgba(180,83,9,0.18);
        }

        .diagram-line {
          height: 1px;
          background: ${LINE};
        }

        .about-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-top: 12px;
        }

        .about-stat {
          background: #ffffff;
          border: 1px solid ${LINE};
          border-radius: 0;
          padding: 17px 14px;
        }

        .about-stat div {
          font-family: ${MONO};
          font-size: 30px;
          font-weight: 950;
          color: ${BLUE};
          line-height: 1;
          margin-bottom: 8px;
        }

        .about-stat span {
          font-family: ${MONO};
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: ${MUTED};
        }

        .about-section {
          padding: 68px 0;
          border-top: 1px solid ${LINE};
        }

        .about-section-title {
          display: grid;
          grid-template-columns: minmax(240px, 0.42fr) 1fr;
          gap: 34px;
          align-items: start;
          margin-bottom: 28px;
        }

        .about-section-title h2 {
          margin: 0;
          font-family: ${SERIF};
          font-size: clamp(34px, 4vw, 54px);
          letter-spacing: -0.045em;
          line-height: 0.98;
          color: ${INK};
        }

        .about-section-title p {
          margin: 7px 0 0;
          font-size: 15px;
          line-height: 1.85;
          color: ${MUTED};
          max-width: 720px;
        }

        .about-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }

        .about-layer-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }

        .about-block {
          border: 1px solid ${LINE};
          border-radius: 0;
          padding: 26px;
          background: rgba(255,255,255,0.92);
        }

        .about-block-blue { background: ${BLUE_SOFT}; }
        .about-block-orange { background: ${ORANGE_SOFT}; }
        .about-block-violet { background: ${VIOLET_SOFT}; }
        .about-block-sky { background: ${SKY_SOFT}; }

        .about-block h3 {
          margin: 0 0 14px;
          font-size: 17px;
          color: ${INK};
          letter-spacing: -0.01em;
        }

        .about-block p {
          margin: 0;
          font-size: 13px;
          line-height: 1.75;
          color: ${TEXT};
        }

        .about-layer {
          min-height: 260px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border: 1px solid ${LINE};
          border-radius: 0;
          background: rgba(255,255,255,0.92);
          padding: 24px;
        }

        .about-layer:nth-child(1) { background: ${BLUE_SOFT}; }
        .about-layer:nth-child(2) { background: ${SKY_SOFT}; }
        .about-layer:nth-child(3) { background: ${ORANGE_SOFT}; }

        .about-layer small {
          font-family: ${MONO};
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: ${MUTED};
        }

        .about-layer h3 {
          margin: 18px 0 14px;
          font-family: ${SERIF};
          font-size: 38px;
          line-height: 0.95;
          letter-spacing: -0.045em;
          color: ${INK};
        }

        .about-layer p {
          margin: 0;
          font-size: 13px;
          line-height: 1.8;
          color: ${TEXT};
        }

        .about-layer-mark {
          width: 100%;
          height: 1px;
          margin-top: 24px;
          background: rgba(17,24,39,0.2);
        }

        .about-stack {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          border: 1px solid ${LINE};
          border-radius: 0;
          overflow: hidden;
          background: #ffffff;
        }

        .about-stack div {
          min-height: 104px;
          padding: 16px 13px;
          border-right: 1px solid ${LINE};
          display: flex;
          align-items: flex-end;
          font-family: ${MONO};
          font-size: 9px;
          font-weight: 850;
          line-height: 1.55;
          letter-spacing: 0.04em;
          color: ${INK};
          background: linear-gradient(180deg, #ffffff, #f8fafc);
        }

        .about-stack div:nth-child(2n) {
          background: ${BLUE_SOFT};
        }

        .about-stack div:last-child {
          border-right: none;
        }

        .about-table {
          border: 1px solid ${LINE};
          border-radius: 0;
          overflow: hidden;
          background: #ffffff;
        }

        .about-table-row {
          display: grid;
          grid-template-columns: 0.8fr 0.9fr 1.7fr;
          border-bottom: 1px solid ${LINE};
        }

        .about-table-row:last-child {
          border-bottom: none;
        }

        .about-table-row div {
          padding: 18px 20px;
          border-right: 1px solid ${LINE};
          font-size: 13px;
          line-height: 1.55;
        }

        .about-table-row div:last-child {
          border-right: none;
          color: ${MUTED};
        }

        .about-table-row div:first-child {
          font-family: ${MONO};
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: ${BLUE};
        }

        .about-table-row div:nth-child(2) {
          font-family: ${MONO};
          font-weight: 900;
          color: ${INK};
        }

        .about-close {
          margin: 72px 0 84px;
          padding: 42px;
          border-radius: 0;
          border: 1px solid rgba(65,105,225,0.18);
          background: linear-gradient(135deg, ${BLUE_SOFT}, #ffffff 58%, ${ORANGE_SOFT});
        }

        .about-close h2 {
          margin: 0;
          max-width: 900px;
          font-family: ${SERIF};
          font-size: clamp(36px, 4vw, 60px);
          line-height: 1.02;
          letter-spacing: -0.045em;
          color: ${INK};
        }

        .about-close p {
          max-width: 760px;
          margin: 22px 0 0;
          font-size: 15px;
          line-height: 1.85;
          color: ${TEXT};
        }

        @media (max-width: 980px) {
          .about-shell { width: min(100% - 28px, 760px); padding-top: 46px; }
          .about-hero,
          .about-section-title,
          .about-grid-2,
          .about-layer-grid {
            grid-template-columns: 1fr;
          }
          .about-product-card { min-height: auto; }
          .about-stat-grid { grid-template-columns: repeat(2, 1fr); }
          .about-stack { grid-template-columns: 1fr; }
          .about-stack div { min-height: 58px; border-right: none; border-bottom: 1px solid ${LINE}; }
          .about-stack div:last-child { border-bottom: none; }
          .about-table-row { grid-template-columns: 1fr; }
          .about-table-row div { border-right: none; border-bottom: 1px solid ${LINE}; }
          .about-table-row div:last-child { border-bottom: none; }
          .diagram-row { grid-template-columns: 1fr; }
          .diagram-line { height: 18px; width: 1px; margin: 0 auto; }
          .diagram-row-offset { padding: 0; }
        }
      `}</style>

      <AboutBackground />

      <main className="about-shell">
        <section className="about-hero">
          <div className="about-hero-copy">
            <CaseLabel>Product Case Study</CaseLabel>
            <h1 className="about-title">
              NETRA
              <span className="about-title-mark">Platform</span>
            </h1>
            <p className="about-lead">
              I built <strong>NETRA</strong> as an AI-assisted trading research platform for retail decision discipline.
            </p>
            <p className="about-sublead">
              NETRA is the platform. MAYA is the intelligence layer inside the platform. Pinaka is the first trading model hosted by NETRA. This separation matters because the product is not a single strategy page. It is a system for running models, logging decisions, auditing trades, and turning committed outcomes into learning memory.
            </p>
            <div className="about-actions">
              <a className="about-button" href="mailto:www.srikrishna111@gmail.com">Contact</a>
              <a className="about-button about-button-secondary" href="https://github.com/Siddhanta007" target="_blank" rel="noopener noreferrer">GitHub</a>
            </div>
          </div>

          <aside className="about-product-card">
            <div>
              <div className="about-card-head">
                <h2>Platform first. AI second. Model third.</h2>
                <span>Live Build</span>
              </div>
              <SystemDiagram />
            </div>
            <div className="about-stat-grid">
              {metrics.map(([value, label]) => <MiniStat key={label} value={value} label={label} />)}
            </div>
          </aside>
        </section>

        <section className="about-section">
          <div className="about-section-title">
            <h2>Three layers, deliberately separated.</h2>
            <p>
              NETRA is designed as a platform that can host more than one trading model. MAYA provides the AI workflow across those models. Pinaka is the first model proving the architecture.
            </p>
          </div>
          <div className="about-layer-grid">
            {layers.map(layer => (
              <article className="about-layer" key={layer.name}>
                <div>
                  <small>{layer.role}</small>
                  <h3>{layer.name}</h3>
                  <p>{layer.body}</p>
                </div>
                <div className="about-layer-mark" />
              </article>
            ))}
          </div>
        </section>

        <section className="about-section">
          <div className="about-section-title">
            <h2>What makes this a fintech product problem?</h2>
            <p>
              Retail trading tools usually optimize for speed, charts, or signals. NETRA optimizes for decision quality: what the trader saw, what model was active, what the AI reviewed, how the position was managed, and what the outcome teaches the system after commit.
            </p>
          </div>
          <div className="about-grid-2">
            {buildItems.map((item, index) => (
              <article
                className={`about-block ${index === 0 ? 'about-block-blue' : index === 1 ? 'about-block-orange' : index === 2 ? 'about-block-sky' : 'about-block-violet'}`}
                key={item.label}
              >
                <h3>{item.label}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-section">
          <div className="about-section-title">
            <h2>Built end to end.</h2>
            <p>
              This is not a UI mockup. I designed the platform surface, the AI workflow, the Pinaka doctrine model, the storage schema, the retrieval layer, and the product mechanics that make it usable for a retail trader under pressure.
            </p>
          </div>
          <div className="about-stack">
            {stack.map(item => <div key={item}>{item}</div>)}
          </div>
        </section>

        <section className="about-section">
          <div className="about-section-title">
            <h2>The learning unit is a path.</h2>
            <p>
              Inside Pinaka, every committed trade becomes one learning record. NETRA does not just store PnL. It stores the path followed through the model, then connects that path to execution behavior, temporal features, and outcome.
            </p>
          </div>
          <div className="about-table">
            {pathRows.map(row => (
              <div className="about-table-row" key={row[0]}>
                <div>{row[0]}</div>
                <div>{row[1]}</div>
                <div>{row[2]}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="about-close">
          <h2>I built NETRA to show platform thinking, not just strategy thinking.</h2>
          <p>
            NETRA proves the platform, MAYA proves the intelligence layer, and Pinaka proves the first model. Together they show product judgment, frontend execution, backend schema design, AI orchestration, retrieval systems, and trading-domain reasoning.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
