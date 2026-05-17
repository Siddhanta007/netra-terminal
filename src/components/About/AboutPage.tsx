const RESEARCH_INTERESTS = [
  { label: 'Market Microstructure', color: '#4169E1' },
  { label: 'Systematic Strategy Development', color: '#7c3aed' },
  { label: 'ML for Financial Time Series', color: '#0d9488' },
  { label: 'Multi-Agent Decision Systems', color: '#d97706' },
  { label: 'Rules-Based Execution Frameworks', color: '#dc2626' },
];

const RESEARCH_APPROACH = [
  {
    n: '01',
    tag: 'The Problem',
    color: '#4169E1',
    bg: '#f8fafc',
    text: 'I kept making the same mistakes in market analysis — not because I lacked information, but because I had no structure forcing me to be honest about what I actually saw. The Pinaka Doctrine was the answer to that.',
  },
  {
    n: '02',
    tag: 'The Framework',
    color: '#7c3aed',
    bg: '#f5f3ff',
    text: 'Pinaka is a 10-phase checklist for trade selection — bias, structure, liquidity, command, weapon — each phase must clear before the next opens. Built from what I observed in markets over time, not from a textbook.',
  },
  {
    n: '03',
    tag: 'The AI Layer',
    color: '#0d9488',
    bg: '#f0fdfa',
    text: 'MAYA is a multi-agent pipeline — Researcher → Doctrine Gate → Suggestion → Critique — built with LangGraph and RAG over doctrine documents and historical trade logs. It cannot suggest what the doctrine forbids.',
  },
  {
    n: '04',
    tag: 'The Build',
    color: '#d97706',
    bg: '#fff7ed',
    text: 'Everything built solo: MongoDB schema, FastAPI backend, LangGraph agent graph, React terminal. Not to ship a product — to have a real system to validate the framework against actual market conditions.',
  },
];

const STACK = [
  {
    group: 'ML / AI',
    color: '#7c3aed',
    items: ['LangGraph', 'LangChain', 'RAG Pipeline', 'Multi-Agent LLM', 'VoyageAI Embeddings'],
  },
  {
    group: 'Systems',
    color: '#0d9488',
    items: ['Python', 'FastAPI', 'MongoDB Atlas', 'Docker', 'REST API'],
  },
  {
    group: 'Interface',
    color: '#4169E1',
    items: ['React 18', 'TypeScript', 'Redux Toolkit', 'Vite'],
  },
  {
    group: 'Observability',
    color: '#d97706',
    items: ['LangSmith Tracing', 'Structured Logging', 'JWT Auth'],
  },
];

export default function AboutPage() {
  return (
    <div style={{ background: '#ffffff', flex: 1, position: 'relative', overflowX: 'hidden' }}>

      {/* Top-right corner decoration */}
      <div style={{ position: 'fixed', top: 0, right: 0, width: 500, height: 500, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <svg width="500" height="500" viewBox="0 0 500 500" fill="none">
          {[60, 120, 185, 255, 325, 395, 460].map((r, i) => {
            const pts = Array.from({ length: 7 }, (_, k) => {
              const a = (-90 + k * (360 / 7)) * Math.PI / 180;
              return `${(500 + r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`;
            }).join(' ');
            const sw = [5, 3.5, 2.5, 2, 1.5, 1, 0.7][i];
            const so = [1, 0.7, 0.5, 0.35, 0.22, 0.14, 0.08][i];
            const fills = [`#4169E121`, `#4169E111`, `#4169E107`, 'none', 'none', 'none', 'none'];
            return <polygon key={r} points={pts} stroke="#4169E1" strokeWidth={sw} strokeOpacity={so} fill={fills[i]} strokeDasharray={i === 3 || i === 5 ? '10 7' : 'none'} />;
          })}
        </svg>
      </div>

      {/* Bottom-left corner decoration */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, width: 400, height: 400, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <svg width="400" height="400" viewBox="0 0 400 400" fill="none">
          {[50, 100, 155, 215, 275, 335, 390].map((r, i) => {
            const pts = Array.from({ length: 7 }, (_, k) => {
              const a = (90 + k * (360 / 7)) * Math.PI / 180;
              return `${(r * Math.cos(a)).toFixed(1)},${(400 + r * Math.sin(a)).toFixed(1)}`;
            }).join(' ');
            const sw = [4, 2.5, 2, 1.5, 1, 0.7, 0.5][i];
            const so = [0.8, 0.55, 0.38, 0.25, 0.15, 0.09, 0.05][i];
            return <polygon key={r} points={pts} stroke="#4169E1" strokeWidth={sw} strokeOpacity={so} fill="none" />;
          })}
        </svg>
      </div>

      <div style={{ maxWidth: '1100px', width: '100%', margin: '0 auto', padding: '64px 48px 100px', position: 'relative', zIndex: 1 }}>

        {/* ── HERO ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', background: 'rgba(15,23,42,0.06)', marginBottom: '2px' }}>

          {/* Left — who I am */}
          <div style={{ background: '#f8fafc', padding: '64px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.35em', color: '#4169E1', marginBottom: '24px' }}>
                Researcher
              </div>
              <div style={{ fontSize: '72px', fontWeight: 950, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 0.9, marginBottom: '24px' }}>
                Sri<br />Krishna
              </div>
              <div style={{ height: '3px', background: '#4169E1', width: '48px', marginBottom: '32px' }} />
              <p style={{ fontSize: '15px', fontWeight: 500, color: '#475569', lineHeight: 1.8, margin: '0 0 20px 0', maxWidth: '420px' }}>
                I spent a long time studying markets — not from courses, but by watching them. I built the Pinaka Doctrine to make my own thinking about trade selection explicit and testable. Then I built NETRA to run it.
              </p>
              <p style={{ fontSize: '14px', fontWeight: 500, color: '#64748b', lineHeight: 1.8, margin: 0, maxWidth: '420px' }}>
                I want to work in quant ML — building systematic models for financial markets. I don't have the pedigree. I have the work.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '48px', flexWrap: 'wrap' }}>
              <a
                href="https://github.com/Siddhanta007"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '36px', padding: '0 18px', background: '#0f172a', color: '#ffffff', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', textDecoration: 'none', transition: 'opacity 150ms' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.8'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
                GitHub
              </a>
              <a
                href="mailto:www.srikrishna111@gmail.com"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '36px', padding: '0 18px', background: '#4169E1', color: '#ffffff', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', textDecoration: 'none', transition: 'opacity 150ms' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                Contact
              </a>
            </div>
          </div>

          {/* Right — the intellectual problem */}
          <div style={{ background: '#0f172a', padding: '64px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.35em', color: 'rgba(65,105,225,0.7)', marginBottom: '24px' }}>
                The Research Problem
              </div>
              <div style={{ fontSize: '40px', fontWeight: 950, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '24px' }}>
                Built to make my own thinking about markets explicit — and to stop overriding it.
              </div>
              <div style={{ height: '3px', background: '#4169E1', width: '48px', marginBottom: '32px' }} />
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.6)', lineHeight: 1.85, margin: 0 }}>
                The Pinaka Doctrine is a structured checklist for trade selection — built from what I observed actually working in markets. NETRA enforces it through a 10-phase pipeline so the analysis cannot be skipped or rationalized away.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '48px' }}>
              {[
                { n: '10', label: 'Gating Layers' },
                { n: '5', label: 'LangGraph Agents' },
                { n: '3', label: 'RAG Collections' },
                { n: '1', label: 'Doctrine. Zero exceptions.' },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: '40px', fontWeight: 950, color: '#4169E1', fontFamily: 'monospace', letterSpacing: '-0.04em', lineHeight: 1 }}>{s.n}</div>
                  <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.35)', marginTop: '6px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RESEARCH INTERESTS ── */}
        <div style={{ display: 'flex', gap: '2px', background: 'rgba(15,23,42,0.06)', marginBottom: '72px' }}>
          {RESEARCH_INTERESTS.map(r => (
            <div key={r.label} style={{ flex: 1, background: '#ffffff', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ width: '24px', height: '3px', background: r.color }} />
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>{r.label}</span>
            </div>
          ))}
        </div>

        {/* ── RESEARCH APPROACH ── */}
        <div style={{ marginBottom: '72px' }}>
          <div style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.35em', color: '#4169E1', marginBottom: '32px' }}>Research Approach</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2px', background: 'rgba(15,23,42,0.06)' }}>
            {RESEARCH_APPROACH.map(item => (
              <div key={item.n} style={{ background: item.bg, padding: '40px 44px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '9px', fontWeight: 900, fontFamily: 'monospace', color: item.color, letterSpacing: '0.1em' }}>{item.n}</span>
                  <div style={{ width: '1px', height: '12px', background: item.color, opacity: 0.4 }} />
                  <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: item.color }}>{item.tag}</span>
                </div>
                <p style={{ fontSize: '14px', fontWeight: 500, color: '#334155', lineHeight: 1.8, margin: 0 }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── TECH STACK ── */}
        <div style={{ marginBottom: '72px' }}>
          <div style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.35em', color: '#4169E1', marginBottom: '32px' }}>Build Stack</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2px', background: 'rgba(15,23,42,0.06)' }}>
            {STACK.map(s => (
              <div key={s.group} style={{ background: '#ffffff', padding: '32px 32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                  <div style={{ width: '8px', height: '8px', background: s.color }} />
                  <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', color: s.color }}>{s.group}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {s.items.map(item => (
                    <div key={item} style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: s.color, fontSize: '10px' }}>›</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── DOCTRINE QUOTE ── */}
        <div style={{ background: '#0f172a', padding: '64px 72px', position: 'relative', overflow: 'hidden', marginBottom: '72px' }}>
          <div style={{ fontSize: '200px', fontWeight: 950, color: '#4169E1', opacity: 0.05, position: 'absolute', right: '-10px', bottom: '-50px', lineHeight: 1, fontFamily: 'monospace', userSelect: 'none' }}>"</div>
          <div style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.35em', color: '#4169E1', marginBottom: '24px' }}>Pinaka Doctrine · Core Axiom</div>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#ffffff', lineHeight: 1.5, margin: '0 0 32px 0', letterSpacing: '-0.02em', maxWidth: '760px', position: 'relative', zIndex: 1 }}>
            "The market does not reward the analyst who knows the most. It rewards the one who has the clearest rules for acting correctly under uncertainty — and the discipline to follow them when it matters."
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ height: '2px', background: '#4169E1', width: '48px' }} />
            <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.3)' }}>Pinaka Doctrine · Sri Krishna</span>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div style={{ borderTop: '1px solid rgba(65,105,225,0.15)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#4169E1' }}>Sri Krishna · Quant ML Research · 2025</span>
          <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(15,23,42,0.3)', fontFamily: 'monospace' }}>NETRA v2.0</span>
        </div>

      </div>
    </div>
  );
}
