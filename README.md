# Steward

Steward is a human-supervision workspace for autonomous AI agents. It provides real-time telemetry timelines, human approval gates, cooperative run controls, multi-tenant project isolation, and secure API key management.

---

## 5-Minute Quick Start Guide

### 1. Environment Configuration

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://postgres@localhost:5439/steward"
```

### 2. Database Sync & Seed

```bash
# Apply Prisma schema to PostgreSQL
npx prisma db push

# (Optional) Create development user (dev@steward.dev) and demo project
npm run db:seed
```

### 3. Run Development Server

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## Authentication & Project Management

### Account & Project Setup
1. **Register**: Go to `/register` to create an account. Passwords are securely hashed using `bcryptjs` (salt rounds: 10). Session tokens are stored in HTTP-only cookies (`stwd_session`).
2. **Create Project**: Complete the onboarding flow (`/onboarding`) or click **+ Create New Project** in the sidebar. The creating user is automatically assigned the `OWNER` role.
3. **Generate API Key**: Go to `/projects/:projectId/settings/api-keys` and click **Create New API Key**.
   - Format: `stwd_live_<24-bytes-hex>`
   - **Important**: The complete secret key is displayed **EXACTLY ONCE**. Steward stores only a SHA-256 hash (`keyHash`).

---

## SDK Integration Example

Install `@steward/sdk` in your Node.js agent package:

```bash
npm install @steward/sdk
```

Initialize Steward and connect your agent:

```typescript
import { Steward } from "@steward/sdk";

const steward = new Steward({
  apiKey: process.env.STEWARD_API_KEY!,
  baseUrl: process.env.STEWARD_API_URL || "http://localhost:3000",
  agentName: "research-assistant",
});

const run = steward.startRun();
await run.started({ task: "Analyze infrastructure configuration" });

const agent = run.agent({ name: "guarded-worker" });

// Start command listener for human pause, resume, and cancel
run.startCommandListener({
  onPause: async (cmd) => {
    console.log("⏸️ Paused by human operator:", cmd.reason);
  },
  onResume: async (cmd) => {
    console.log("▶️ Resumed by human operator:", cmd.reason);
  },
  onCancel: async (cmd) => {
    console.log("🛑 Cancelled by human operator:", cmd.reason);
  },
});

// Cooperative Checkpoint: execution pauses if PAUSED, throws StewardRunCancelledError if CANCELLED
await run.checkpoint();

// Model call instrumentation
const result = await agent.modelCall(
  { provider: "google", model: "gemini-2.5-flash", inputSummary: "Evaluate cost" },
  async (info) => {
    info?.recordOutput({ inputTokens: 200, outputTokens: 50, costUsd: 0.001 });
    return "Hypothesis ready";
  }
);

// Human Approval Gate
const approval = await agent.guardedToolCall(
  {
    toolName: "deploy.prod",
    arguments: { service: "auth-api", image: "v2.1.0" },
    reason: "Deploy updated auth microservice to production",
    riskLevel: "high",
  },
  async () => {
    console.log("Execution approved by human!");
    return { deployed: true };
  }
);

await run.completed({ result: "Pipeline completed successfully" });
```

---

## API Key Security & Revocation

- **SHA-256 Key Hashing**: Only SHA-256 hashes are stored in the database. Complete keys cannot be retrieved by database queries or API endpoints.
- **Throttled Usage Writes**: `lastUsedAt` timestamps are updated with a 60-second write throttle strategy to eliminate database write contention during high-frequency heartbeat and telemetry ingestion.
- **Immediate Revocation**: An `OWNER` can revoke any API key at `/projects/:projectId/settings/api-keys`. Revoked keys immediately stop authenticating with `HTTP 401 Unauthorized`.
- **Project Isolation**: Every agent API key belongs strictly to a single project. All incoming agent telemetry, approvals, and commands derive project identity exclusively from the authenticated API key.

---

## Testing & Verification

```bash
# Run Vitest test suite (104 tests)
npm test

# Run TypeScript type check
npm run typecheck

# Run ESLint
npm run lint

# Build SDK package
npm run build:sdk

# Build Next.js production app
npm run build
```
