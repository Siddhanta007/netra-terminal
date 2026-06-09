// Site footer.

export default function Footer({ accentColor = '#4169E1' }: { accentColor?: string }) {
  const year = new Date().getFullYear();
  return (
    <footer style={{ width: '100%', background: '#ffffff', borderTop: `2px solid ${accentColor}`, marginTop: '48px', position: 'relative', zIndex: 1 }}>
      <div style={{ padding: '0 48px', height: '88px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '4px', height: '4px', background: accentColor }} />
          <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', color: accentColor, fontFamily: 'JetBrains Mono, monospace' }}>NETRA</span>
          <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(15,23,42,0.45)', fontFamily: 'JetBrains Mono, monospace' }}>v3.0</span>
          <div style={{ width: '1px', height: '12px', background: 'rgba(15,23,42,0.15)' }} />
          <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(15,23,42,0.55)', letterSpacing: '0.04em', fontFamily: 'JetBrains Mono, monospace' }}>Neural Execution & Tactical Reasoning Architecture</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a
            href="https://www.tradingview.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: accentColor, fontFamily: 'JetBrains Mono, monospace', textDecoration: 'none', borderBottom: `1px solid ${accentColor}`, paddingBottom: '1px' }}
          >
            TradingView ↗
          </a>
          <div style={{ width: '1px', height: '12px', background: 'rgba(15,23,42,0.15)' }} />
          <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(15,23,42,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>© {year} NETRA</span>
        </div>

      </div>
    </footer>
  );
}
