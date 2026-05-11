import { useNetra } from '../../context/NetraContext';

export default function ProfilePage() {
  const { session, tradeLogs, darkMode } = useNetra();

  const totalMissions = tradeLogs ? tradeLogs.length : 0;
  const wins = tradeLogs ? tradeLogs.filter(log => log.phase4?.outcome === 'WIN').length : 0;
  const winRate = totalMissions > 0 ? ((wins / totalMissions) * 100).toFixed(1) : '0.0';

  return (
    <div className="flex-1 flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-700 p-8 relative overflow-hidden">

      {/* Dynamic Grid Background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10 dark:opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='currentColor' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundPosition: 'center',
          color: darkMode ? '#fff' : '#4169E1',
        }}
      />

      <div className="absolute top-[-100px] right-[-100px] w-80 h-80 bg-[#4169E1]/20 dark:bg-[#4169E1]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-100px] left-[-100px] w-80 h-80 bg-[#6366F1]/20 dark:bg-[#6366F1]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10">
        <div className="text-[9px] font-black uppercase tracking-[0.4em] text-[#4169E1] mb-2">Neural Identity Matrix</div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4169E1] to-[#6366F1] flex items-center justify-center text-white text-2xl font-black shadow-[0_8px_24px_rgba(65,105,225,0.3)]">
            {(session?.userName || 'O')[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-[36px] font-black tracking-tight text-[var(--text-1)] dark:text-white uppercase leading-none">
              {session?.userName || 'Operator'}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--accent)] dark:text-white/40">
                Clearance: Standard Operator
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch relative z-10">

        {/* Left: Stats */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 backdrop-blur-md flex flex-col gap-2 relative overflow-hidden group hover:border-[#4169E1]/50 transition-all duration-300 shadow-sm">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#4169E1]" />
            <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Total Missions Executed</span>
            <div className="text-4xl font-black tabular-nums tracking-tighter">{totalMissions}</div>
            <div className="text-[9px] font-bold uppercase text-[#4169E1] mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Telemetry Synced</div>
          </div>

          <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 backdrop-blur-md flex flex-col gap-2 relative overflow-hidden group hover:border-emerald-500/50 transition-all duration-300 shadow-sm">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Quantum Win Rate</span>
            <div className="text-4xl font-black text-emerald-500 tabular-nums tracking-tighter">{winRate}%</div>
            <div className="text-[9px] font-bold uppercase text-emerald-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Edge Verified</div>
          </div>

          <div className="p-6 rounded-2xl border border-[var(--border)] bg-black/[0.02] dark:bg-white/[0.02] flex flex-col gap-4">
            <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Neural Node Status</span>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">MAYA Engine</span>
                <span className="text-[10px] font-bold uppercase text-emerald-500">Online</span>
              </div>
              <div className="h-1 w-full bg-[var(--border)] rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[100%] animate-pulse" />
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">RAG Library</span>
                <span className="text-[10px] font-bold uppercase text-emerald-500">Synced</span>
              </div>
              <div className="h-1 w-full bg-[var(--border)] rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[94%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Details */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="p-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 backdrop-blur-md h-full flex flex-col">

            <div className="flex justify-between items-center mb-6 pb-2 border-b border-[var(--border)]">
              <h3 className="text-xs font-black uppercase tracking-widest">Tactical Parameters</h3>
              <span className="text-[9px] font-mono opacity-40">LOC: 0x7FF8D9</span>
            </div>

            <div className="space-y-8 flex-1">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black uppercase tracking-widest opacity-50">Operator ID</span>
                  <span className="text-[11px] font-bold font-mono">{session?.userName || '—'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black uppercase tracking-widest opacity-50">Assigned Asset</span>
                  <span className="text-[11px] font-bold font-mono text-[#4169E1]">{session?.assetName || '—'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black uppercase tracking-widest opacity-50">Current Session</span>
                  <span className="text-[11px] font-bold font-mono text-emerald-500">Active</span>
                </div>
              </div>

              <div className="pt-6 border-t border-[var(--border)]">
                <div className="text-[8px] font-black uppercase tracking-widest opacity-50 mb-3">Authorized Protocols</div>
                <div className="flex gap-3">
                  <div className="p-3 px-4 rounded-xl border border-[#4169E1]/30 bg-[#4169E1]/5 flex flex-col gap-1 flex-1">
                    <span className="text-[10px] font-black text-[#4169E1]">PINAKA 2.5</span>
                    <span className="text-[8px] font-bold opacity-60 uppercase">Full Execution Access</span>
                  </div>
                  <div className="p-3 px-4 rounded-xl border border-[var(--border)] bg-transparent flex flex-col gap-1 flex-1 opacity-50">
                    <span className="text-[10px] font-black">TRISHUL 1.0</span>
                    <span className="text-[8px] font-bold opacity-60 uppercase">Awaiting Activation</span>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-[var(--border)] flex justify-between items-center">
                <div>
                  <div className="text-[8px] font-black uppercase tracking-widest opacity-50">Doctrine Version</div>
                  <span className="text-[10px] font-mono font-bold">NETRA.AI.2.5.0</span>
                </div>
                <div className="text-right">
                  <div className="text-[8px] font-black uppercase tracking-widest opacity-50">Last Sync</div>
                  <span className="text-[10px] font-mono font-bold uppercase">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
