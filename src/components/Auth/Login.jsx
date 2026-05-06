import { useNetra } from '../../context/NetraContext';
import GlobalOverlay from '../Layout/GlobalOverlay';

export default function Login() {
  const { sessionInput, setSessionInput, handleAuth, isLoggingIn } = useNetra();

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text-1)' }}
      className="min-h-screen flex items-center justify-center overflow-hidden font-sans relative px-6 lg:px-0">

      {/* Background Watermark */}
      <div className="absolute bottom-6 right-8 font-black text-[6rem] lg:text-[10rem] opacity-[0.03] select-none pointer-events-none uppercase tracking-tighter z-0">
        NETRA
      </div>

      {/* Ambient accents */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none select-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600 blur-[120px]"></div>
      </div>

      <div className="w-full max-w-[420px] animate-in fade-in zoom-in-95 duration-700 relative z-10">
        <div className="mb-8 lg:mb-12 text-center">
          <h2 className="text-4xl lg:text-5xl font-black tracking-tight mb-2 uppercase">NETRA</h2>
          <p className="text-xs lg:text-sm opacity-60 font-medium">
            Verification required to access institutional protocols.
          </p>
        </div>

        <div className="space-y-6">
          <div className="group">
            <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block opacity-40 group-focus-within:opacity-100 transition-opacity">
              Analyst Identifier
            </label>
            <input
              type="text"
              value={sessionInput.userName}
              onChange={e => setSessionInput({ ...sessionInput, userName: e.target.value })}
              placeholder="ENTER ID..."
              className="field field-lg w-full py-4 text-sm font-semibold tracking-wide"
              autoFocus
            />
          </div>
          <div className="group">
            <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block opacity-40 group-focus-within:opacity-100 transition-opacity">
              Access Key
            </label>
            <input
              type="password"
              value={sessionInput.password}
              onChange={e => setSessionInput({ ...sessionInput, password: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handleAuth()}
              placeholder="••••••••"
              className="field field-lg w-full py-4 text-sm font-bold tracking-widest"
            />
          </div>
          <button
            onClick={handleAuth}
            disabled={isLoggingIn}
            className="btn-confirm w-full py-5 text-sm tracking-wide uppercase font-bold shadow-xl shadow-blue-500/10 flex items-center justify-center gap-3"
          >
            {isLoggingIn ? (
              <><div className="spinner"></div>Verifying...</>
            ) : (
              'Verify & Unlock Access'
            )}
          </button>
        </div>
      </div>
      <GlobalOverlay />
    </div>
  );
}
