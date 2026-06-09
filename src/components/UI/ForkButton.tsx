// Small 'fork' icon button — branches a new session from the current phase.

import React from 'react';

interface ForkButtonProps {
  onClick: () => void;
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
}

export const ForkButton: React.FC<ForkButtonProps> = ({ onClick, size = 'sm', style = {} }) => {
  const isSm = size === 'sm';
  
  return (
    <button
      onClick={onClick}
      style={{
        height: isSm ? '20px' : '26px',
        padding: isSm ? '0 8px' : '0 12px',
        borderRadius: '4px',
        border: '1px solid var(--accent)',
        background: 'var(--accent-bg)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 0 0px rgba(0,0,0,0)',
        ...style, // Merge passed styles
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = 'var(--accent)';
        el.style.boxShadow = '0 0 10px var(--accent)';
        const text = el.querySelector('span') as HTMLElement;
        if (text) text.style.color = '#fff';
        const svg = el.querySelector('svg') as SVGElement;
        if (svg) svg.style.stroke = '#fff';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = 'var(--accent-bg)';
        el.style.boxShadow = '0 0 0px rgba(0,0,0,0)';
        const text = el.querySelector('span') as HTMLElement;
        if (text) text.style.color = 'var(--accent)';
        const svg = el.querySelector('svg') as SVGElement;
        if (svg) svg.style.stroke = 'var(--accent)';
      }}
    >
      <svg 
        width={isSm ? "10" : "12"} 
        height={isSm ? "10" : "12"} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="var(--accent)" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        style={{ transition: 'stroke 200ms' }}
      >
        <line x1="6" y1="3" x2="6" y2="15"></line>
        <circle cx="18" cy="6" r="3"></circle>
        <circle cx="6" cy="18" r="3"></circle>
        <path d="M18 9a9 9 0 0 1-9 9"></path>
      </svg>
      <span 
        className="mono" 
        style={{ 
          fontSize: isSm ? '7px' : '8.5px', 
          fontWeight: 900, 
          textTransform: 'uppercase', 
          letterSpacing: '0.1em', 
          color: 'var(--accent)', 
          transition: 'color 200ms' 
        }}
      >
        Fork
      </span>
    </button>
  );
};

export default ForkButton;
