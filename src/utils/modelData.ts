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
    type: 'Human-in-the-Loop Retail Trading Model',
    color: '#3b82f6',
    image: '/pinaka.avif',
    status: 'live',
    slides: [
      {
        label: 'What is Pinaka',
        heading: 'A doctrine for converting live market observations into a constrained decision.',
        body: "Pinaka is NETRA's first operational trading model. A human reads the live market and records observable features; Pinaka organises those features through a sequential doctrine of context, structure, auction behaviour, liquidity, state, command, and execution. It is not an automated signal generator. The trader remains inside the loop and owns the final decision.",
        accent: '#3b82f6',
      },
      {
        label: 'Doctrine',
        heading: 'The market must earn a command.',
        body: "Pinaka begins with no assumption that a trade exists. The session builds a structured representation from the real bias, higher-timeframe structure, market pulse, auction behaviour, objectives, liquidity, and execution context. That evidence is classified into a legal doctrine state, from which the system projects the available command, posture, child routes, and forward transitions.",
        accent: '#2563eb',
      },
      {
        label: 'Commands',
        heading: 'Different market states require different forms of engagement.',
        body: "Strike represents directional migration, Interception represents objective interaction, and Saturation represents an auction facilitating value. When the evidence does not justify any of them, Pinaka returns No Engagement. Each command has its own legal states, routes, execution logic, and risk rules; they are doctrine outputs, not labels chosen to fit a desired trade.",
        accent: '#1d4ed8',
      },
      {
        label: 'MAYA + Memory',
        heading: 'AI interprets evidence; deterministic doctrine controls the legal route.',
        body: "MAYA retrieves theory and similar historical paths, interprets the structured session, proposes a legal state, and critiques its own result. Pinaka's catalogue then deterministically controls the command and permitted transitions. The completed path stores observations, AI suggestions, human commitments, execution events, and outcome so it can be audited and retrieved as evidence in later sessions.",
        accent: '#1e40af',
      },
    ],
    params: [
      { label: 'Model Type', value: 'Human-in-the-loop retail trading doctrine' },
      { label: 'Decision Path', value: 'Context · Structure · Auction · Liquidity · State · Command · Execution · Audit' },
      { label: 'Commands', value: 'Strike · Interception · Saturation · No Engagement' },
      { label: 'Doctrine Output', value: 'Legal state · posture · command · child routes · forward transitions' },
      { label: 'MAYA Support', value: 'Vision · retrieval · historian · recognition · critique · audit' },
      { label: 'Status', value: 'First operational NETRA model' },
    ],
  },

  trishul: {
    id: 'trishul',
    code: 'MDL-02',
    name: 'TRISHUL',
    type: 'Quantitative Research Engine',
    color: '#f59e0b',
    image: '/trishul.avif',
    status: 'planning',
    slides: [
      {
        label: 'What Trishul Will Be',
        heading: 'A quantitative engine for testing whether a trading idea has measurable edge.',
        body: "Trishul will be NETRA's quantitative research engine. It will transform a market observation into a precise hypothesis, a mathematical definition, a reproducible dataset, and a body of statistical evidence. Where Pinaka structures qualitative market intelligence, Trishul will measure whether a defined relationship survives empirical testing.",
        accent: '#f59e0b',
      },
      {
        label: 'Research Pipeline',
        heading: 'Observation becomes a testable and reproducible experiment.',
        body: "The pipeline will move from observation and hypothesis to mathematical definition, dataset construction, feature engineering, statistical analysis, machine-learning comparison, and time-aware walk-forward validation. Every result must be traceable to its data, assumptions, experiment configuration, and out-of-sample performance.",
        accent: '#d97706',
      },
      {
        label: 'Evidence',
        heading: 'A result must quantify usefulness, uncertainty, and robustness.',
        body: "Trishul will report more than directional accuracy. A validated hypothesis must expose probability of success, expected value, confidence and calibration, sensitivity to regime, and performance outside the sample used to discover it. The engine is designed to reject weak ideas as clearly as it accepts useful ones.",
        accent: '#b45309',
      },
      {
        label: 'Intended Capabilities',
        heading: 'Research market state, outcomes, risk, alpha, capital, and execution.',
        body: "Trishul will support regime detection, outcome-probability modelling, time-horizon and volatility forecasting, representation learning, alpha discovery, portfolio optimisation, and execution research. These capabilities share one standard: no hypothesis advances without statistical and out-of-sample evidence.",
        accent: '#92400e',
      },
    ],
    params: [
      { label: 'Model Type', value: 'Quantitative research and validation engine' },
      { label: 'Research Flow', value: 'Hypothesis · definition · data · features · statistics · ML · walk-forward' },
      { label: 'Evidence', value: 'Probability · expected value · calibration · out-of-sample performance' },
      { label: 'Research Scope', value: 'Regime · outcomes · forecasts · alpha · portfolio · execution' },
      { label: 'Decision Rule', value: 'Accept, revise, or reject from measured evidence' },
      { label: 'Status', value: 'In development' },
    ],
  },
};
