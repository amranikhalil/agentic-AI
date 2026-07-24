# AGENTS.md — Multi-Agent AI System

## Architecture Overview
Two independent packages (NOT a monorepo — no workspace config):

- **Root (`/`)**: Node.js + Express SSE backend
  - `index1.ts` — Production entrypoint (SSE streaming endpoint)
  - `index.ts` — CLI test script (runs pipeline directly, not the server)
- **`multi-agent-ui/`**: Vite + React dashboard (connects to backend SSE)

## Running the System
**Must start both in separate terminals:**

```bash
# Terminal 1 — Backend (port 3001)
npx tsx index1.ts

# Terminal 2 — Frontend (Vite dev server, port 5173)
cd multi-agent-ui && npm run dev
```

**Important**: `npm run dev` from root does nothing — there is no dev script in root `package.json`.

## Frontend Commands
All run from `multi-agent-ui/`:
- `npm run dev` — Vite dev server
- `npm run build` — TypeScript check + Vite build
- `npm run lint` — ESLint

No typecheck or test scripts exist in the root backend package.

## Key Gotchas

1. **Ngrok URL is hardcoded** in both `index.ts` and `index1.ts`. Update the `NGROK_URL` constant when the Kaggle tunnel restarts.

2. **Model name hardcoded**: `qwen35-uncensored` — used in both backend files.

3. **SSE endpoint**: `GET /api/stream-agents?prompt=<encoded>` — sends `status`, `agent1-token`, `agent2-token`, `done`, `error` events.

4. **Frontend hardcodes `localhost:3001`** — no env variable for backend URL (`src/App.tsx:17`).

5. **No tests** — `npm test` in root just echoes an error. Frontend has no test framework.

6. **TypeScript strict mode** is enabled in both packages (`strict: true` in tsconfig).

7. **ESM only** — both packages use `"type": "module"`.

## Tech Stack (verified from package.json)
- **Backend**: Express 5.x, `ollama` npm package, CORS
- **Frontend**: React 19.x, Vite 8.x, TypeScript 6.x, ESLint 10.x, lucide-react icons

## Project State
Current pipeline: User prompt → Researcher Agent (low temp, concise) → Writer Agent (higher temp, markdown output). Both agents stream via SSE tokens to the frontend.

**Planned next steps**: Markdown rendering (react-markdown), function calling, Agentic RAG, local GPU failover.