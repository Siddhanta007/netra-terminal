// The "processing" animation shown in the left pane while an agent runs:
// a colour-morphing waveform plus an elapsed-seconds counter.

import { useState, useEffect, useRef } from 'react';
import { MONO } from './helpers';

function MorphingLine() {
  const svgRef  = useRef<SVGSVGElement>(null);
  const raf     = useRef(0);
  const t       = useRef(0);

  useEffect(() => {
    const N = 60, W = 600, H = 44, mid = H / 2, PERIOD = 110;
    const SHAPES: Array<(p: number) => number> = [
      ()  => 0,
      (p) => -Math.sin(p * Math.PI) * 16,
      (p) => -Math.sin(p * Math.PI * 2) * 14,
      (p) =>  Math.sin(p * Math.PI * 3) * 11,
      (p) => -Math.sin(p * Math.PI * 4) * 9,
    ];
    const COLORS: [number, number, number][] = [
      [255, 255, 255],
      [96,  165, 250],
      [0,   229, 160],
      [167, 139, 250],
      [255, 255, 255],
    ];
    const ease = (x: number) => x < 0.5 ? 2 * x * x : -1 + (4 - 2 * x) * x;
    const lerp = (a: number, b: number, x: number) => a + (b - a) * x;

    const tick = () => {
      t.current++;
      const totalPhase = t.current / PERIOD;
      const shapeIdx   = Math.floor(totalPhase) % SHAPES.length;
      const nextIdx    = (shapeIdx + 1) % SHAPES.length;
      const progress   = ease(totalPhase % 1);
      const cA = COLORS[shapeIdx % COLORS.length];
      const cB = COLORS[nextIdx  % COLORS.length];
      const r  = Math.round(lerp(cA[0], cB[0], progress));
      const g  = Math.round(lerp(cA[1], cB[1], progress));
      const b  = Math.round(lerp(cA[2], cB[2], progress));
      const color = `rgb(${r},${g},${b})`;
      const pts = Array.from({ length: N }, (_, i) => {
        const p  = i / (N - 1);
        const x  = p * W;
        const yA = SHAPES[shapeIdx](p);
        const yB = SHAPES[nextIdx](p);
        const y  = mid + lerp(yA, yB, progress);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
      }).join(' ');
      if (svgRef.current) {
        const [glow, line] = svgRef.current.querySelectorAll('path');
        if (glow && line) {
          glow.setAttribute('d', pts);
          glow.setAttribute('stroke', color);
          line.setAttribute('d', pts);
          line.setAttribute('stroke', color);
        }
        // Update drop-shadow color dynamically
        svgRef.current.style.filter = `drop-shadow(0 0 8px rgba(${r},${g},${b},0.9)) drop-shadow(0 0 18px rgba(${r},${g},${b},0.5))`;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  return (
    <svg ref={svgRef} width="100%" height="44" viewBox="0 0 600 44" preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
      {/* Wide blurred path for the outer glow */}
      <path fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.25" style={{ filter: 'blur(4px)' }} />
      {/* Sharp main line */}
      <path fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.95" />
    </svg>
  );
}

export function TerminalScroller() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed(e => +(e + 0.1).toFixed(1)), 100);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px', padding: '0 32px' }}>
      <MorphingLine />
      <div style={{ textAlign: 'center' }}>
        <div style={{ ...MONO, fontSize: '24px', fontWeight: 300, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.05em', lineHeight: 1 }}>
          {elapsed.toFixed(1)}<span style={{ fontSize: '12px', marginLeft: '2px', color: 'rgba(255,255,255,0.2)' }}>s</span>
        </div>
        <div style={{ ...MONO, fontSize: '8px', color: 'rgba(255,255,255,0.18)', letterSpacing: '0.25em', textTransform: 'uppercase', marginTop: '6px' }}>
          Processing
        </div>
      </div>
    </div>
  );
}
