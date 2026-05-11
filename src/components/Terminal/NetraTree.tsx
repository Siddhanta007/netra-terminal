import { useState, useRef, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type TermType = 'no-engagement' | 'strike' | 'interception' | 'wait' | 'sts';

interface Terminal { type: TermType; label: string; note?: string; }
interface Branch {
  id: string;
  label: string;
  sublabel?: string;
  tag?: string;
  outcomeNote?: string;
  children?: Branch[];
  nextGateId?: string;
  terminal?: Terminal;
}
interface Gate {
  id: string; num: string; label: string; sublabel?: string;
  question: string; color: string; branches: Branch[];
}

// ─── Terminal styling ─────────────────────────────────────────────────────────

const TS: Record<TermType, { bg: string; border: string; text: string }> = {
  'no-engagement': { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.45)',  text: '#f87171' },
  'strike':        { bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.45)', text: '#34d399' },
  'interception':  { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.45)', text: '#fbbf24' },
  'wait':          { bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.3)', text: '#94a3b8' },
  'sts':           { bg: 'rgba(168,85,247,0.1)',  border: 'rgba(168,85,247,0.4)',  text: '#c084fc' },
};

// ─── Full doctrine tree data ──────────────────────────────────────────────────

const GATES: Gate[] = [

  // ── GATE 00: Real Bias ───────────────────────────────────────────────────────
  {
    id: 'g1', num: '00', label: 'REAL BIAS', sublabel: 'Pre-Market · Run before 9:15 IST', color: '#4169E1',
    question: 'What is today\'s directional predisposition? Read: Gap + Gift Nifty + Previous Day Profile + Weekly Context',
    branches: [
      { id: 'bull', label: 'BULLISH', sublabel: 'Majority bullish votes across 4 dimensions', outcomeNote: 'Carry predisposition forward. Both Strike and Interception in bias remain active. Continue to Gate 1.', nextGateId: 'g2' },
      { id: 'bear', label: 'BEARISH', sublabel: 'Majority bearish votes across 4 dimensions', outcomeNote: 'Carry predisposition forward. Continue to Gate 1.', nextGateId: 'g2' },
      { id: 'neut', label: 'NEUTRAL', sublabel: 'No clear majority — votes split evenly', outcomeNote: 'No directional lens. Both directions equally available. Continue to Gate 1.', nextGateId: 'g2' },
    ],
  },

  // ── GATE 01: HTF Structure ───────────────────────────────────────────────────
  {
    id: 'g2', num: '01', label: 'HTF STRUCTURE', sublabel: '1H Chart — Mark Swing Highs + Lows first', color: '#7C3AED',
    question: 'Read all 6 dimensions: Continuity · Maturity · Rotation · Compression · Destination · Distraction',
    branches: [
      {
        id: 'stop', label: 'STOP', sublabel: '🔴 Any hard block condition present',
        children: [
          { id: 'stop-broken', label: 'Continuity = BROKEN', terminal: { type: 'no-engagement', label: '⛔ NO ENGAGEMENT', note: 'Control transferred to opposite side. Chart closes. Session ends.' } },
          { id: 'stop-combo', label: 'Late + Deep + Near (simultaneously)', terminal: { type: 'no-engagement', label: '⛔ NO ENGAGEMENT', note: 'Terminal squeeze. Late maturity + deep rotation + near destination. Chart closes.' } },
        ],
      },
      {
        id: 'reduce', label: 'REDUCE', sublabel: '🟡 Any one caution condition active', tag: 'REDUCE FLAG',
        children: [
          { id: 'reduce-threat', label: 'Continuity = Threatened', tag: 'HALF R', outcomeNote: 'Control at risk. Not transferred. Reduce flag active — carries through all gates.', nextGateId: 'g3' },
          { id: 'reduce-late', label: 'Maturity = Late', tag: 'HALF R', outcomeNote: 'Exhaustion risk rising. Reduce flag active.', nextGateId: 'g3' },
          { id: 'reduce-near', label: 'Destination = Near', tag: 'HALF R', outcomeNote: 'Objective close to met. Reversal/sweep risk rising. Reduce flag active.', nextGateId: 'g3' },
          { id: 'reduce-unfill', label: 'Distraction = Unfilled', tag: 'HALF R', outcomeNote: 'Correction magnet exists. Reduce flag active.', nextGateId: 'g3' },
        ],
      },
      { id: 'cont', label: 'CONTINUE', sublabel: '🟢 All six dimensions clear — full permission', outcomeNote: 'Intact continuity. Early or Mid maturity. Shallow or Moderate rotation. Far destination. Balanced distraction. Full structural permission.', nextGateId: 'g3' },
    ],
  },

  // ── GATE 02: Auction State ───────────────────────────────────────────────────
  {
    id: 'g3', num: '02', label: 'AUCTION STATE', sublabel: 'Market Pulse · 15M Chart — Mark Swing H+L + Break Level', color: '#0EA5E9',
    question: 'What is the current 15M structural environment? What kind of movement is forming?',
    branches: [
      {
        id: 'balance', label: 'BALANCE', sublabel: 'Price forming lower highs AND higher lows simultaneously',
        children: [
          { id: 'bal-mid', label: 'Mid Range', sublabel: 'Price not at boundary — interior of range', terminal: { type: 'wait', label: '⏸ WAIT', note: 'Return when price approaches boundary. Do not proceed mid-range.' } },
          { id: 'bal-bound', label: 'Boundary Interaction', sublabel: 'Price at range edge — measuring energy + reaction', outcomeNote: 'Is price approaching boundary with real energy? Did boundary hold or break? → Proceed to Gate 3.', nextGateId: 'g4a' },
        ],
      },
      { id: 'reloc-bias', label: 'RELOCATION — IN BIAS', sublabel: 'Consecutive HH+HL or LH+LL in Bias direction', tag: 'STRIKE TERRITORY', outcomeNote: 'Is continuation energy real? Did pullback zone hold? Measuring continuation strength. → Proceed to Gate 3.', nextGateId: 'g4a' },
      { id: 'reloc-counter', label: 'RELOCATION — COUNTER BIAS', sublabel: 'Consecutive sequence opposite to Bias direction', tag: 'INTERCEPTION TERRITORY', outcomeNote: 'Is counter move aggressive enough to hunt liquidity? Did price react at liquidity level? Measuring trap formation quality. → Proceed to Gate 3.', nextGateId: 'g4a' },
      {
        id: 'trans', label: 'TRANSITIONAL', sublabel: 'Break of Balance boundary — new sequence not yet confirmed',
        children: [
          { id: 'trans-conf', label: 'Break Confirming', sublabel: 'Break is continuing — not yet Relocation', terminal: { type: 'wait', label: '⏸ WAIT', note: 'Wait for Relocation to establish itself. Restart from Auction State when Relocation forms.' } },
          { id: 'trans-rej', label: 'Break Rejecting', sublabel: 'Break failed — reversal forming', tag: 'INTERCEPTION TERRITORY', outcomeNote: 'Rejection quality confirmed. Measuring trap formation. → Proceed to Gate 3.', nextGateId: 'g4a' },
        ],
      },
    ],
  },

  // ── GATE 03A: Price Behaviour Phase 1 ────────────────────────────────────────
  {
    id: 'g4a', num: '03A', label: 'PRICE BEHAVIOUR', sublabel: 'Phase 1 — The Approach (15M) · Read last 3–5 candle bodies', color: '#F59E0B',
    question: 'What is the quality of energy arriving at the liquidity wall? Read Displacement + Absorption together.',
    branches: [
      { id: 'clean', label: 'CLEAN DRIVE', sublabel: 'Slicing + Efficient', outcomeNote: 'Bodies expanding + closes at extremes. Zero opposing wicks. Energy real and uncontested. Proceed to Phase 2 at full conviction.', nextGateId: 'g4b' },
      { id: 'hidden', label: 'HIDDEN WALL', sublabel: 'Slicing + Absorbed', tag: 'THE MIRAGE ⚠', terminal: { type: 'no-engagement', label: '⛔ NO ENGAGEMENT', note: 'Aggressive move + invisible opposition = trap ahead. Chart closes immediately. Do not analyse further.' } },
      { id: 'weak', label: 'WEAK DRIVE', sublabel: 'Grinding + Efficient OR Constant + Efficient', tag: 'REDUCED CONVICTION', outcomeNote: 'Reduced energy. Conviction drops. Proceed to Phase 2 with caution. Size may reduce at command level.' , nextGateId: 'g4b' },
      { id: 'dead-mkt', label: 'DEAD MARKET', sublabel: 'Grinding + Absorbed', terminal: { type: 'no-engagement', label: '⛔ NO ENGAGEMENT', note: 'No energy + heavy resistance. Nothing is happening. Chart closes immediately.' } },
    ],
  },

  // ── GATE 03B: Price Behaviour Phase 2 ────────────────────────────────────────
  {
    id: 'g4b', num: '03B', label: 'PRICE BEHAVIOUR', sublabel: 'Phase 2 — The Interaction (5M–15M) · First 2–3 candles only', color: '#F59E0B',
    question: 'What happens at the exact moment price contacts the wall? Read Reaction + Time Velocity together.',
    branches: [
      { id: 'vi',    label: 'VIOLENT + IMMEDIATE',    outcomeNote: 'Maximum reaction quality. 1–2 candle aggressive rejection + immediate commitment. Full conviction. Proceed to Gate 4.', nextGateId: 'g5' },
      { id: 'vdel',  label: 'VIOLENT + DELAYED',      outcomeNote: 'Strong rejection visible but hesitation on follow-through (4–7 candles). Conviction reduces slightly. Proceed to Gate 4.', nextGateId: 'g5' },
      { id: 'vdead', label: 'VIOLENT + DEAD',         tag: 'THE DEAD TRAP ⚠', terminal: { type: 'no-engagement', label: '⛔ NO ENGAGEMENT', note: 'Wall reacted violently but follow-through is absent. Excessive candles at level. Chart closes.' } },
      { id: 'ci',    label: 'CONTROLLED + IMMEDIATE', outcomeNote: 'Clean measured response + immediate commitment. Healthy interaction. Normal conviction. Proceed to Gate 4.', nextGateId: 'g5' },
      { id: 'cdel',  label: 'CONTROLLED + DELAYED',   outcomeNote: 'Moderate response + delayed commitment. Reduced conviction. Proceed to Gate 4 with caution.', nextGateId: 'g5' },
      { id: 'gdead', label: 'GRINDING + DEAD',        terminal: { type: 'no-engagement', label: '⛔ NO ENGAGEMENT', note: 'Barely responds. Slow overlapping candles. No direction. No meaningful interaction. Chart closes.' } },
    ],
  },

  // ── GATE 04: Liquidity Context ───────────────────────────────────────────────
  {
    id: 'g5', num: '04', label: 'LIQUIDITY CONTEXT', sublabel: '15M Chart — Max 3 walls on chart. Tier 1 from Real Bias auto-transfers.', color: '#10B981',
    question: 'Read Liquidity Zone Tier + Maturity together. NETRA command follows from this gate.',
    branches: [
      {
        id: 't1f', label: 'TIER 1 + FRESH', sublabel: 'HTF wall — Maximum institutional visibility + Maximum fuel',
        children: [
          {
            id: 't1f-reloc', label: 'Relocation in Bias + Clean Drive heading INTO wall', tag: 'SUICIDE CHECK ⚠',
            children: [
              { id: 't1f-yes', label: 'YES — Striking directly into fresh maximum-strength T1', terminal: { type: 'no-engagement', label: '⛔ NO ENGAGEMENT', note: 'Suicide Mission. Do not Strike into maximum-strength wall. Capital will be absorbed.' } },
              { id: 't1f-no', label: 'NO — T1 is target beyond a mature wall being swept', outcomeNote: 'The fresh T1 is the destination. The near wall is the sweep target. Strike valid. → Strike STS.', nextGateId: 'g6s' },
            ],
          },
          { id: 't1f-counter', label: 'Counter Bias + Violent Reaction', outcomeNote: 'Maximum conviction interception. Fresh T1 stops stacked. Full fuel. → Interception STS.', nextGateId: 'g6i' },
          { id: 't1f-balance', label: 'Balance Boundary + Violent/Controlled Reaction', outcomeNote: 'High conviction. Boundary rejection at maximum-strength wall. → Interception STS.', nextGateId: 'g6i' },
        ],
      },
      {
        id: 't1d', label: 'TIER 1 + DEVELOPING', sublabel: 'HTF wall — Heavy + Partially drained · Significant fuel remains',
        children: [
          { id: 't1d-reloc',   label: 'Relocation in Bias + Clean Drive',  outcomeNote: 'Wall is partially worn. Sweep probable. Real liquidity sits just beyond. → Strike STS.', nextGateId: 'g6s' },
          { id: 't1d-counter', label: 'Counter Bias + Violent/Controlled',  outcomeNote: 'Moderate conviction. Reduce size vs Fresh T1. → Interception STS.', nextGateId: 'g6i' },
          { id: 't1d-balance', label: 'Balance Boundary + Controlled',      outcomeNote: 'Moderate conviction. Confirmation required before size. → Interception STS.', nextGateId: 'g6i' },
        ],
      },
      {
        id: 't1m', label: 'TIER 1 + MATURE', sublabel: 'Strike Territory ONLY — Wall is drained. Do not Intercept.',
        children: [
          { id: 't1m-reloc',   label: 'Relocation in Bias', outcomeNote: 'Drained wall. Most stops already collected. Real liquidity sits beyond. → Strike STS.', nextGateId: 'g6s' },
          { id: 't1m-counter', label: 'Counter Bias',        terminal: { type: 'no-engagement', label: '⛔ NO ENGAGEMENT', note: 'Do not Intercept a drained wall. No stops remaining. Risk-reward destroyed.' } },
        ],
      },
      {
        id: 't2f', label: 'TIER 2 + FRESH', sublabel: '15M structural wall — Moderate weight + Full fuel',
        children: [
          { id: 't2f-reloc',   label: 'Relocation in Bias + Clean Drive',   outcomeNote: 'Valid continuation target. Moderate weight. → Strike STS.', nextGateId: 'g6s' },
          { id: 't2f-counter', label: 'Counter Bias + Violent + Immediate', outcomeNote: 'Valid interception. Smaller reaction vs T1 is normal. → Interception STS.', nextGateId: 'g6i' },
          { id: 't2f-weak',    label: 'Weak Drive Approaching',             terminal: { type: 'no-engagement', label: '⛔ NO ENGAGEMENT', note: 'Insufficient approach energy for a Tier 2 interaction. No conviction to proceed.' } },
        ],
      },
      {
        id: 't2d', label: 'TIER 2 + DEVELOPING', sublabel: 'Moderate + Partially drained — Proceed with caution',
        children: [
          { id: 't2d-strong', label: 'Strong Phase 2 Reaction (Violent/Controlled + Immediate)', outcomeNote: 'Proceed with caution. Additional confirmation required before full size. → Interception STS.', nextGateId: 'g6i' },
          { id: 't2d-weak',   label: 'Weak Phase 2 Reaction (Controlled/Grinding + Delayed/Dead)', terminal: { type: 'no-engagement', label: '⛔ NO ENGAGEMENT', note: 'Insufficient reaction quality for Tier 2 Developing. No engagement.' } },
        ],
      },
      { id: 't2m', label: 'TIER 2 + MATURE', sublabel: 'Fully drained — wall is noise', terminal: { type: 'no-engagement', label: '⛔ NO ENGAGEMENT', note: 'Wall is fully drained. No stops remaining. Remove from chart. No engagement.' } },
      { id: 't3',  label: 'TIER 3 + ANY',    sublabel: 'FVG / Minor imbalance — STS execution level only', terminal: { type: 'sts', label: '📡 DIRECT TO STS', note: 'Not a NETRA routing decision. Tier 3 walls are execution-level only. Do not route through Gate 4 analysis.' } },
    ],
  },

  // ── STRIKE STS — T1: Impulse Quality ────────────────────────────────────────
  {
    id: 'g6s', num: 'STS-S · T1', label: 'STRIKE STS', sublabel: 'T1 — Impulse Quality (5M Chart)', color: '#34d399',
    question: 'Does the break of structure have valid impulse quality? Observe the breaking candle(s).',
    branches: [
      { id: 'st1-valid', label: 'VALID', sublabel: 'Clean break + displacement. Bodies at extremes. Closes beyond level.', outcomeNote: 'Full conviction downstream. Proceed to T2.', nextGateId: 'g7s' },
      { id: 'st1-weak',  label: 'WEAK',  sublabel: 'Overlapping candles. Unclear displacement. Closes mid-body.', tag: 'REDUCED FIRST TARGET ONLY', outcomeNote: 'Reduced conviction. First target only — no second target regardless of weapon. Proceed to T2.', nextGateId: 'g7s' },
    ],
  },

  // ── STRIKE STS — T2: Zone Interaction ───────────────────────────────────────
  {
    id: 'g7s', num: 'STS-S · T2', label: 'STRIKE STS', sublabel: 'T2 — Zone Interaction (5M Chart)', color: '#34d399',
    question: 'Is there a continuation zone (FVG or Order Block) in the pullback? What is the pullback quality?',
    branches: [
      {
        id: 'st2-fvg', label: 'FVG PRESENT', sublabel: 'Fair Value Gap in pullback area',
        children: [
          {
            id: 'st2-fvg-clean', label: 'Pullback = Clean',
            children: [
              { id: 'st2-fvg-rej',  label: 'Zone Reaction = Rejection',  tag: 'BRAMOSH ROUTE', outcomeNote: 'Pullback into FVG + rejection holding zone boundary. Proceed to T3.', nextGateId: 'g8s' },
              { id: 'st2-fvg-abs',  label: 'Zone Reaction = Absorption', tag: 'AGNI ROUTE', outcomeNote: 'Zone absorbing without immediate push. Wait for T3 trigger. Do not enter yet. Proceed to T3.', nextGateId: 'g8s' },
              { id: 'st2-fvg-fail', label: 'Zone Reaction = Failure', terminal: { type: 'no-engagement', label: '⛔ NO ENGAGEMENT', note: 'FVG invalidated. Zone failed to hold. Transition Watch — Interception may be forming.' } },
            ],
          },
          {
            id: 'st2-fvg-deep', label: 'Pullback = Deep', tag: 'REDUCED SIZE',
            children: [
              { id: 'st2-fvg-deep-rej',  label: 'Zone Reaction = Rejection', tag: 'BRAMOSH REDUCED', outcomeNote: 'Deep pullback but zone rejection held. Reduced size only. Proceed to T3.', nextGateId: 'g8s' },
              { id: 'st2-fvg-deep-fail', label: 'Zone Reaction = Failure', terminal: { type: 'no-engagement', label: '⛔ NO ENGAGEMENT', note: 'Deep pullback + zone failure. Structure compromised. No engagement.' } },
            ],
          },
          { id: 'st2-fvg-damage', label: 'Pullback = Structural Damage', terminal: { type: 'no-engagement', label: '⛔ NO ENGAGEMENT', note: 'Zone invalidated by structural damage. Transition Watch — Interception may be forming in opposite direction.' } },
        ],
      },
      {
        id: 'st2-ob', label: 'ORDER BLOCK PRESENT', sublabel: 'Order Block in pullback area',
        children: [
          {
            id: 'st2-ob-clean', label: 'Pullback = Clean',
            children: [
              { id: 'st2-ob-rej',  label: 'Zone Reaction = Rejection',  tag: 'BRAMOSH ROUTE', outcomeNote: 'OB rejection confirmed. Zone holding. Proceed to T3.', nextGateId: 'g8s' },
              { id: 'st2-ob-abs',  label: 'Zone Reaction = Absorption', tag: 'AGNI ROUTE', outcomeNote: 'OB absorbing. Wait for T3 trigger. Do not enter yet. Proceed to T3.', nextGateId: 'g8s' },
              { id: 'st2-ob-fail', label: 'Zone Reaction = Failure', terminal: { type: 'no-engagement', label: '⛔ NO ENGAGEMENT', note: 'Order Block invalidated. Zone failed. No engagement.' } },
            ],
          },
          { id: 'st2-ob-damage', label: 'Pullback = Structural Damage', terminal: { type: 'no-engagement', label: '⛔ NO ENGAGEMENT', note: 'Order Block invalidated by structural damage. No engagement.' } },
        ],
      },
      { id: 'st2-none', label: 'NO ZONE — SHALLOW PULLBACK', sublabel: 'No FVG or OB in pullback. Strong momentum.', tag: 'TRISHUL ROUTE', outcomeNote: 'No continuation zone needed. Strong momentum continuation. Skip to T3 directly.', nextGateId: 'g8s' },
    ],
  },

  // ── STRIKE STS — T3: Continuation Trigger ───────────────────────────────────
  {
    id: 'g8s', num: 'STS-S · T3', label: 'STRIKE STS', sublabel: 'T3 — Continuation Trigger (5M Chart)', color: '#34d399',
    question: 'Has price confirmed the continuation direction with a valid Break of Structure?',
    branches: [
      { id: 'st3-clean', label: 'CLEAN BOS', sublabel: 'Full displacement in continuation direction. Bodies at extremes.', terminal: { type: 'strike', label: '✅ EXECUTE — FULL CONVICTION', note: 'BRAMOSH: FVG/OB + Rejection path.\nTRISHUL: Shallow pullback (no zone) path.\nAGNI: Compression breakout path.\nSelect weapon by your T2 path.' } },
      { id: 'st3-weak',  label: 'WEAK BOS',  sublabel: 'Break present but overlapping. Unclear displacement.',  tag: 'FIRST TARGET ONLY', terminal: { type: 'strike', label: '⚠️ EXECUTE REDUCED', note: 'Weak BOS. Reduced size. First target only. TRISHUL preferred for weak impulse paths.' } },
      { id: 'st3-nobos', label: 'NO BOS YET', sublabel: 'Trigger not confirmed. Candle still forming or closing mid-range.', terminal: { type: 'wait', label: '⏸ WAIT', note: 'No continuation trigger. Recheck next 5M candle close. Do not enter without a BOS.' } },
      { id: 'st3-opp',   label: 'OPPOSITE BOS', sublabel: 'BOS confirmed in the opposing direction', terminal: { type: 'no-engagement', label: '⛔ NO ENGAGEMENT', note: 'Structural reversal confirmed. Transition Watch — Interception domain now active. Restart from Market Pulse.' } },
    ],
  },

  // ── INTERCEPTION STS — T1: Approach Pattern ─────────────────────────────────
  {
    id: 'g6i', num: 'STS-I · T1', label: 'INTERCEPTION STS', sublabel: 'T1 — Approach Pattern + Engine ID (5M Chart)', color: '#fbbf24',
    question: 'What is the liquidity interaction pattern on approach? Identify the trap engine.',
    branches: [
      {
        id: 'it1-layered', label: 'LAYERED / INDUCEMENT', sublabel: 'Multi-level liquidity build. Price hunting stop clusters in sequence.', tag: 'ENGINE 1 — AAKASH',
        children: [
          { id: 'it1-l-low',  label: 'Friction = Low',      outcomeNote: 'Trap build beginning. Engine 1 (AAKASH) activating. Proceed to T2.', nextGateId: 'g7i' },
          { id: 'it1-l-mod',  label: 'Friction = Moderate', outcomeNote: 'Engine 1 high conviction. Multi-level build with friction. Proceed to T2.', nextGateId: 'g7i' },
          { id: 'it1-l-high', label: 'Friction = High',     outcomeNote: 'Engine 1 maximum conviction. Dense friction on layered build. Proceed to T2.', nextGateId: 'g7i' },
        ],
      },
      {
        id: 'it1-direct', label: 'DIRECT', sublabel: 'Straight approach to liquidity level with no inducement structure.',
        children: [
          { id: 'it1-d-low',  label: 'Friction = Low',  sublabel: 'Engine 2 or 3 probable — sweep type at T2 confirms', outcomeNote: 'Clean direct approach. Engine identification deferred to T2 sweep type. Proceed to T2.', nextGateId: 'g7i' },
          { id: 'it1-d-high', label: 'Friction = High', sublabel: 'Absorption on approach — Engine 4 probable',            outcomeNote: 'Suspicious friction-heavy approach. Engine 4 (PRITHVI — Migration Termination) probable. Proceed to T2.', nextGateId: 'g7i' },
        ],
      },
      {
        id: 'it1-hover', label: 'HOVER', sublabel: 'Compression near boundary. Price coiling with tight range.', tag: 'ENGINE 3 — PINAKA',
        children: [
          { id: 'it1-h-low',  label: 'Friction = Low',  sublabel: 'Liquidity building but no dense absorption yet', outcomeNote: 'Compression forming. Monitor for breakout failure. Engine 3 (PINAKA) probable. Proceed to T2.', nextGateId: 'g7i' },
          { id: 'it1-h-high', label: 'Friction = High', sublabel: 'Dense stop cluster + absorption near boundary',   tag: 'ENGINE 4 — PRITHVI', outcomeNote: 'Dense absorption in hover. Engine 3 or 4. High conviction. Proceed to T2.', nextGateId: 'g7i' },
        ],
      },
    ],
  },

  // ── INTERCEPTION STS — T2: Liquidity Interaction ────────────────────────────
  {
    id: 'g7i', num: 'STS-I · T2', label: 'INTERCEPTION STS', sublabel: 'T2 — Liquidity Interaction (5M Chart)', color: '#fbbf24',
    question: 'What type of sweep occurred? How did price respond at the boundary? Engine is confirmed here.',
    branches: [
      { id: 'it2-none', label: 'SWEEP = NONE', sublabel: 'No sweep has occurred yet', terminal: { type: 'wait', label: '⏸ RETURN TO T1', note: 'Sweep not confirmed. Do not execute prematurely. Wait for a sweep to form. Return to T1.' } },
      {
        id: 'it2-internal', label: 'SWEEP = INTERNAL', sublabel: 'Swept internal structural swing only',
        children: [
          { id: 'it2-int-strong', label: 'Response = Strong Acceptance', terminal: { type: 'no-engagement', label: '⛔ NO ENGAGEMENT', note: 'Strong acceptance after internal sweep = continuation likely. Exit interception analysis.' } },
          { id: 'it2-int-rej', label: 'Response = Rejection / Weak Acceptance', tag: 'LOW CONFIDENCE', outcomeNote: 'Weak trap. Internal sweep only — limited confidence. Proceed to T3 with caution and reduced size.', nextGateId: 'g8i' },
        ],
      },
      {
        id: 'it2-external', label: 'SWEEP = EXTERNAL', sublabel: 'Swept external structural swing / session extreme', tag: 'ENGINE 2 — TEER',
        children: [
          { id: 'it2-ext-strong', label: 'Response = Strong Acceptance', terminal: { type: 'no-engagement', label: '⛔ NO ENGAGEMENT', note: 'Real breakout confirmed. Exit interception analysis immediately. Transition Watch → Strike domain active.' } },
          { id: 'it2-ext-rej',    label: 'Response = Rejection / Weak Acceptance', tag: 'FULL CONVICTION', outcomeNote: 'Valid trap confirmed. Engine 2 (TEER) complete. External sweep + rejection = highest quality interception. Proceed to T3.', nextGateId: 'g8i' },
        ],
      },
      {
        id: 'it2-layered', label: 'SWEEP = LAYERED', sublabel: 'Multiple structural levels swept in sequence', tag: 'ENGINE 1 — AAKASH',
        children: [
          { id: 'it2-lay-strong', label: 'Response = Strong Acceptance', terminal: { type: 'no-engagement', label: '⛔ NO ENGAGEMENT', note: 'Strong acceptance after layered sweep. Exit interception analysis.' } },
          { id: 'it2-lay-rej',    label: 'Response = Rejection / Weak Acceptance', tag: 'HIGHEST CONVICTION', outcomeNote: 'Engine 1 (AAKASH) complete. Layered sweep + rejection = absolute highest conviction interception. Proceed to T3.', nextGateId: 'g8i' },
        ],
      },
    ],
  },

  // ── INTERCEPTION STS — T3: Resolution ───────────────────────────────────────
  {
    id: 'g8i', num: 'STS-I · T3', label: 'INTERCEPTION STS', sublabel: 'T3 — Resolution (5M Chart)', color: '#fbbf24',
    question: 'How fast is price reversing after the sweep? Has a structural flip been confirmed?',
    branches: [
      {
        id: 'it3-fast', label: 'REVERSION = FAST', sublabel: '1–2 candle aggressive reversal after sweep',
        children: [
          { id: 'it3-fast-conf', label: 'Structural Flip = Confirmed', terminal: { type: 'interception', label: '✅ EXECUTE — FULL SIZE', note: 'High conviction. Full size. Primary + secondary targets active.\nEngine 1 → AAKASH\nEngine 2 → TEER\nEngine 3 → PINAKA\nEngine 4 → PRITHVI' } },
          { id: 'it3-fast-none', label: 'Flip = Not Yet Confirmed',    terminal: { type: 'wait', label: '⏸ WAIT', note: 'Fast reversion but no structural flip yet. Wait for next candle to confirm flip.' } },
        ],
      },
      {
        id: 'it3-mod', label: 'REVERSION = MODERATE', sublabel: '3–5 candle measured reversal',
        children: [
          { id: 'it3-mod-conf', label: 'Structural Flip = Confirmed', tag: 'REDUCED SIZE', terminal: { type: 'interception', label: '⚠️ EXECUTE REDUCED', note: 'Moderate reversion. Reduced size. First target only.\nEngine 1 → AAKASH · Engine 2 → TEER\nEngine 3 → PINAKA · Engine 4 → PRITHVI' } },
          { id: 'it3-mod-none', label: 'Flip = Not Confirmed', terminal: { type: 'wait', label: '⏸ WAIT', note: 'Moderate reversion without structural flip. Wait or abandon.' } },
          { id: 'it3-mod-fail', label: 'Flip = Failed Flip', terminal: { type: 'no-engagement', label: '⛔ NO ENGAGEMENT', note: 'Fake reversal. Flip was initiated but failed. Structural reversal not real. Chart closes.' } },
        ],
      },
      {
        id: 'it3-slow', label: 'REVERSION = SLOW / NONE', sublabel: 'Minimal reversal speed after sweep',
        children: [
          { id: 'it3-slow-conf', label: 'Structural Flip = Confirmed', tag: 'MINIMUM SIZE ONLY', terminal: { type: 'interception', label: '⚠️ WEAK ENTRY', note: 'Slow reversion. Minimum size only. First target and quick exit. Very low conviction.' } },
          { id: 'it3-slow-none', label: 'Flip = Not Confirmed / Dead', terminal: { type: 'no-engagement', label: '⛔ DEAD TRAP', note: 'Slow/None reversion + no structural flip = Dead Trap confirmed. Chart closes.' } },
        ],
      },
    ],
  },
];

const GATE_MAP: Record<string, Gate> = Object.fromEntries(GATES.map(g => [g.id, g]));

function findBranch(branches: Branch[], ids: string[]): Branch | null {
  if (!ids.length) return null;
  const b = branches.find(x => x.id === ids[0]);
  if (!b) return null;
  if (ids.length === 1) return b;
  return b.children ? findBranch(b.children, ids.slice(1)) : null;
}

// ─── Branch card ──────────────────────────────────────────────────────────────

function BranchCard({ branch, isSelected, isDimmed, isInteractive, onClick, color }: {
  branch: Branch; isSelected: boolean; isDimmed: boolean;
  isInteractive: boolean; onClick: () => void; color: string;
}) {
  const ts = branch.terminal ? TS[branch.terminal.type] : null;
  const defaultText = '#cbd5e1';
  return (
    <button
      onClick={isInteractive ? onClick : undefined}
      disabled={!isInteractive}
      style={{
        padding: '10px 14px',
        border: `1px solid ${isSelected ? color : ts ? ts.border : 'rgba(255,255,255,0.1)'}`,
        background: isSelected ? `${color}1a` : ts ? ts.bg : 'rgba(255,255,255,0.03)',
        color: isSelected ? color : ts ? ts.text : defaultText,
        opacity: isDimmed ? 0.18 : 1,
        cursor: isInteractive ? 'pointer' : 'default',
        fontFamily: 'JetBrains Mono, monospace',
        textAlign: 'left' as const,
        minWidth: '130px',
        maxWidth: '280px',
        flex: '1 0 auto',
        boxShadow: isSelected ? `0 0 16px ${color}22` : 'none',
        transition: 'all 160ms ease',
        display: 'flex', flexDirection: 'column' as const, gap: '3px',
        borderRadius: '4px',
      }}
    >
      {branch.tag && (
        <span style={{ fontSize: '7px', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: '#fbbf24', marginBottom: '1px' }}>
          ⚠ {branch.tag}
        </span>
      )}
      <span style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.04em', textTransform: 'uppercase' as const, color: isSelected ? color : ts ? ts.text : '#f1f5f9' }}>
        {branch.label}
      </span>
      {branch.sublabel && (
        <span style={{ fontSize: '8px', fontWeight: 500, color: isSelected ? `${color}cc` : 'rgba(148,163,184,0.7)', marginTop: '1px', lineHeight: 1.4 }}>
          {branch.sublabel}
        </span>
      )}
      {branch.terminal && (
        <span style={{ fontSize: '8px', fontWeight: 900, marginTop: '4px', color: ts!.text }}>
          → {branch.terminal.label}
        </span>
      )}
      {isSelected && branch.outcomeNote && (
        <span style={{ fontSize: '8px', fontWeight: 500, color: `${color}aa`, marginTop: '3px', fontStyle: 'italic' as const, lineHeight: 1.5 }}>
          {branch.outcomeNote}
        </span>
      )}
    </button>
  );
}

// ─── Gate section ─────────────────────────────────────────────────────────────

function GateSection({ gate, branchPath, isLocked, onBranchClick }: {
  gate: Gate; branchPath: string[]; isLocked: boolean;
  onBranchClick?: (id: string, depth: number) => void;
}) {
  function renderLevel(branches: Branch[], depth: number) {
    const selectedId = branchPath[depth];
    const hasSelection = selectedId !== undefined;
    const selectedBranch = hasSelection ? branches.find(b => b.id === selectedId) : null;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
          {branches.map(b => (
            <BranchCard
              key={b.id}
              branch={b}
              isSelected={b.id === selectedId}
              isDimmed={hasSelection && b.id !== selectedId}
              isInteractive={!isLocked && !hasSelection}
              onClick={() => onBranchClick?.(b.id, depth)}
              color={gate.color}
            />
          ))}
        </div>
        {selectedBranch?.children && (
          <div style={{ marginLeft: '16px', paddingLeft: '14px', paddingTop: '6px', borderLeft: `2px solid ${gate.color}30` }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7px', fontWeight: 900, color: gate.color, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '7px' }}>
              {selectedBranch.label} ↓
            </div>
            {renderLevel(selectedBranch.children, depth + 1)}
          </div>
        )}
      </div>
    );
  }

  const leafBranch = branchPath.length ? findBranch(gate.branches, branchPath) : null;
  const showConnector = isLocked && leafBranch?.nextGateId;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Gate header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', borderLeft: `3px solid ${gate.color}`, paddingLeft: '14px' }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', fontWeight: 900, color: gate.color, letterSpacing: '0.25em', whiteSpace: 'nowrap', opacity: 0.8 }}>
          GATE {gate.num}
        </span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: 900, color: '#f1f5f9', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {gate.label}
        </span>
        {gate.sublabel && (
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', color: '#475569', letterSpacing: '0.04em' }}>
            — {gate.sublabel}
          </span>
        )}
      </div>
      <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#64748b', margin: '0 0 2px 17px', fontStyle: 'italic', lineHeight: 1.5 }}>
        {gate.question}
      </p>
      <div style={{ marginLeft: '17px' }}>
        {renderLevel(gate.branches, 0)}
      </div>
      {showConnector && (
        <div style={{ marginLeft: '17px', paddingTop: '2px' }}>
          <div style={{ width: '2px', height: '24px', background: `linear-gradient(to bottom, ${gate.color}50, transparent)` }} />
        </div>
      )}
    </div>
  );
}

// ─── Terminal outcome ─────────────────────────────────────────────────────────

function TerminalNode({ terminal }: { terminal: Terminal }) {
  const s = TS[terminal.type];
  return (
    <div style={{ border: `1px solid ${s.border}`, background: s.bg, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '8px', borderRadius: '6px' }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7px', fontWeight: 900, color: s.text, letterSpacing: '0.3em', textTransform: 'uppercase', opacity: 0.6 }}>
        Protocol Outcome
      </div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '22px', fontWeight: 900, color: s.text, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {terminal.label}
      </div>
      {terminal.note && (
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: s.text, opacity: 0.65, margin: 0, lineHeight: 1.7, whiteSpace: 'pre-line' }}>
          {terminal.note}
        </p>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface NetraTreeProps { open: boolean; onClose: () => void; }

export default function NetraTree({ open, onClose }: NetraTreeProps) {
  const [history, setHistory] = useState<{ gate: Gate; branchPath: string[] }[]>([]);
  const [currentGateId, setCurrentGateId] = useState('g1');
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [terminal, setTerminal] = useState<Terminal | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [history.length, currentPath.length, terminal, open]);

  function reset() {
    setHistory([]); setCurrentGateId('g1'); setCurrentPath([]); setTerminal(null);
  }

  function handleBranchClick(id: string, depth: number) {
    if (terminal) return;
    const gate = GATE_MAP[currentGateId];
    const newPath = [...currentPath.slice(0, depth), id];
    const branch = findBranch(gate.branches, newPath);
    if (!branch) return;

    if (branch.terminal) {
      setHistory(h => [...h, { gate, branchPath: newPath }]);
      setCurrentPath([]);
      setTerminal(branch.terminal);
    } else if (branch.children) {
      setCurrentPath(newPath);
    } else if (branch.nextGateId) {
      setHistory(h => [...h, { gate, branchPath: newPath }]);
      setCurrentPath([]);
      setCurrentGateId(branch.nextGateId);
    }
  }

  if (!open) return null;

  // Visible progress gates (top-level gates only, not STS sub-gates)
  const progressGates = GATES.filter(g => ['g1','g2','g3','g4a','g4b','g5','g6s','g7s','g8s','g6i','g7i','g8i'].includes(g.id));

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'hsl(224, 32%, 7%)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <div style={{ padding: '10px 32px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0, background: 'rgba(255,255,255,0.015)' }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7px', fontWeight: 700, color: '#4169E1', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '2px' }}>
            PINAKA DOCTRINE · v2.0
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', fontWeight: 900, color: '#f1f5f9', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            MEGA DECISION TREE
          </div>
        </div>
        <div style={{ flex: 1 }} />

        {/* Gate progress dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexWrap: 'wrap' }}>
          {GATES.slice(0, 6).map((g, i) => {
            const done = history.some(h => h.gate.id === g.id);
            const active = !terminal && currentGateId === g.id;
            return (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                {i > 0 && <div style={{ width: '10px', height: '1px', background: done ? `${g.color}60` : 'rgba(255,255,255,0.06)' }} />}
                <div title={`GATE ${g.num} — ${g.label}`} style={{ width: '20px', height: '20px', borderRadius: '50%', border: `1px solid ${done || active ? g.color : 'rgba(255,255,255,0.07)'}`, background: done ? `${g.color}22` : active ? `${g.color}10` : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 200ms' }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '6px', fontWeight: 900, color: done || active ? g.color : '#334155' }}>
                    {done ? '✓' : g.num}
                  </span>
                </div>
              </div>
            );
          })}
          {/* STS indicator */}
          {(['g6s','g7s','g8s','g6i','g7i','g8i'] as const).some(id => history.some(h => h.gate.id === id) || currentGateId === id) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <div style={{ width: '10px', height: '1px', background: 'rgba(52,211,153,0.4)' }} />
              <div style={{ padding: '2px 6px', border: '1px solid rgba(52,211,153,0.5)', background: 'rgba(52,211,153,0.08)', borderRadius: '3px' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '6px', fontWeight: 900, color: '#34d399', letterSpacing: '0.1em' }}>STS</span>
              </div>
            </div>
          )}
        </div>

        <button onClick={reset} style={{ padding: '5px 12px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#64748b', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: '4px', transition: 'all 150ms' }} className="hover:!text-white hover:!border-white/20">
          Reset
        </button>
        <button onClick={onClose} style={{ width: '28px', height: '28px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', transition: 'all 150ms' }} className="hover:!text-white hover:!border-white/20">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* ── Tree scroll area ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }} className="custom-scrollbar">
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* Doctrine subtitle */}
          <div style={{ textAlign: 'center', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.2em', margin: 0 }}>
              One way only · Top to bottom · Default: NO ENGAGEMENT at every gate unless earned
            </p>
          </div>

          {history.map((entry, i) => (
            <div key={`${entry.gate.id}-${i}`}>
              <GateSection gate={entry.gate} branchPath={entry.branchPath} isLocked={true} />
            </div>
          ))}

          {!terminal && (
            <GateSection
              gate={GATE_MAP[currentGateId]}
              branchPath={currentPath}
              isLocked={false}
              onBranchClick={handleBranchClick}
            />
          )}

          {terminal && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ marginLeft: '17px' }}>
                <div style={{ width: '2px', height: '22px', background: 'rgba(255,255,255,0.07)' }} />
              </div>
              <TerminalNode terminal={terminal} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={reset} style={{ padding: '8px 20px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#64748b', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: '4px', transition: 'all 150ms' }} className="hover:!text-white hover:!border-white/20">
                  Run Again
                </button>
                <button onClick={onClose} style={{ padding: '8px 20px', border: '1px solid rgba(65,105,225,0.35)', background: 'rgba(65,105,225,0.08)', color: '#4169E1', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: '4px', transition: 'all 150ms' }} className="hover:!bg-[rgba(65,105,225,0.18)]">
                  Close
                </button>
              </div>
            </div>
          )}

          {!terminal && (
            <div style={{ paddingLeft: '17px' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Select an option above to continue →
              </div>
            </div>
          )}

          <div ref={bottomRef} style={{ height: '60px' }} />
        </div>
      </div>
    </div>
  );
}
