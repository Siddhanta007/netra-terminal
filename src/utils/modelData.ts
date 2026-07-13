// Static display content for the Model showcase page (per-model cards + slides).

export interface ModelSlide {
  label: string;
  heading: string;
  body: string;
  accent: string;
}

export interface ModelPageData {
  id: string;
  code: string;
  name: string;
  type: string;
  color: string;
  image: string;
  status: 'live' | 'planning';
  slides: ModelSlide[];
  params: { label: string; value: string }[];
}

export const MODEL_DATA: Record<string, ModelPageData> = {
  pinaka: {
    id: 'pinaka',
    code: 'MDL-01',
    name: 'PINAKA',
    type: 'AI-Assisted Retail Trading Model',
    color: '#3b82f6',
    image: '/pinaka.avif',
    status: 'live',
    slides: [
      {
        label: 'What is Pinaka',
        heading: 'Retail precision built on institutional logic.',
        body: "Pinaka is an AI-assisted retail trading model built on institutional price action principles. It is not a signal system — it is a structured decision framework that forces every assumption about the market to be verified through a sequence of structural gates before capital is committed. The model operates across two protocols: Strike and Interception.",
        accent: '#3b82f6',
      },
      {
        label: 'Strike Protocol',
        heading: 'Follow confirmed structural momentum.',
        body: "The Strike protocol engages when price has broken structure with clean momentum and pulled back without invalidation. Three entry routes are defined based on pullback depth and zone behaviour — each with a dedicated weapon. The operator does not predict the next move. The market has already declared it. Strike aligns with that declaration.",
        accent: '#2563eb',
      },
      {
        label: 'Interception Protocol',
        heading: 'Intercept the reversal at the point of institutional deception.',
        body: "The Interception protocol engages when price sweeps a engineered liquidity level and shows structural confirmation of a reversal. Four approach patterns — Direct, Layered, Inducement, Hover — each map to a specific weapon. The entry is never at the sweep extreme. It is at the first structural flip confirmation after the trap is complete.",
        accent: '#1d4ed8',
      },
      {
        label: 'The AI Edge',
        heading: 'Maya analyses every session. The operator makes the final call.',
        body: "Every session is supported by Maya — the AI engine that reads chart context, validates structural bias, and surfaces confluence the operator may miss. Maya does not trade. The operator does. The AI layer removes information blind spots; the decision framework removes emotional ones. Together they define the Pinaka edge.",
        accent: '#1e40af',
      },
    ],
    params: [
      { label: 'Model Type', value: 'AI-assisted intraday decision framework' },
      { label: 'Workflow', value: 'Macro Map · Market Pulse · State Recognition · Command · STS · Mission Control · Audit' },
      { label: 'Protocols', value: 'Strike continuation · Interception reversal' },
      { label: 'Weapons', value: 'TRSH · BRAM · AGN · AKA · TEER · PNKA · PRTH' },
      { label: 'AI Layer', value: 'Maya agents · Vision · Information RAG · Historian · Selector · Critic · Auditor' },
      { label: 'Release', value: 'First user release' },
    ],
  },

  trishul: {
    id: 'trishul',
    code: 'MDL-02',
    name: 'TRISHUL',
    type: 'Quant-Institutional Swing Model',
    color: '#f59e0b',
    image: '/trishul.avif',
    status: 'planning',
    slides: [
      {
        label: 'Vision',
        heading: 'Where quantitative logic meets institutional price action.',
        body: "Trishul is a planned hybrid model that combines quantitative screening with institutional price action analysis. Unlike Pinaka — which is a session-based intraday framework — Trishul is designed for short-term swing trading in equities. The model will identify stocks with quantitative strength and enter only when institutional price action confirms the opportunity.",
        accent: '#f59e0b',
      },
      {
        label: 'Architecture',
        heading: 'Quant filter. Institutional entry. AI validation.',
        body: "The model architecture operates in two phases. Phase one is quantitative: screening for stocks with momentum, volume, and fundamental criteria that suggest institutional accumulation. Phase two is structural: waiting for institutional price action patterns — sweeps, flips, and break of structure — to confirm the entry. No trade is taken on quant signal alone.",
        accent: '#d97706',
      },
      {
        label: 'Asset Class',
        heading: 'Equities. Short-term swing. Buy-side only.',
        body: "Trishul is a long-only model focused on buying stocks for short-term holds — typically one to five sessions. The model does not short. It does not operate on derivatives. It targets stocks where institutional participants are building positions and the quantitative picture aligns with the structural one. High-conviction setups only.",
        accent: '#b45309',
      },
      {
        label: 'Development Status',
        heading: 'Currently in research and planning phase.',
        body: "Trishul is not yet deployed. The model is in active research — backtesting the quantitative screening layer, defining the structural confirmation rules, and designing the AI assistance layer for sector and stock-level context. Deployment is planned once the framework achieves statistical edge across sufficient historical data.",
        accent: '#92400e',
      },
    ],
    params: [
      { label: 'Model Type', value: 'Hybrid Quant + Institutional Price Action' },
      { label: 'Asset Class', value: 'Equities (Long-only)' },
      { label: 'Holding Period', value: 'Short-term swing — 1 to 5 sessions' },
      { label: 'AI Assistance', value: 'Planned — sector & stock-level context' },
      { label: 'Direction', value: 'Buy-side only · No shorts · No derivatives' },
      { label: 'Status', value: 'Planning Phase — Not yet deployed' },
    ],
  },
};
