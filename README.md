# Netra Terminal

React + TypeScript frontend for the NETRA market-intelligence terminal.

## Start locally

```bash
npm install
npm run dev
```

The development frontend runs on the Vite URL, normally
`http://localhost:5173`. Start the FastAPI backend on port `7860`.

Environment variables:

```text
VITE_API_URL=http://localhost:7860
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

## Build

```bash
npm run build
```

## Architecture

```text
src/main.tsx
  → App.tsx
     ├── NetraContext                 API/workflow facade
     ├── Redux store                  durable client state
     ├── features/terminal            P1–P9 terminal UI
     └── components/Layout/MayaChatPanel.tsx
```

The terminal is confirmation-gated: confirming a box persists it and reveals
the next; editing/resetting an earlier box clears and hides downstream state.
Maya proposals never auto-confirm.

Domain UI definitions come from the backend:

- `static/data.json`: box/component names, dimensions, labels and options.
- `static/states.json`: predefined NS hypotheses, commands and transitions.

AI requests use `src/utils/agentWorkflowRequest.ts` and send only the terminal
session identity plus model routing. The backend constructs evidence from the
authoritative Mongo session.

Detailed documentation:

- [`../Documents/FRONTEND.md`](../Documents/FRONTEND.md)
- [`../Documents/TERMINAL_FEATURE.md`](../Documents/TERMINAL_FEATURE.md)
- [`../Documents/INTELLIGENCE.md`](../Documents/INTELLIGENCE.md)
