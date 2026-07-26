import crypto from "node:crypto";

const API_URL = process.env.STEWARD_API_URL || "http://localhost:3000";
const API_KEY = process.env.STEWARD_API_KEY;

if (!API_KEY) {
  console.error("Error: STEWARD_API_KEY environment variable is required.");
  console.error("Run 'npm run db:seed' to create a demo key, then run:");
  console.error("STEWARD_API_KEY=<your-key> npx tsx scripts/demo-agent.ts");
  process.exit(1);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function sendEvent(event: Record<string, unknown>) {
  const endpoint = `${API_URL}/api/v1/events`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(event),
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }

  console.log(
    `[${res.status}] Sent ${event.eventType} (seq: ${event.sequence}) ->`,
    json
  );

  if (!res.ok) {
    console.error("Failed to ingest event:", json);
  }
}

async function runDemo() {
  const runId = `run_demo_${Date.now().toString().slice(-6)}`;
  const agentKey = "assistant_demo_agent";
  console.log(`Starting live demo agent run: ${runId}`);
  console.log(`Targeting: ${API_URL}/api/v1/events\n`);

  let sequence = 1;

  // 1. run.started
  await sendEvent({
    specVersion: "1.0",
    eventId: `evt_${crypto.randomBytes(8).toString("hex")}`,
    eventType: "run.started",
    occurredAt: new Date().toISOString(),
    agentKey,
    runId,
    sequence: sequence++,
    payload: {
      task: "Analyze repository codebase & run automated diagnostic sweep",
      parameters: { mode: "autonomous", maxSteps: 5 },
    },
  });
  await sleep(1500);

  // 2. step.started
  const step1Id = `step_01_${crypto.randomBytes(4).toString("hex")}`;
  await sendEvent({
    specVersion: "1.0",
    eventId: `evt_${crypto.randomBytes(8).toString("hex")}`,
    eventType: "step.started",
    occurredAt: new Date().toISOString(),
    agentKey,
    runId,
    stepId: step1Id,
    sequence: sequence++,
    payload: {
      name: "Scan Project Files & Dependencies",
      input: { path: "/src" },
    },
  });
  await sleep(1500);

  // 3. tool.started
  await sendEvent({
    specVersion: "1.0",
    eventId: `evt_${crypto.randomBytes(8).toString("hex")}`,
    eventType: "tool.started",
    occurredAt: new Date().toISOString(),
    agentKey,
    runId,
    stepId: step1Id,
    sequence: sequence++,
    payload: {
      toolName: "list_dir",
      arguments: { path: "src/lib/protocol" },
    },
  });
  await sleep(1500);

  // 4. tool.succeeded
  await sendEvent({
    specVersion: "1.0",
    eventId: `evt_${crypto.randomBytes(8).toString("hex")}`,
    eventType: "tool.succeeded",
    occurredAt: new Date().toISOString(),
    agentKey,
    runId,
    stepId: step1Id,
    sequence: sequence++,
    payload: {
      toolName: "list_dir",
      result: {
        files: [
          "event-types.ts",
          "event-envelope.ts",
          "payload-schemas.ts",
          "validation.ts",
          "protocol-errors.ts",
          "index.ts",
        ],
        totalCount: 6,
      },
    },
  });
  await sleep(1500);

  // 5. step.completed
  await sendEvent({
    specVersion: "1.0",
    eventId: `evt_${crypto.randomBytes(8).toString("hex")}`,
    eventType: "step.completed",
    occurredAt: new Date().toISOString(),
    agentKey,
    runId,
    stepId: step1Id,
    sequence: sequence++,
    payload: {
      summary: "Found 6 core protocol files in src/lib/protocol.",
      output: { status: "success" },
    },
  });
  await sleep(1500);

  // 6. tool.requested (Command execution with sensitive field to test redaction)
  await sendEvent({
    specVersion: "1.0",
    eventId: `evt_${crypto.randomBytes(8).toString("hex")}`,
    eventType: "tool.requested",
    occurredAt: new Date().toISOString(),
    agentKey,
    runId,
    sequence: sequence++,
    payload: {
      toolName: "execute_command",
      arguments: {
        command: "npm test",
        apiKey: "secret_live_12345_should_be_redacted",
      },
    },
  });
  await sleep(1500);

  // 7. tool.succeeded
  await sendEvent({
    specVersion: "1.0",
    eventId: `evt_${crypto.randomBytes(8).toString("hex")}`,
    eventType: "tool.succeeded",
    occurredAt: new Date().toISOString(),
    agentKey,
    runId,
    sequence: sequence++,
    payload: {
      toolName: "execute_command",
      result: {
        exitCode: 0,
        testsPassed: 41,
        durationMs: 1250,
        costUsd: 0.0035,
        tokens: 1840,
      },
    },
  });
  await sleep(1500);

  // 8. run.completed
  await sendEvent({
    specVersion: "1.0",
    eventId: `evt_${crypto.randomBytes(8).toString("hex")}`,
    eventType: "run.completed",
    occurredAt: new Date().toISOString(),
    agentKey,
    runId,
    sequence: sequence++,
    payload: {
      summary: "All diagnostic tests passed successfully without errors.",
      result: { ok: true, coverage: "100%" },
    },
  });

  console.log(`\nDemo completed successfully for run: ${runId}`);
}

runDemo().catch(console.error);
