import { useNetra } from '../../context/NetraContext';
import GlobalOverlay from '../Layout/GlobalOverlay';
import { GoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { API_BASE } from '../../utils/constants';

export default function Login() {
  const { sessionInput, setSessionInput, handleAuth, isLoggingIn } = useNetra();
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleSuccess = async (credentialResponse) => {
    const token = credentialResponse.credential;
    try {
      const response = await fetch(`${API_BASE}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token })
      });

      const data = await response.json();

      if (response.ok) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(jsonPayload);
        const userName = payload.name || payload.email || 'Operator';

        localStorage.setItem('netra_token', data.access_token);
        localStorage.setItem('netra_session', JSON.stringify({ userName: userName, assetName: null, tradeName: null }));
        window.location.reload();
      } else {
        alert(data.detail || 'Login Failed');
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <div style={{ background: '#090B10', color: '#FFFFFF', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif' }}
      className="min-h-screen flex items-center justify-center overflow-hidden relative">

      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='white' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundPosition: 'center'
        }}>
      </div>

      {/* Professional Soft Glow */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#1E3A8A] opacity-[0.1] blur-[150px] pointer-events-none"></div>

      <div className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center relative z-10 p-6 lg:p-12">
        
        {/* LEFT COLUMN: BRANDING & INFO */}
        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.4em] text-[#3B82F6]">Proprietary Interface</div>
            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter uppercase leading-none" style={{ letterSpacing: '-0.04em' }}>
              NETRA<br />SYSTEM
            </h1>
            <p className="text-sm lg:text-base text-gray-500 max-w-lg leading-relaxed font-medium">
              The definitive master gateway for AI-driven execution and operational archives. 
              Netra combines advanced neural synthesis with institutional-grade data security 
              to deliver high-conviction trading protocols.
            </p>
          </div>

          {/* System Status Indicators (Quant Vibe) */}
          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/[0.03] max-w-md">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">Neural Synthesis</div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-bold text-gray-400">ACTIVE</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">Access Protocol</div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                <span className="text-xs font-bold text-gray-400">ENFORCED</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* RIGHT COLUMN: LOGIN CARD */}
        <div className="lg:col-span-5">
          <div className="bg-[#111622] border border-white/[0.03] rounded-xl p-8 lg:p-10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7)] relative overflow-hidden">
            
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#3B82F6] to-transparent opacity-50"></div>
            
            <div className="mb-6">
              <h2 className="text-xl font-black uppercase tracking-tight mb-1">Operator Sign In</h2>
              <p className="text-xs text-gray-500 font-medium">Enter credentials or use verified SSO.</p>
            </div>

            <div className="space-y-5">
              
              {/* Username Field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Operator ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={sessionInput.userName}
                    onChange={e => setSessionInput({ ...sessionInput, userName: e.target.value })}
                    placeholder="Enter your ID"
                    className="w-full bg-[#090B10] border border-white/[0.05] rounded-lg py-3 px-4 text-sm font-medium text-white placeholder-gray-700 outline-none focus:border-[#3B82F6]/50 transition-colors"
                    autoFocus
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Security Key
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={sessionInput.password}
                    onChange={e => setSessionInput({ ...sessionInput, password: e.target.value })}
                    onKeyDown={e => e.key === 'Enter' && handleAuth()}
                    placeholder="••••••••"
                    className="w-full bg-[#090B10] border border-white/[0.05] rounded-lg py-3 px-4 text-sm font-medium text-white placeholder-gray-700 outline-none focus:border-[#3B82F6]/50 transition-colors pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A10.07 10.07 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleAuth}
                disabled={isLoggingIn}
                className="w-full h-12 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
              >
                {isLoggingIn ? (
                  <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>Processing</>
                ) : (
                  'Sign In'
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4 py-1">
                <div className="h-[1px] bg-white/[0.05] flex-1"></div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-600">Secure SSO</span>
                <div className="h-[1px] bg-white/[0.05] flex-1"></div>
              </div>

              {/* Google Login Container */}
              <div className="flex justify-center">
                <div className="w-full flex justify-center py-2 px-4 bg-[#090B10] border border-white/[0.03] rounded-lg hover:bg-[#111622] transition-colors cursor-pointer">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => console.log('Login Failed')}
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
