import { useState } from 'react';
import { useNetra } from '../../context/NetraContext';
import GlobalOverlay from '../Layout/GlobalOverlay';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { API_BASE } from '../../utils/constants';

export default function Login() {
  const { sessionInput, setSessionInput, handleAuth, isLoggingIn } = useNetra();
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    const token = credentialResponse.credential;
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await response.json() as { access_token?: string; detail?: string };
      if (response.ok && data.access_token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
        );
        const payload = JSON.parse(jsonPayload) as { name?: string; email?: string };
        const userName = payload.name || payload.email || 'Operator';
        localStorage.setItem('netra_token', data.access_token);
        localStorage.setItem('netra_session', JSON.stringify({ userName, assetName: null, tradeName: null }));
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
      style={{ background: '#07090f', color: '#FFFFFF', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif' }}
      className="min-h-screen flex items-center justify-center overflow-hidden relative"
    >
      {/* Precise grid overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 80 0 L 0 0 0 80' fill='none' stroke='white' stroke-width='0.4' opacity='0.5'/%3E%3C/svg%3E")`,
          opacity: 0.025,
        }}
      />
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full bg-[#1E3A8A] opacity-[0.07] blur-[180px] pointer-events-none" />

      <div className="w-full max-w-[1060px] grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-center relative z-10 p-6 lg:p-12">

        {/* LEFT: BRANDING */}
        <div className="lg:col-span-7" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4em', color: '#374151' }}>System Online · v2.0</span>
            </div>
            <h1 style={{ fontSize: 'clamp(48px, 8vw, 88px)', fontWeight: 950, letterSpacing: '-0.045em', lineHeight: 0.86, textTransform: 'uppercase' }}>
              NETRA<br />
              <span style={{ color: '#3B82F6' }}>SYSTEM</span>
            </h1>
            <p style={{ fontSize: '13px', color: '#4B5563', maxWidth: '400px', lineHeight: 1.75, fontWeight: 500 }}>
              Neural-enhanced tactical execution platform. Multi-phase structural analysis, AI-driven conviction synthesis, and encrypted operational archives.
            </p>
          </div>

          {/* CAPABILITY GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.04)', maxWidth: '380px' }}>
            {([
              { label: 'Neural Synthesis', status: 'ACTIVE', color: '#10b981' },
              { label: 'Data Encryption', status: 'AES-256', color: '#3B82F6' },
              { label: 'Access Protocol', status: 'ENFORCED', color: '#3B82F6' },
              { label: 'Conviction Engine', status: 'READY', color: '#10b981' },
            ] as Array<{ label: string; status: string; color: string }>).map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.01)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#374151' }}>{s.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: s.color, boxShadow: `0 0 5px ${s.color}` }} />
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', fontWeight: 900, letterSpacing: '0.12em', color: s.color }}>{s.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: LOGIN CARD */}
        <div className="lg:col-span-5">
          <div style={{ background: '#0e1117', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '36px', boxShadow: '0 24px 64px -16px rgba(0,0,0,0.8)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.5), transparent)' }} />

            <div style={{ marginBottom: '28px' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.35em', color: '#374151', marginBottom: '8px' }}>Authenticated Access</div>
              <h2 style={{ fontSize: '22px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: '4px', color: '#FFFFFF' }}>Operator Signin</h2>
              <p style={{ fontSize: '11px', color: '#4B5563', fontWeight: 500 }}>Enter credentials or authenticate via verified SSO provider.</p>
            </div>

            <div className="space-y-5">
              {/* Username */}
              <div className="space-y-1.5">
                <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#374151', display: 'block' }}>Operator ID</label>
                <input
                  type="text"
                  value={sessionInput.userName}
                  onChange={e => setSessionInput({ ...sessionInput, userName: e.target.value })}
                  placeholder="Enter your ID"
                  className="w-full bg-[#07090f] border border-white/[0.06] rounded-lg py-3 px-4 text-sm font-medium text-white placeholder-gray-700 outline-none focus:border-[#3B82F6]/40 transition-colors"
                  autoFocus
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#374151', display: 'block' }}>Security Key</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={sessionInput.password}
                    onChange={e => setSessionInput({ ...sessionInput, password: e.target.value })}
                    onKeyDown={e => e.key === 'Enter' && handleAuth()}
                    placeholder="••••••••"
                    className="w-full bg-[#07090f] border border-white/[0.06] rounded-lg py-3 px-4 text-sm font-medium text-white placeholder-gray-700 outline-none focus:border-[#3B82F6]/40 transition-colors pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
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
                style={{ width: '100%', height: '46px', background: isLoggingIn ? 'rgba(37,99,235,0.6)' : '#2563EB', color: 'white', borderRadius: '8px', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', border: 'none', cursor: isLoggingIn ? 'not-allowed' : 'pointer', transition: 'background 150ms', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onMouseEnter={e => { if (!isLoggingIn) (e.currentTarget as HTMLElement).style.background = '#1D4ED8'; }}
                onMouseLeave={e => { if (!isLoggingIn) (e.currentTarget as HTMLElement).style.background = '#2563EB'; }}
              >
                {isLoggingIn ? (
                  <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />Authenticating</>
                ) : 'Authenticate'}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4 py-1">
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#1f2937' }}>SSO</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
              </div>

              {/* Google Login */}
              <div className="flex justify-center">
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '8px 16px', background: '#07090f', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', cursor: 'pointer', transition: 'border-color 150ms' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(59,130,246,0.25)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)'; }}
                >
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => { if (import.meta.env.DEV) console.error('Google SSO failed'); }}
                    useOneTap
                    theme="filled_black"
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
