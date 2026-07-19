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

function Eyebrow({ index, children }: { index: string; children: string }) {
  return (
    <div className="about-eyebrow">
      <span>{index}</span>
      <i />
      {children}
    </div>
  );
}

const mayaCapabilities = [
  ['Chat agent', 'The main NETRA assistant maintains multi-turn conversations and can call retrieval tools when a question needs doctrine, product, or market context.'],
  ['Decision agents', 'Command and weapon workflows use specialised researcher, theory, historian, suggestion, and critique roles instead of one unverified model response.'],
  ['Vision agent', 'The image descriptor converts an uploaded chart into structured visual evidence that can join the model context.'],
  ['Auditor agents', 'A separate post-trade graph reviews the execution, retrieves relevant doctrine, analyses compliance, produces a verdict, and critiques its own review.'],
  ['RAG + tools', 'Agents can call a shared document-search tool for on-demand retrieval instead of forcing every piece of context into every prompt.'],
  ['GraphRAG', 'Trading theory is organised in Neo4j as connected concepts, passages, and source documents; vector search finds a seed and graph traversal expands the evidence.'],
  ['Episodic memory', 'A completed trade is stored as a trajectory of context, decisions, corrections, execution events, and outcome. Similar past episodes become evidence for a later decision.'],
  ['Model routing', 'A provider-agnostic factory routes workflows across supported language and vision models while NETRA records model availability and usage.'],
];

export default function AboutPage() {
  return (
    <div className="about-page">
      <style>{`
        .about-page {
          position: relative;
          min-height: 100%;
          background: linear-gradient(180deg, #fbfcff 0%, #f3f6fb 52%, #ffffff 100%);
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

        .about-bg-top, .about-bg-bottom { position: absolute; display: block; }
        .about-bg-top { width: min(720px, 54vw); top: 6px; right: -88px; opacity: 0.9; }
        .about-bg-bottom { width: min(600px, 50vw); left: -84px; bottom: 44px; opacity: 0.74; }

        .about-shell {
          position: relative;
          z-index: 1;
          width: min(1240px, calc(100vw - 56px));
          margin: 0 auto;
          padding: 64px 0 88px;
        }

        .about-eyebrow {
          display: flex;
          align-items: center;
          gap: 11px;
          font-family: ${MONO};
          font-size: 9px;
          font-style: normal;
          font-weight: 900;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: ${BLUE};
        }

        .about-eyebrow span { color: ${INK}; }
        .about-eyebrow i { width: 28px; height: 1px; background: ${BLUE}; }

        .about-hero {
          min-height: calc(100vh - 170px);
          display: grid;
          grid-template-columns: minmax(0, 1.08fr) minmax(390px, 0.72fr);
          gap: 72px;
          align-items: center;
          padding-bottom: 58px;
        }

        .about-title {
          margin: 25px 0 0;
          font-family: ${SERIF};
          font-size: clamp(76px, 10vw, 144px);
          line-height: 0.78;
          letter-spacing: -0.07em;
          color: ${INK};
        }

        .about-title span { display: block; color: ${BLUE}; }

        .about-problem {
          margin-top: 48px;
          padding-top: 25px;
          border-top: 1px solid ${LINE};
          display: grid;
          grid-template-columns: 118px 1fr;
          gap: 28px;
        }

        .about-problem small {
          font-family: ${MONO};
          font-size: 9px;
          font-weight: 900;
          line-height: 1.6;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: ${MUTED};
        }

        .about-problem p {
          margin: 0;
          max-width: 680px;
          font-size: 18px;
          line-height: 1.72;
          color: ${TEXT};
        }

        .about-problem strong { color: ${INK}; }

        .about-hero-aside {
          align-self: stretch;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 34px;
          border: 1px solid ${LINE};
          background: rgba(247, 248, 251, 0.92);
          box-shadow: 0 24px 70px rgba(15, 23, 42, 0.08);
        }

        .hero-decision-path {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          flex: 1;
          min-height: 150px;
          margin-bottom: 42px;
          border: 1px solid rgba(65,105,225,0.14);
        }

        .hero-decision-path div {
          min-height: 108px;
          padding: 17px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border-right: 1px solid rgba(65,105,225,0.14);
          border-bottom: 1px solid rgba(65,105,225,0.14);
          background: rgba(255,255,255,0.36);
        }

        .hero-decision-path div:nth-child(2n) { border-right: none; }
        .hero-decision-path div:nth-child(n+3) { border-bottom: none; }
        .hero-decision-path span { font-family: ${MONO}; font-size: 8px; font-weight: 900; letter-spacing: 0.14em; color: ${BLUE}; }
        .hero-decision-path strong { max-width: 145px; font-size: 12px; line-height: 1.5; color: ${INK}; }

        .about-hero-aside h2 {
          margin: 18px 0 0;
          font-family: ${SERIF};
          font-size: 35px;
          line-height: 1.05;
          letter-spacing: -0.035em;
          color: ${INK};
        }

        .about-hero-aside p { margin: 18px 0 0; font-size: 13px; line-height: 1.8; color: ${MUTED}; }

        .about-component-nav {
          display: grid;
          grid-template-columns: 1.2fr 1fr 1fr 1fr;
          border: 1px solid ${LINE};
          background: rgba(255,255,255,0.9);
        }

        .about-component-nav div {
          min-height: 108px;
          padding: 18px;
          border-right: 1px solid ${LINE};
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .about-component-nav div:last-child { border-right: none; }
        .about-component-nav div:nth-child(1) { background: ${BLUE_SOFT}; }
        .about-component-nav div:nth-child(2) { background: ${SKY_SOFT}; }
        .about-component-nav div:nth-child(3), .about-component-nav div:nth-child(4) { background: ${ORANGE_SOFT}; }
        .about-component-nav span { font-family: ${MONO}; font-size: 8px; font-weight: 900; letter-spacing: 0.16em; text-transform: uppercase; color: ${MUTED}; }
        .about-component-nav strong { font-family: ${SERIF}; font-size: 27px; color: ${INK}; }

        .about-section {
          margin-top: 88px;
          padding-top: 72px;
          border-top: 1px solid ${LINE};
        }

        .about-section-head {
          display: grid;
          grid-template-columns: minmax(260px, 0.42fr) 1fr;
          gap: 72px;
          align-items: start;
          margin-bottom: 40px;
        }

        .about-section-head h2 {
          margin: 22px 0 0;
          font-family: ${SERIF};
          font-size: clamp(46px, 5.3vw, 72px);
          line-height: 0.92;
          letter-spacing: -0.052em;
          color: ${INK};
        }

        .about-section-head h2 span { color: ${BLUE}; }
        .about-section-intro { margin: 4px 0 0; font-size: 17px; line-height: 1.85; color: ${TEXT}; }
        .about-section-intro strong { color: ${INK}; }

        .platform-map {
          display: grid;
          grid-template-columns: 1.25fr 0.75fr;
          gap: 18px;
        }

        .platform-primary, .platform-side article {
          border: 1px solid ${LINE};
          background: rgba(255,255,255,0.92);
          padding: 32px;
        }

        .platform-primary {
          min-height: 380px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: ${BLUE_SOFT};
        }

        .platform-primary h3 { margin: 0; font-family: ${SERIF}; font-size: 44px; line-height: 1; color: ${INK}; }
        .platform-primary > p { max-width: 650px; margin: 22px 0 0; font-size: 14px; line-height: 1.85; }

        .platform-rails {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border-top: 1px solid rgba(17,24,39,0.16);
          margin-top: 44px;
        }

        .platform-rails div { padding: 20px 13px 0 0; }
        .platform-rails span { display: block; font-family: ${MONO}; font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.13em; color: ${BLUE}; }
        .platform-rails strong { display: block; margin-top: 8px; font-size: 12px; line-height: 1.45; color: ${INK}; }

        .platform-side { display: grid; grid-template-rows: 1fr 1fr; gap: 18px; }
        .platform-side article { display: flex; flex-direction: column; justify-content: space-between; min-height: 160px; }
        .platform-side article:first-child { background: ${SKY_SOFT}; }
        .platform-side article:last-child { background: ${VIOLET_SOFT}; }
        .platform-side small { font-family: ${MONO}; font-size: 8px; font-weight: 900; letter-spacing: 0.16em; text-transform: uppercase; color: ${MUTED}; }
        .platform-side h3 { margin: 16px 0 0; font-size: 20px; color: ${INK}; }
        .platform-side p { margin: 12px 0 0; font-size: 12px; line-height: 1.72; color: ${TEXT}; }

        .architecture-stack {
          position: relative;
          padding: 44px;
          border: 1px solid ${LINE};
          background: rgba(255,255,255,0.9);
          box-shadow: 0 24px 70px rgba(15,23,42,0.06);
        }

        .architecture-models {
          width: 78%;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .architecture-box {
          position: relative;
          min-height: 128px;
          padding: 22px;
          border: 1px solid ${LINE};
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: ${ORANGE_SOFT};
        }

        .architecture-box small, .architecture-layer small {
          font-family: ${MONO};
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: ${MUTED};
        }

        .architecture-box strong { font-family: ${SERIF}; font-size: 29px; color: ${INK}; }
        .architecture-box-pinaka { background: ${BLUE_SOFT}; border-color: rgba(65,105,225,0.24); }
        .architecture-box-pinaka strong { color: ${BLUE}; }
        .architecture-box-trishul { background: ${ORANGE_SOFT}; border-color: rgba(245,158,11,0.28); }
        .architecture-box-trishul strong { color: #d97706; }
        .architecture-box-future { background: rgba(247,248,251,0.86); border-style: dashed; }
        .architecture-box-future strong { color: ${MUTED}; }

        .architecture-connector {
          width: 1px;
          height: 34px;
          margin: 0 auto;
          background: ${BLUE};
        }

        .architecture-layer {
          margin: 0 auto;
          padding: 28px 32px;
          border: 1px solid rgba(65,105,225,0.22);
          display: grid;
          grid-template-columns: 0.45fr 1fr;
          gap: 30px;
          align-items: center;
        }

        .architecture-layer h3 { margin: 10px 0 0; font-family: ${SERIF}; font-size: 42px; line-height: 1; color: ${INK}; }
        .architecture-layer p { margin: 0; font-size: 13px; line-height: 1.75; color: ${TEXT}; }
        .architecture-maya { width: 86%; background: ${SKY_SOFT}; }
        .architecture-netra { width: 100%; box-sizing: border-box; background: ${BLUE}; border-color: ${BLUE}; }
        .architecture-netra small, .architecture-netra h3, .architecture-netra p { color: #fff; }
        .architecture-netra small, .architecture-netra p { opacity: 0.78; }

        .architecture-legend {
          display: flex;
          justify-content: space-between;
          gap: 30px;
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid ${LINE};
          font-family: ${MONO};
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: ${MUTED};
        }

        .maya-stage {
          border: 1px solid rgba(65,105,225,0.22);
          background: rgba(238,243,255,0.93);
          padding: 38px;
        }

        .maya-principle {
          display: grid;
          grid-template-columns: 0.7fr 1.3fr;
          gap: 48px;
          padding-bottom: 38px;
          border-bottom: 1px solid rgba(65,105,225,0.22);
        }

        .maya-principle small { font-family: ${MONO}; font-size: 9px; font-weight: 900; letter-spacing: 0.17em; text-transform: uppercase; color: ${BLUE}; }
        .maya-principle h3 { margin: 16px 0 0; font-family: ${SERIF}; font-size: 38px; line-height: 1.05; color: ${INK}; }
        .maya-principle p { margin: 0; font-size: 15px; line-height: 1.85; color: ${TEXT}; }

        .maya-flow {
          display: grid;
          grid-template-columns: 1fr 36px 1fr 36px 1fr 36px 1fr;
          align-items: center;
          gap: 10px;
          padding: 38px 0;
        }

        .maya-flow div:not(.maya-arrow) { min-height: 82px; padding: 16px; background: #fff; border: 1px solid rgba(65,105,225,0.18); }
        .maya-flow small { display: block; font-family: ${MONO}; font-size: 7px; font-weight: 900; letter-spacing: 0.14em; text-transform: uppercase; color: ${MUTED}; }
        .maya-flow strong { display: block; margin-top: 10px; font-size: 12px; line-height: 1.5; color: ${INK}; }
        .maya-arrow { height: 1px; background: ${BLUE}; position: relative; }
        .maya-arrow::after { content: ''; position: absolute; right: -1px; top: -3px; width: 6px; height: 6px; border-top: 1px solid ${BLUE}; border-right: 1px solid ${BLUE}; transform: rotate(45deg); }

        .agent-workflow {
          margin-bottom: 38px;
          border: 1px solid rgba(65,105,225,0.18);
          background: rgba(255,255,255,0.68);
        }

        .agent-workflow-head {
          display: grid;
          grid-template-columns: 0.55fr 1fr;
          gap: 30px;
          padding: 24px;
          border-bottom: 1px solid rgba(65,105,225,0.16);
        }

        .agent-workflow-head small { font-family: ${MONO}; font-size: 8px; font-weight: 900; letter-spacing: 0.16em; text-transform: uppercase; color: ${BLUE}; }
        .agent-workflow-head strong { display: block; margin-top: 9px; font-size: 18px; color: ${INK}; }
        .agent-workflow-head p { margin: 0; font-size: 12px; line-height: 1.7; color: ${TEXT}; }

        .agent-pipeline {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
        }

        .agent-node {
          position: relative;
          min-height: 116px;
          padding: 19px 17px;
          border-right: 1px solid rgba(65,105,225,0.16);
        }

        .agent-node:last-child { border-right: none; }
        .agent-node::after { content: '→'; position: absolute; right: -8px; top: 49%; z-index: 2; color: ${BLUE}; font-family: ${MONO}; font-size: 13px; }
        .agent-node:last-child::after { content: ''; }
        .agent-node span { font-family: ${MONO}; font-size: 7px; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; color: ${MUTED}; }
        .agent-node strong { display: block; margin-top: 22px; font-size: 12px; color: ${INK}; }
        .agent-node-parallel { background: ${VIOLET_SOFT}; }
        .agent-node-critique { background: ${BLUE_SOFT}; }

        .maya-capabilities { display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid rgba(65,105,225,0.18); }
        .maya-capability { min-height: 190px; padding: 25px; background: rgba(255,255,255,0.72); border-right: 1px solid rgba(65,105,225,0.16); border-bottom: 1px solid rgba(65,105,225,0.16); }
        .maya-capability:nth-child(4n) { border-right: none; }
        .maya-capability:nth-child(n+5) { border-bottom: none; }
        .maya-capability span { font-family: ${MONO}; font-size: 8px; font-weight: 900; letter-spacing: 0.16em; color: ${BLUE}; }
        .maya-capability h3 { margin: 28px 0 12px; font-size: 17px; color: ${INK}; }
        .maya-capability p { margin: 0; font-size: 12px; line-height: 1.72; color: ${TEXT}; }

        .model-grid { display: grid; grid-template-columns: 1fr; gap: 18px; }
        .model-card { border: 1px solid ${LINE}; padding: 36px; background: rgba(255,255,255,0.94); }
        .model-card-pinaka { min-height: 480px; background: ${BLUE_SOFT}; border-color: rgba(65,105,225,0.22); display: flex; flex-direction: column; justify-content: space-between; }
        .model-card-pinaka h3 { color: ${BLUE}; }
        .model-status { display: flex; justify-content: space-between; gap: 20px; font-family: ${MONO}; font-size: 8px; font-weight: 900; letter-spacing: 0.15em; text-transform: uppercase; color: ${MUTED}; }
        .model-status b { color: ${BLUE}; }
        .model-card h3 { margin: 32px 0 0; font-family: ${SERIF}; font-size: 54px; line-height: 0.9; color: ${INK}; }
        .model-card > div > p { margin: 25px 0 0; max-width: 680px; font-size: 14px; line-height: 1.85; color: ${TEXT}; }

        .pinaka-loop { display: grid; grid-template-columns: repeat(4, 1fr); margin-top: 46px; border-top: 1px solid rgba(17,24,39,0.16); }
        .pinaka-loop div { padding: 20px 15px 0 0; }
        .pinaka-loop span { font-family: ${MONO}; font-size: 8px; font-weight: 900; letter-spacing: 0.12em; color: ${BLUE}; }
        .pinaka-loop strong { display: block; margin-top: 10px; font-size: 11px; line-height: 1.5; color: ${INK}; }
        .pinaka-doctrine { display: grid; grid-template-columns: repeat(5, 1fr); margin-top: 34px; border: 1px solid rgba(65,105,225,0.2); }
        .pinaka-doctrine div { min-height: 98px; padding: 17px; border-right: 1px solid rgba(65,105,225,0.17); background: rgba(255,255,255,0.48); }
        .pinaka-doctrine div:last-child { border-right: none; }
        .pinaka-doctrine span { font-family: ${MONO}; font-size: 7px; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; color: ${BLUE}; }
        .pinaka-doctrine strong { display: block; margin-top: 15px; font-size: 12px; line-height: 1.45; color: ${INK}; }
        .trishul-stage {
          border: 1px solid rgba(245, 158, 11, 0.24);
          background: ${ORANGE_SOFT};
          padding: 38px;
        }

        .trishul-thesis {
          display: grid;
          grid-template-columns: 0.75fr 1.25fr;
          gap: 52px;
          padding-bottom: 38px;
          border-bottom: 1px solid rgba(245, 158, 11, 0.2);
        }

        .trishul-thesis small { font-family: ${MONO}; font-size: 8px; font-weight: 900; letter-spacing: 0.16em; text-transform: uppercase; color: #d97706; }
        .trishul-orange { color: #d97706 !important; }
        .trishul-thesis h3 { margin: 16px 0 0; font-family: ${SERIF}; font-size: 39px; line-height: 1.04; color: ${INK}; }
        .trishul-thesis p { margin: 0; font-size: 15px; line-height: 1.85; color: ${TEXT}; }

        .trishul-pipeline {
          display: grid;
          grid-template-columns: repeat(10, 1fr);
          margin-top: 38px;
          border: 1px solid rgba(245, 158, 11, 0.2);
          background: rgba(255,255,255,0.62);
        }

        .trishul-pipeline div {
          min-height: 110px;
          padding: 16px 12px;
          border-right: 1px solid rgba(245, 158, 11, 0.17);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .trishul-pipeline div:last-child { border-right: none; }
        .trishul-pipeline span { font-family: ${MONO}; font-size: 7px; font-weight: 900; letter-spacing: 0.1em; color: #d97706; }
        .trishul-pipeline strong { font-size: 10px; line-height: 1.4; color: ${INK}; }

        .trishul-output {
          display: grid;
          grid-template-columns: 0.7fr 1.3fr;
          gap: 18px;
          margin-top: 18px;
        }

        .trishul-question, .trishul-evidence {
          min-height: 210px;
          padding: 28px;
          border: 1px solid rgba(245, 158, 11, 0.2);
          background: rgba(255,255,255,0.72);
        }

        .trishul-question small, .trishul-evidence > small { font-family: ${MONO}; font-size: 8px; font-weight: 900; letter-spacing: 0.16em; text-transform: uppercase; color: #d97706; }
        .trishul-question blockquote { margin: 32px 0 0; font-family: ${SERIF}; font-size: 27px; line-height: 1.25; color: ${INK}; }
        .trishul-evidence-grid { display: grid; grid-template-columns: repeat(4, 1fr); margin-top: 28px; }
        .trishul-evidence-grid div { padding-right: 15px; }
        .trishul-evidence-grid span { font-family: ${MONO}; font-size: 7px; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; color: ${MUTED}; }
        .trishul-evidence-grid strong { display: block; margin-top: 12px; font-size: 13px; line-height: 1.45; color: ${INK}; }

        .trishul-capabilities {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          margin-top: 18px;
          border: 1px solid rgba(245, 158, 11, 0.2);
        }

        .trishul-capabilities div { min-height: 112px; padding: 19px; border-right: 1px solid rgba(245, 158, 11, 0.17); border-bottom: 1px solid rgba(245, 158, 11, 0.17); background: rgba(255,255,255,0.48); }
        .trishul-capabilities div:nth-child(4n) { border-right: none; }
        .trishul-capabilities div:nth-child(n+5) { border-bottom: none; }
        .trishul-capabilities span { font-family: ${MONO}; font-size: 7px; font-weight: 900; letter-spacing: 0.11em; text-transform: uppercase; color: #d97706; }
        .trishul-capabilities strong { display: block; margin-top: 17px; font-size: 12px; line-height: 1.45; color: ${INK}; }

        .about-close {
          margin-top: 88px;
          padding: 48px;
          border: 1px solid rgba(65,105,225,0.18);
          background: linear-gradient(135deg, ${BLUE_SOFT}, #ffffff 58%, ${ORANGE_SOFT});
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 70px;
          align-items: end;
        }

        .about-close h2 { margin: 20px 0 0; font-family: ${SERIF}; font-size: clamp(38px, 4.5vw, 62px); line-height: 1; letter-spacing: -0.045em; color: ${INK}; }
        .about-close p { margin: 0; font-size: 14px; line-height: 1.85; color: ${TEXT}; }
        .about-actions { display: flex; gap: 10px; margin-top: 28px; }
        .about-button { display: inline-flex; min-height: 39px; padding: 0 18px; align-items: center; justify-content: center; border: 1px solid ${INK}; background: ${INK}; color: #fff; text-decoration: none; font-family: ${MONO}; font-size: 9px; font-weight: 900; letter-spacing: 0.15em; text-transform: uppercase; }
        .about-button-secondary { background: transparent; color: ${INK}; }

        @media (max-width: 980px) {
          .about-shell { width: min(100% - 28px, 760px); padding-top: 44px; }
          .about-hero, .about-section-head, .platform-map, .maya-principle, .model-grid, .about-close, .trishul-thesis, .trishul-output { grid-template-columns: 1fr; }
          .about-hero { gap: 36px; }
          .about-hero-aside { min-height: 440px; }
          .about-component-nav { grid-template-columns: 1fr 1fr; }
          .about-component-nav div:nth-child(2) { border-right: none; }
          .about-component-nav div:nth-child(-n+2) { border-bottom: 1px solid ${LINE}; }
          .platform-primary { min-height: auto; }
          .architecture-models { width: 92%; }
          .architecture-maya { width: 94%; }
          .agent-pipeline { grid-template-columns: repeat(3, 1fr); }
          .agent-node:nth-child(3) { border-right: none; }
          .agent-node:nth-child(-n+3) { border-bottom: 1px solid rgba(65,105,225,0.16); }
          .agent-node:nth-child(3)::after { content: ''; }
          .maya-capabilities { grid-template-columns: 1fr 1fr; }
          .maya-capability, .maya-capability:nth-child(4n), .maya-capability:nth-child(n+5) { border-right: 1px solid rgba(65,105,225,0.16); border-bottom: 1px solid rgba(65,105,225,0.16); }
          .maya-capability:nth-child(2n) { border-right: none; }
          .maya-capability:nth-child(n+7) { border-bottom: none; }
          .pinaka-doctrine { grid-template-columns: repeat(3, 1fr); }
          .pinaka-doctrine div { border-bottom: 1px solid rgba(65,105,225,0.17); }
          .pinaka-doctrine div:nth-child(3) { border-right: none; }
          .pinaka-doctrine div:nth-child(n+4) { border-bottom: none; }
          .trishul-pipeline { grid-template-columns: repeat(5, 1fr); }
          .trishul-pipeline div:nth-child(5) { border-right: none; }
          .trishul-pipeline div:nth-child(-n+5) { border-bottom: 1px solid rgba(245, 158, 11, 0.17); }
          .trishul-evidence-grid, .trishul-capabilities { grid-template-columns: repeat(2, 1fr); }
          .trishul-capabilities div:nth-child(2n) { border-right: none; }
          .trishul-capabilities div:nth-child(n+5) { border-bottom: 1px solid rgba(245, 158, 11, 0.17); }
          .trishul-capabilities div:nth-child(n+7) { border-bottom: none; }
        }

        @media (max-width: 640px) {
          .about-title { font-size: 74px; }
          .about-problem { grid-template-columns: 1fr; gap: 12px; }
          .about-component-nav, .platform-rails, .architecture-models, .maya-capabilities, .pinaka-loop, .pinaka-doctrine { grid-template-columns: 1fr; }
          .about-component-nav div { border-right: none; border-bottom: 1px solid ${LINE}; }
          .about-component-nav div:last-child { border-bottom: none; }
          .about-section { margin-top: 62px; padding-top: 52px; }
          .about-section-head { gap: 28px; }
          .architecture-stack, .maya-stage, .model-card, .trishul-stage, .about-close { padding: 25px; }
          .architecture-models, .architecture-maya { width: 100%; }
          .architecture-layer, .agent-workflow-head { grid-template-columns: 1fr; }
          .architecture-box { min-height: 94px; }
          .architecture-legend { flex-direction: column; gap: 9px; }
          .maya-flow { grid-template-columns: 1fr; }
          .maya-arrow { width: 1px; height: 18px; margin: 0 auto; }
          .maya-arrow::after { right: -3px; top: auto; bottom: -1px; transform: rotate(135deg); }
          .agent-pipeline { grid-template-columns: 1fr; }
          .agent-node, .agent-node:nth-child(3) { border-right: none; border-bottom: 1px solid rgba(65,105,225,0.16); }
          .agent-node::after { content: ''; }
          .maya-capability, .maya-capability:nth-child(2n), .maya-capability:nth-child(4n), .maya-capability:nth-child(n+5), .maya-capability:nth-child(n+7) { border-right: none; border-bottom: 1px solid rgba(65,105,225,0.16); }
          .maya-capability:last-child { border-bottom: none; }
          .pinaka-loop div { border-top: 1px solid rgba(17,24,39,0.1); }
          .pinaka-doctrine div, .pinaka-doctrine div:nth-child(3), .pinaka-doctrine div:nth-child(n+4) { border-right: none; border-bottom: 1px solid rgba(65,105,225,0.17); }
          .pinaka-doctrine div:last-child { border-bottom: none; }
          .trishul-pipeline, .trishul-evidence-grid, .trishul-capabilities { grid-template-columns: 1fr; }
          .trishul-pipeline div, .trishul-pipeline div:nth-child(5) { border-right: none; border-bottom: 1px solid rgba(245, 158, 11, 0.17); }
          .trishul-pipeline div:last-child { border-bottom: none; }
          .trishul-capabilities div, .trishul-capabilities div:nth-child(2n), .trishul-capabilities div:nth-child(4n), .trishul-capabilities div:nth-child(n+5), .trishul-capabilities div:nth-child(n+7) { border-right: none; border-bottom: 1px solid rgba(245, 158, 11, 0.17); }
          .trishul-capabilities div:last-child { border-bottom: none; }
          .about-actions { flex-direction: column; }
        }
      `}</style>

      <AboutBackground />

      <main className="about-shell">
        <section className="about-hero">
          <div>
            <Eyebrow index="Section 00">NETRA as a fintech product</Eyebrow>
            <h1 className="about-title">NETRA<span>Platform</span></h1>
            <div className="about-problem">
              <small>The problem</small>
              <p>
                Building a financial model is only one part of turning it into a usable product. The interface, backend services, AI capabilities, security, data, workflows, records, and analytics are often built as disconnected systems. <strong>NETRA brings those responsibilities into one platform so different financial models can operate on shared product infrastructure.</strong>
              </p>
            </div>
          </div>

          <aside className="about-hero-aside">
            <div className="hero-decision-path" aria-label="NETRA decision path">
              <div><span>01 / Access</span><strong>Secure users, roles, and model workspaces</strong></div>
              <div><span>02 / Operate</span><strong>Run each model through its own workflow</strong></div>
              <div><span>03 / Intelligence</span><strong>Share MAYA&apos;s AI capabilities across the system</strong></div>
              <div><span>04 / Persist</span><strong>Store sessions, records, and outcomes</strong></div>
            </div>
            <Eyebrow index="Product thesis">The product</Eyebrow>
            <h2>One product platform for financial models and intelligence.</h2>
            <p>
              NETRA combines the user interface, backend services, model workflows, MAYA intelligence, storage, access control, trade records, and analytics in one cloud-hosted product.
            </p>
          </aside>
        </section>

        <section className="about-section">
          <div className="about-section-head">
            <div>
              <Eyebrow index="Section 01">Explain NETRA</Eyebrow>
              <h2>NETRA is the <span>product.</span></h2>
            </div>
            <p className="about-section-intro">
              NETRA is the product—not an AI model and not a trading strategy. Its frontend captures user work and presents each model&apos;s workflow; its backend runs authentication, doctrine services, MAYA workflows, persistence, trade records, and analytics. <strong>Together they form the platform on which Pinaka, Trishul, and later models operate.</strong>
            </p>
          </div>

          <div className="platform-map">
            <article className="platform-primary">
              <div>
                <h3>The application layer shared by every model.</h3>
                <p>
                  NETRA provides identity and permissions, guided terminal sessions, persistent session state, portfolios, analytics, AI usage visibility, and the APIs that connect model workflows to intelligence and storage.
                </p>
              </div>
              <div className="platform-rails">
                <div><span>Surface</span><strong>React + TypeScript frontend</strong></div>
                <div><span>Services</span><strong>FastAPI cloud backend</strong></div>
                <div><span>Control</span><strong>Authentication and access</strong></div>
                <div><span>Data</span><strong>Operational application storage</strong></div>
              </div>
            </article>

            <div className="platform-side">
              <article>
                <div>
                  <small>Security + governance</small>
                  <h3>Access is governed at the platform level.</h3>
                </div>
                <p>Users, teams, roles, permitted pages, available models, and provider access are governed by the platform.</p>
              </article>
              <article>
                <div>
                  <small>Cloud + persistence</small>
                  <h3>Session state and trade history remain persistent.</h3>
                </div>
                <p>NETRA persists user profiles, access rules, application configuration, session state, trade records, and portfolio analytics so the product remains consistent across devices and sessions.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="about-section">
          <div className="about-section-head">
            <div>
              <Eyebrow index="Section 02">Product architecture</Eyebrow>
              <h2>One platform. <span>Many models.</span></h2>
            </div>
            <p className="about-section-intro">
              The architecture separates responsibilities. NETRA is the base product. MAYA is the common intelligence layer available throughout that product. Pinaka, Trishul, and future domain models sit above both: each model defines its own doctrine while reusing the same platform and AI capabilities.
            </p>
          </div>

          <div className="architecture-stack" aria-label="NETRA layered product architecture">
            <div className="architecture-models">
              <div className="architecture-box architecture-box-pinaka">
                <small>Operational</small>
                <strong>Pinaka</strong>
              </div>
              <div className="architecture-box architecture-box-trishul">
                <small>Quantitative intelligence</small>
                <strong>Developing Trishul</strong>
              </div>
              <div className="architecture-box architecture-box-future">
                <small>Extensible</small>
                <strong>...</strong>
              </div>
            </div>
            <div className="architecture-connector" />
            <div className="architecture-layer architecture-maya">
              <div><small>Shared intelligence layer</small><h3>MAYA</h3></div>
              <p>Agents, GenAI, retrieval, GraphRAG, episodic memory, tools, vision, critique, audit, and model routing shared across NETRA and its models.</p>
            </div>
            <div className="architecture-connector" />
            <div className="architecture-layer architecture-netra">
              <div><small>Base product layer</small><h3>NETRA</h3></div>
              <p>Frontend, backend, cloud deployment, authentication, security, model workspaces, operational storage, sessions, trades, profiles, and analytics.</p>
            </div>
            <div className="architecture-legend">
              <span>Top / model-specific doctrine</span>
              <span>Middle / shared AI intelligence</span>
              <span>Base / common product infrastructure</span>
            </div>
          </div>
        </section>

        <section className="about-section">
          <div className="about-section-head">
            <div>
              <Eyebrow index="Section 03">MAYA intelligence system</Eyebrow>
              <h2>MAYA is the <span>AI layer.</span></h2>
            </div>
            <p className="about-section-intro">
              MAYA is shared across NETRA rather than being locked inside one model. It powers the main conversational assistant and appears inside model workflows wherever perception, retrieval, comparison, critique, or audit is useful. <strong>Its job is to improve the quality of a human decision—not to hide the decision behind an AI answer.</strong>
            </p>
          </div>

          <div className="maya-stage">
            <div className="maya-principle">
              <div>
                <small>The governing rule</small>
                <h3>AI interprets. Doctrine constrains. The human decides.</h3>
              </div>
              <p>
                MAYA works from the context already assembled inside NETRA. In a model such as Pinaka, the trader supplies live observations and the model supplies the legal state space. MAYA can recognise a state, retrieve supporting theory and similar historical paths, and challenge its own interpretation—but it cannot invent a new command or quietly move the trader outside the model&apos;s rules.
              </p>
            </div>

            <div className="maya-flow" aria-label="MAYA intelligence flow">
              <div><small>01 / Context</small><strong>Human observations + chart evidence</strong></div>
              <div className="maya-arrow" />
              <div><small>02 / Retrieval</small><strong>Doctrine + theory + historical paths</strong></div>
              <div className="maya-arrow" />
              <div><small>03 / Intelligence</small><strong>Recognise + reason + critique</strong></div>
              <div className="maya-arrow" />
              <div><small>04 / Control</small><strong>Legal route returned to the human</strong></div>
            </div>

            <div className="agent-workflow">
              <div className="agent-workflow-head">
                <div>
                  <small>Agentic decision workflow</small>
                  <strong>Research → specialists → proposal → critique</strong>
                </div>
                <p>
                  Command recognition and weapon selection use the same bounded graph. A researcher forms retrieval queries; theory and historian agents work in parallel; a suggestion agent proposes one legal result; an independent critique agent approves it or sends it back for revision.
                </p>
              </div>
              <div className="agent-pipeline" aria-label="MAYA agent pipeline">
                <div className="agent-node"><span>01 / Query</span><strong>Researcher agent</strong></div>
                <div className="agent-node agent-node-parallel"><span>02A / Theory</span><strong>Theory agent</strong></div>
                <div className="agent-node agent-node-parallel"><span>02B / History</span><strong>Historian agent</strong></div>
                <div className="agent-node"><span>03 / Decide</span><strong>Suggestion agent</strong></div>
                <div className="agent-node agent-node-critique"><span>04 / Verify</span><strong>Critique agent</strong></div>
                <div className="agent-node"><span>05 / Project</span><strong>Deterministic route</strong></div>
              </div>
            </div>

            <div className="maya-capabilities">
              {mayaCapabilities.map(([title, body], index) => (
                <article className="maya-capability" key={title}>
                  <span>0{index + 1}</span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="about-section">
          <div className="about-section-head">
            <div>
              <Eyebrow index="Section 04">Pinaka model</Eyebrow>
              <h2><span>Pinaka</span> makes discretion structured.</h2>
            </div>
            <p className="about-section-intro">
              Pinaka is the first model developed on NETRA. It addresses the gap between what a discretionary trader sees in a live market and what a system can actually classify, constrain, record, and evaluate.
            </p>
          </div>

          <div className="model-grid">
            <article className="model-card model-card-pinaka">
              <div>
                <div className="model-status"><span>04 / First operational model</span><b>Active</b></div>
                <h3>Pinaka</h3>
                <p>
                  Pinaka addresses a specific weakness in retail trading: discretionary traders see important real-time market behaviour, but that intelligence often remains informal, inconsistent, and impossible to audit. Pinaka turns the trader into an explicit part of the system. The human reads the live market and records its observable features; the model then classifies that evidence within a doctrine I designed from price-action, auction, structure, liquidity, and execution concepts.
                </p>
                <p>
                  The result is not an automated signal. It is a constrained human-in-the-loop process where market reading remains human, classification becomes structured, MAYA assists with interpretation, and the final decision remains attributable to the trader.
                </p>
              </div>
              <div className="pinaka-loop">
                <div><span>01</span><strong>Human observes the live market</strong></div>
                <div><span>02</span><strong>Features become structured context</strong></div>
                <div><span>03</span><strong>Doctrine constrains classification</strong></div>
                <div><span>04</span><strong>Execution and outcome close the path</strong></div>
              </div>
              <div className="pinaka-doctrine">
                <div><span>Feature group</span><strong>Pre-session context</strong></div>
                <div><span>Feature group</span><strong>Higher-timeframe structure</strong></div>
                <div><span>Feature group</span><strong>Auction and market pulse</strong></div>
                <div><span>Feature group</span><strong>Liquidity context</strong></div>
                <div><span>Doctrine output</span><strong>State, command, route, execution</strong></div>
              </div>
            </article>
          </div>
        </section>

        <section className="about-section">
          <div className="about-section-head">
            <div>
              <Eyebrow index="Section 05">Trishul model</Eyebrow>
              <h2>Developing <span className="trishul-orange">Trishul</span> to turn hypotheses into statistical evidence.</h2>
            </div>
            <p className="about-section-intro">
              Trishul will be NETRA&apos;s quantitative research engine. Where Pinaka structures qualitative market intelligence, Trishul will test whether a defined trading hypothesis is supported or rejected by historical evidence. Its purpose is not to defend an idea—it is to measure its edge.
            </p>
          </div>

          <div className="trishul-stage">
            <div className="trishul-thesis">
              <div>
                <small>Research philosophy</small>
                <h3>A disciplined engine for quantitative discovery and validation.</h3>
              </div>
              <p>
                Trishul will convert an observation into a mathematical definition, construct the relevant dataset and features, test the relationship statistically, compare predictive models, and validate the result through time-aware walk-forward testing. A hypothesis will advance only when the evidence remains reliable outside the data used to discover it.
              </p>
            </div>

            <div className="trishul-pipeline" aria-label="Trishul quantitative research pipeline">
              {[
                'Observation', 'Hypothesis', 'Definition', 'Dataset', 'Features',
                'Statistics', 'Machine learning', 'Walk-forward', 'Evidence', 'Accept / reject',
              ].map((step, index) => (
                <div key={step}><span>{String(index + 1).padStart(2, '0')}</span><strong>{step}</strong></div>
              ))}
            </div>

            <div className="trishul-output">
              <div className="trishul-question">
                <small>The question</small>
                <blockquote>Does historical evidence show that this hypothesis possesses a statistically significant edge?</blockquote>
              </div>
              <div className="trishul-evidence">
                <small>The answer must contain</small>
                <div className="trishul-evidence-grid">
                  <div><span>Outcome</span><strong>Probability of success</strong></div>
                  <div><span>Economics</span><strong>Expected value</strong></div>
                  <div><span>Reliability</span><strong>Calibration and confidence</strong></div>
                  <div><span>Validation</span><strong>Out-of-sample evidence</strong></div>
                </div>
              </div>
            </div>

            <div className="trishul-capabilities">
              {[
                ['Market state', 'Regime detection'],
                ['Trade events', 'Outcome probability modelling'],
                ['Price', 'Time-horizon forecasting'],
                ['Risk', 'Volatility forecasting'],
                ['Representation', 'Latent market behaviour'],
                ['Research', 'Alpha discovery'],
                ['Capital', 'Portfolio optimisation'],
                ['Execution', 'Order and trade-management optimisation'],
              ].map(([label, capability]) => (
                <div key={capability}><span>{label}</span><strong>{capability}</strong></div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
