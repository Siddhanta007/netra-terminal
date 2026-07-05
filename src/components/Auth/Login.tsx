// Login screen — Google OAuth sign-in and credentials entry.

import { useState } from 'react';
import { useNetra } from '../../context/NetraContext';
import GlobalOverlay from '../Layout/GlobalOverlay';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { API_BASE } from '../../utils/constants';

const PAGE_BG = '#edf0f6';
const CARD_BG = '#ffffff';
const CARD_BORDER = 'rgba(65,105,225,0.12)';
const CARD_DIVIDER = 'rgba(15,23,42,0.07)';
const BLUE = '#4169E1';

const DIAMOND_SHAPES = [
  { cx: 608, cy: 28,  r: 50, c: '#4169E1' }, { cx: 544, cy: 8,   r: 33, c: '#f59e0b' },
  { cx: 488, cy: 52,  r: 44, c: '#8b5cf6' }, { cx: 618, cy: 108, r: 38, c: '#10b981' },
  { cx: 412, cy: 18,  r: 26, c: '#6366f1' }, { cx: 558, cy: 125, r: 46, c: '#4169E1' },
  { cx: 338, cy: 42,  r: 22, c: '#ef4444' }, { cx: 470, cy: 142, r: 30, c: '#0ea5e9' },
  { cx: 615, cy: 188, r: 35, c: '#f59e0b' }, { cx: 280, cy: 75,  r: 20, c: '#8b5cf6' },
  { cx: 390, cy: 112, r: 38, c: '#4169E1' }, { cx: 515, cy: 205, r: 24, c: '#10b981' },
  { cx: 225, cy: 50,  r: 18, c: '#6366f1' }, { cx: 450, cy: 228, r: 42, c: '#f59e0b' },
  { cx: 612, cy: 262, r: 28, c: '#0ea5e9' }, { cx: 335, cy: 182, r: 18, c: '#4169E1' },
  { cx: 565, cy: 302, r: 22, c: '#ef4444' }, { cx: 265, cy: 162, r: 32, c: '#8b5cf6' },
  { cx: 485, cy: 298, r: 20, c: '#10b981' }, { cx: 395, cy: 272, r: 36, c: '#6366f1' },
];
const DIAMOND_BL = [
  { cx: 22,  cy: 545, r: 50, c: '#4169E1' }, { cx: 95,  cy: 560, r: 33, c: '#10b981' },
  { cx: 162, cy: 528, r: 44, c: '#f59e0b' }, { cx: 15,  cy: 478, r: 38, c: '#8b5cf6' },
  { cx: 248, cy: 552, r: 26, c: '#4169E1' }, { cx: 108, cy: 472, r: 46, c: '#0ea5e9' },
  { cx: 325, cy: 530, r: 22, c: '#ef4444' }, { cx: 195, cy: 462, r: 30, c: '#f59e0b' },
  { cx: 20,  cy: 402, r: 35, c: '#4169E1' }, { cx: 388, cy: 518, r: 20, c: '#8b5cf6' },
  { cx: 132, cy: 388, r: 38, c: '#6366f1' }, { cx: 280, cy: 445, r: 24, c: '#10b981' },
  { cx: 62,  cy: 322, r: 18, c: '#0ea5e9' }, { cx: 218, cy: 355, r: 42, c: '#4169E1' },
  { cx: 25,  cy: 248, r: 28, c: '#ef4444' }, { cx: 358, cy: 422, r: 18, c: '#f59e0b' },
  { cx: 155, cy: 282, r: 22, c: '#8b5cf6' }, { cx: 328, cy: 335, r: 32, c: '#6366f1' },
  { cx: 92,  cy: 222, r: 20, c: '#4169E1' }, { cx: 252, cy: 272, r: 36, c: '#0ea5e9' },
];

function PageCorners() {
  return (
    <>
      <div style={{ position: 'fixed', top: 0, right: 0, width: 620, height: 620, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <svg width="620" height="620" viewBox="0 0 620 620" fill="none">
          {DIAMOND_SHAPES.map((s, i) => (
            <polygon key={i}
              points={`${s.cx},${s.cy - s.r} ${s.cx + s.r},${s.cy} ${s.cx},${s.cy + s.r} ${s.cx - s.r},${s.cy}`}
              fill="none" stroke={s.c} strokeWidth="5.5" strokeOpacity="0.45" />
          ))}
        </svg>
      </div>
      <div style={{ position: 'fixed', bottom: 0, left: 0, width: 560, height: 560, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <svg width="560" height="560" viewBox="0 0 560 560" fill="none">
          {DIAMOND_BL.map((s, i) => (
            <polygon key={i}
              points={`${s.cx},${s.cy - s.r} ${s.cx + s.r},${s.cy} ${s.cx},${s.cy + s.r} ${s.cx - s.r},${s.cy}`}
              fill="none" stroke={s.c} strokeWidth="5.5" strokeOpacity="0.45" />
          ))}
        </svg>
      </div>
    </>
  );
}

export default function Login() {
  const { sessionInput, setSessionInput, handleAuth, isLoggingIn } = useNetra();
  const [showPassword, setShowPassword] = useState(false);

  const handleTryDemo = async () => {
    // 1. Visibly populate the inputs
    setSessionInput({ ...sessionInput, userName: 'demo', password: 'demopassword' });
    
    // 2. Perform authentication immediately using these values
    try {
      const response = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'demo', password: 'demopassword' }),
      });
      const data = await response.json() as {
        user: string;
        role: string;
        allowed_models: string[];
        allowed_pages: string[];
        access_token: string;
        detail?: string;
      };
      if (response.ok && data.access_token) {
        const sessObj = {
          userName: data.user,
          assetName: null,
          tradeName: null,
          role: data.role,
          allowedModels: data.allowed_models,
          allowedPages: data.allowed_pages,
        };
        localStorage.setItem('netra_token', data.access_token);
        localStorage.setItem('netra_session', JSON.stringify(sessObj));
        window.location.href = '/home';
      } else {
        alert(data.detail || 'Demo login failed');
      }
    } catch (e) {
      alert('Network error during demo login');
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    const token = credentialResponse.credential;
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await response.json() as {
        access_token?: string;
        user?: string;
        role?: string;
        allowed_models?: string[];
        allowed_pages?: string[];
        detail?: string;
      };
      if (response.ok && data.access_token) {
        localStorage.setItem('netra_token', data.access_token);
        localStorage.setItem('netra_session', JSON.stringify({
          userName: data.user || 'Operator',
          assetName: null,
          tradeName: null,
          role: data.role || 'operator',
          allowedModels: data.allowed_models || [],
          allowedPages: data.allowed_pages || []
        }));
        window.location.reload();
      } else {
        alert(data.detail || 'Login Failed');
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Google login error:', error);
    }
  };

  return (
    <div
      style={{ background: PAGE_BG, color: '#0f172a', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}
    >
      <PageCorners />

      <div className="w-full max-w-[1060px] grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-center relative z-10 p-6 lg:p-12">

        {/* LEFT: BRANDING */}
        <div className="lg:col-span-7" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4em', color: 'rgba(15,23,42,0.45)' }}>System Online · v3.0</span>
            </div>
            <h1 style={{ fontSize: 'clamp(48px, 8vw, 88px)', fontWeight: 950, letterSpacing: '-0.045em', lineHeight: 0.86, textTransform: 'uppercase', color: '#0f172a' }}>
              NETRA<br />
              <span style={{ color: BLUE }}>SYSTEM</span>
            </h1>
            <p style={{ fontSize: '13px', color: '#475569', maxWidth: '450px', lineHeight: 1.75, fontWeight: 500 }}>
              Neural-enhanced tactical execution platform. Multi-phase structural analysis, AI-driven conviction synthesis, and encrypted operational archives.
            </p>
          </div>

          {/* ARCHITECTURAL STACK */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8.5px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', color: BLUE }}>Architecture & Engine Spec</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {[
                'React / TS', 'Redux Toolkit', 'FastAPI (Python)', 'Postgres (Auth / RBAC)', 
                'MongoDB (Trade Logs)', 'Neo4j Graph Database', 'Voyage AI Embeddings', 'GraphRAG Context'
              ].map(tech => (
                <span key={tech} style={{ fontSize: '10px', fontWeight: 700, color: '#475569', background: '#ffffff', border: `1px solid ${CARD_BORDER}`, padding: '4px 10px', borderRadius: '4px' }}>
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* CAPABILITY GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1px', background: CARD_BORDER, borderRadius: '10px', overflow: 'hidden', border: `1px solid ${CARD_BORDER}`, maxWidth: '380px' }}>
            {([
              { label: 'Neural Synthesis', status: 'ACTIVE', color: '#10b981' },
              { label: 'Data Encryption', status: 'AES-256', color: BLUE },
              { label: 'Access Protocol', status: 'ENFORCED', color: BLUE },
              { label: 'Conviction Engine', status: 'READY', color: '#10b981' },
            ] as Array<{ label: string; status: string; color: string }>).map(s => (
              <div key={s.label} style={{ background: '#ffffff', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(15,23,42,0.45)' }}>{s.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: s.color }} />
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8.5px', fontWeight: 900, letterSpacing: '0.12em', color: s.color }}>{s.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: LOGIN CARD */}
        <div className="lg:col-span-5">
          <div style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: '14px', padding: '36px', boxShadow: '0 24px 64px -16px rgba(65,105,225,0.08)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ height: '3px', background: BLUE, position: 'absolute', top: 0, left: 0, right: 0 }} />

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.35em', color: BLUE, marginBottom: '8px' }}>Authenticated Access</div>
              <h2 style={{ fontSize: '22px', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: '4px', color: '#0f172a' }}>Operator Signin</h2>
              <p style={{ fontSize: '11px', color: 'rgba(15,23,42,0.5)', fontWeight: 600 }}>Enter credentials or authenticate via verified SSO provider.</p>
            </div>

            {/* RECRUITER ALERT BANNER */}
            <div style={{ background: 'rgba(65,105,225,0.06)', border: `1px solid ${CARD_BORDER}`, borderRadius: '8px', padding: '12px 14px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: BLUE }} />
                <span style={{ fontSize: '8.5px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: BLUE, fontFamily: 'JetBrains Mono, monospace' }}>Reviewer Info</span>
              </div>
              <p style={{ fontSize: '10.5px', color: '#475569', lineHeight: 1.55, margin: 0, fontWeight: 550 }}>
                To bypass login and explore the platform's multi-phase logging, GraphRAG engine, and risk controls, click the <strong>Try Demo Mode</strong> button below.
              </p>
            </div>

            <div className="space-y-5">
              {/* Username */}
              <div className="space-y-1.5">
                <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(15,23,42,0.45)', display: 'block' }}>Operator ID</label>
                <input
                  type="text"
                  value={sessionInput.userName}
                  onChange={e => setSessionInput({ ...sessionInput, userName: e.target.value })}
                  placeholder="Enter your ID"
                  style={{ background: PAGE_BG, border: `1px solid ${CARD_BORDER}`, color: '#0f172a', outline: 'none' }}
                  className="w-full rounded-lg py-3 px-4 text-sm font-semibold placeholder-slate-400 focus:border-[#4169E1] transition-colors"
                  autoFocus
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(15,23,42,0.45)', display: 'block' }}>Security Key</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={sessionInput.password}
                    onChange={e => setSessionInput({ ...sessionInput, password: e.target.value })}
                    onKeyDown={e => e.key === 'Enter' && handleAuth()}
                    placeholder="••••••••"
                    style={{ background: PAGE_BG, border: `1px solid ${CARD_BORDER}`, color: '#0f172a', outline: 'none' }}
                    className="w-full rounded-lg py-3 px-4 text-sm font-semibold placeholder-slate-400 focus:border-[#4169E1] transition-colors pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A10.07 10.07 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <button
                onClick={handleAuth}
                disabled={isLoggingIn}
                style={{ width: '100%', height: '46px', background: isLoggingIn ? 'rgba(65,105,225,0.6)' : BLUE, color: 'white', borderRadius: '8px', fontWeight: 800, fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.12em', border: 'none', cursor: isLoggingIn ? 'not-allowed' : 'pointer', transition: 'background 150ms', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onMouseEnter={e => { if (!isLoggingIn) (e.currentTarget as HTMLElement).style.background = '#1D4ED8'; }}
                onMouseLeave={e => { if (!isLoggingIn) (e.currentTarget as HTMLElement).style.background = BLUE; }}
              >
                {isLoggingIn ? (
                  <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />Authenticating</>
                ) : 'Authenticate'}
              </button>

              {/* Try Demo Mode Button */}
              <button
                onClick={handleTryDemo}
                disabled={isLoggingIn}
                style={{ width: '100%', height: '46px', background: 'transparent', color: BLUE, border: `1.5px solid ${BLUE}`, borderRadius: '8px', fontWeight: 800, fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.12em', cursor: isLoggingIn ? 'not-allowed' : 'pointer', transition: 'background 150ms', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onMouseEnter={e => { if (!isLoggingIn) (e.currentTarget as HTMLElement).style.background = 'rgba(65,105,225,0.06)'; }}
                onMouseLeave={e => { if (!isLoggingIn) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                Try Demo Mode
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4 py-1">
                <div style={{ flex: 1, height: '1px', background: CARD_DIVIDER }} />
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'rgba(15,23,42,0.25)' }}>SSO</span>
                <div style={{ flex: 1, height: '1px', background: CARD_DIVIDER }} />
              </div>

              {/* Google Login */}
              <div className="flex justify-center">
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '8px 16px', background: PAGE_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: '8px', cursor: 'pointer', transition: 'border-color 150ms' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(65,105,225,0.25)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = CARD_BORDER; }}
                >
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => { if (import.meta.env.DEV) console.error('Google SSO failed'); }}
                    useOneTap
                    theme="outline"
                    shape="pill"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <GlobalOverlay />
    </div>
  );
}
