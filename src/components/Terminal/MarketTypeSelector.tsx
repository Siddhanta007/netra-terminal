import { ReactNode } from 'react';
import { useNetra } from '../../context/NetraContext';

interface MarketType {
  id: string;
  label: string;
  desc: string;
  icon: ReactNode;
}

const marketTypes: MarketType[] = [
  {
    id: 'TRENDING',
    label: 'Trending',
    desc: 'Directional Momentum',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M23 6l-9.5 9.5-5-5L1 18" /><polyline points="17 6 23 6 23 12" />
      </svg>
    ),
  },
  {
    id: 'RANGING',
    label: 'Ranging',
    desc: 'Mean Reversion',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M3 12h18M3 6h18M3 18h18" />
      </svg>
    ),
  },
  {
    id: 'VOLATILE',
    label: 'Volatile',
    desc: 'High Deviation',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
];

export default function MarketTypeSelector() {
  const { sessionInput, setSessionInput } = useNetra();

  return (
    <div className="space-y-4">
      <label className="text-[10px] font-black uppercase tracking-widest block opacity-40">
        Market Environment
      </label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {marketTypes.map((type) => {
          const isActive = sessionInput.marketType === type.id;
          return (
            <button
              key={type.id}
              onClick={() => setSessionInput({ ...sessionInput, marketType: type.id })}
              className={`flex flex-col items-start p-5 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden group ${
                isActive
                  ? 'border-[#4169E1] bg-[#4169E1]/5 text-[#4169E1] glow-active'
                  : 'border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--surface-2)] text-[var(--text-3)]'
              }`}
            >
              <div className={`mb-3 p-2 rounded-lg transition-colors ${isActive ? 'bg-[#4169E1] text-white' : 'bg-[var(--surface-3)] group-hover:bg-[var(--surface-4)]'}`}>
                {type.icon}
              </div>
              <div className="font-black text-sm uppercase tracking-tight mb-1">{type.label}</div>
              <div className="text-[10px] font-medium opacity-60 uppercase tracking-tighter">{type.desc}</div>
              {isActive && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 rounded-full bg-[#4169E1] animate-pulse"></div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
