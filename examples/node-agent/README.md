# Steward Node.js Agent Example

This example demonstrates how to instrument an autonomous Node.js agent with the `@steward/sdk` package for real-time human supervision and telemetry.

## Features Demonstrated

- **Run Lifecycle**: `steward.startRun()`, `run.started()`, `run.completed()`
- **Agent Instrumentation**: `run.agent()`, `agent.started()`, `agent.completed()`
- **AI Model Call Instrumentation**: `agent.modelCall()` with automated duration, token count, and cost tracking
- **Tool Call Instrumentation**: `agent.toolCall()` with automatic recursive sensitive data redaction
- **Graceful Error Handling**: Instrumented tool failure caught safely without crashing the agent
- **Automatic Sequence & Timestamping**: Sequence number ordering and Bearer authentication

---

## Instructions

### 1. Set Environment Variables

```bash
export STEWARD_API_KEY="stwd_live_YOUR_API_KEY_HERE"
export STEWARD_API_URL="http://localhost:3000" # optional, defaults to http://localhost:3000
```

To generate a key, run `npm run db:seed` from the project root.

### 2. Run the Example Agent

```bash
npm start
```

### 3. Observe Live Timeline

Open [http://localhost:3000/runs](http://localhost:3000/runs) in your browser to watch events appear live in chronological order.
