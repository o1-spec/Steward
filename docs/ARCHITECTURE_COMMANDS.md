# Steward V1 Cooperative Agent Control Architecture

This document describes the design, protocols, and developer guidelines for **Cooperative Agent Controls** in Steward V1.

---

## 1. How Commands Travel Between Steward and an Agent

Commands follow an explicit, asynchronous polling protocol between the Steward dashboard, database, and the Node.js Agent SDK:

```
[ Dashboard Operator ] 
       │ 
       │ 1. POST /api/v1/runs/:runId/commands (PAUSE | RESUME | CANCEL)
       ▼
[ Steward API Server ] ──► Updates Run.controlState (e.g. PAUSE_REQUESTED) & stores RunCommand (PENDING)
       │ 
       │ 2. GET /api/v1/runs/:externalRunId/commands/pending (SDK Bounded Polling)
       ▼
[ Node.js Agent SDK ] 
       │ 
       ├──► 3. POST /api/v1/runs/:externalRunId/commands/:id/acknowledge
       ├──► 4. Executes onPause / onResume / onCancel Handler & Updates Local Control State
       └──► 5. POST /api/v1/runs/:externalRunId/commands/:id/complete
```

1. **Human Request**: A human operator issues a command (`PAUSE`, `RESUME`, or `CANCEL`) from the dashboard.
2. **Dashboard Ingestion**: The server validates state transitions, stores an immutable `RunCommand` record, updates `run.controlState` (e.g., `PAUSE_REQUESTED`), and emits a `command.requested` timeline event.
3. **SDK Listener Polling**: The SDK's `run.startCommandListener()` periodically queries `/api/v1/runs/:externalRunId/commands/pending`.
4. **Acknowledgment**: The SDK acknowledges the command immediately (`POST .../acknowledge`), setting status to `ACKNOWLEDGED`.
5. **Execution & Checkpoint Gate**: The SDK invokes registered command callbacks (`onPause`, `onResume`, `onCancel`) and changes local control state (`PAUSED`, `ACTIVE`, `CANCELLED`).
6. **Completion**: The SDK posts completion status (`POST .../complete`), and the server updates the confirmed run control state (`PAUSED`, `ACTIVE`, or `CANCELLED`).

---

## 2. Why Control is Cooperative

Steward does **NOT** forcibly kill operating system processes, container pods, or arbitrary thread loops. In distributed AI agent architectures, hard process termination risks data corruption, unreleased database locks, dangling API transactions, and orphaned cloud resources.

Instead, control in Steward is **cooperative**:
- The agent SDK periodically evaluates control checkpoints (`await run.checkpoint()`).
- When a `PAUSE` command is confirmed, the SDK holds execution at the next cooperative checkpoint without busy-spinning.
- When a `CANCEL` command is confirmed, the SDK releases waiting checkpoints by throwing a `StewardRunCancelledError`, aborts pending SDK network requests via `AbortController`, and prevents subsequent model or tool calls.

---

## 3. Where to Place Checkpoints

Developers should place `await run.checkpoint();` between meaningful steps in their agent's workflow:
- At the start of every iteration in a multi-step task loop.
- Immediately before invoking an LLM model call (`agent.modelCall`).
- Immediately before executing a tool call (`agent.toolCall`) or guarded action (`agent.guardedToolCall`).
- After completing long-running data processing operations.

### Example:

```typescript
for (const task of tasks) {
  // Checkpoint 1: Pause or abort before model inference
  await run.checkpoint();
  const hypothesis = await agent.modelCall(...);

  // Checkpoint 2: Pause or abort before executing external tool
  await run.checkpoint();
  const result = await agent.toolCall(...);
}
```

---

## 4. Pause and Resume Handling

- **PAUSE**:
  - `run.getControlState()` becomes `PAUSED`.
  - Future `await run.checkpoint()` calls pause execution by waiting on an internal Promise.
  - In-flight synchronous code or external HTTP requests complete normally before reaching the next checkpoint.
- **RESUME**:
  - `run.getControlState()` becomes `ACTIVE`.
  - All waiting `await run.checkpoint()` Promises resolve immediately.
  - Agent execution continues seamlessly.

---

## 5. Cancellation Handling

When a `CANCEL` command is processed by the SDK:
1. The local run state transitions to `cancelled`.
2. The SDK's `AbortController` triggers, aborting active SDK HTTP requests.
3. All waiting `await run.checkpoint()` Promises reject with `StewardRunCancelledError`.
4. Subsequent calls to `agent.modelCall`, `agent.toolCall`, or `agent.requestApproval` throw `StewardRunCancelledError`.
5. Guarded tool callbacks that have not yet started are prevented from executing.
6. The command listener stops polling automatically.

---

## 6. Offline Agent & Expiration Behavior

If a human operator issues a command while an agent is offline or disconnected:
- The dashboard displays **"Waiting for agent acknowledgement..."** along with a live elapsed time counter.
- Steward does **not** falsely claim the agent has paused or cancelled.
- **Lazy Expiration**: If a command remains unacknowledged past the expiration cutoff (default 5 minutes), reads to `/pending` or `/approvals` transition the command status to `EXPIRED`, emit `command.expired`, and return the run's control state to its last confirmed value (`ACTIVE` or `PAUSED`).

---

## 7. Limitations & Explicit Scope Boundaries

- **In-flight Third-Party Operations**: Steward cannot interrupt synchronous JavaScript code currently executing on the main thread or third-party C/native bindings already running outside the SDK wrapper.
- **No System Process Termination**: Steward does not issue `SIGKILL`/`SIGTERM` to operating system processes, Docker containers, or Kubernetes pods.
- **Cooperative Enforcement**: Commands take effect when the agent reaches a cooperative checkpoint (`await run.checkpoint()`) or makes an SDK API invocation.
