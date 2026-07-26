import { Steward, StewardRunCancelledError } from "@steward/sdk";

const apiKey = process.env.STEWARD_API_KEY;
const baseUrl = process.env.STEWARD_API_URL || "http://localhost:3000";
const projectId = process.env.STEWARD_PROJECT_ID;

if (!apiKey) {
  console.error("Error: STEWARD_API_KEY environment variable is required.");
  console.error("Please run 'npm run db:seed' to get a key, then run:");
  console.error("STEWARD_API_KEY=<your-key> npm run start");
  process.exit(1);
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function main() {
  console.log("Initializing Steward SDK...");

  const steward = new Steward({
    apiKey: apiKey!,
    baseUrl,
    projectId,
    agentName: "research-assistant-node",
    debug: true,
  });

  const run = steward.startRun({
    name: "Cooperative Control Multi-Task Run",
    input: { query: "Autonomous agent control & supervision" },
  });

  console.log(`[Steward SDK] Started run: ${run.runId}`);
  await run.started({ task: "Execute cooperative multi-task research pipeline" });
  await sleep(500);

  // Initialize command listener for cooperative human controls
  run.startCommandListener({
    pollIntervalMs: 1500,
    onPause: async (cmd) => {
      console.log(`[Example Agent] ⏸️ Received PAUSE command (${cmd.externalId}): ${cmd.reason || "Paused by operator"}`);
    },
    onResume: async (cmd) => {
      console.log(`[Example Agent] ▶️ Received RESUME command (${cmd.externalId}): ${cmd.reason || "Resumed by operator"}`);
    },
    onCancel: async (cmd) => {
      console.log(`[Example Agent] 🛑 Received CANCEL command (${cmd.externalId}): ${cmd.reason || "Cancelled by operator"}`);
    },
  });

  const agent = run.agent({
    name: "research-agent",
    metadata: { version: "1.3.0" },
  });

  await agent.started({ input: { topic: "Cooperative Agent Control Gates" } });

  const tasks = [
    { id: 1, name: "Analyze agent telemetry protocol", tool: "telemetry.analyze" },
    { id: 2, name: "Verify model token cost optimization", tool: "cost.calculate" },
    { id: 3, name: "Synchronize event timeline checkpoints", tool: "sync.timeline" },
  ];

  try {
    for (const taskItem of tasks) {
      console.log(`\n[Example Agent] --- Starting Task ${taskItem.id}: ${taskItem.name} ---`);
      
      // Cooperative Checkpoint 1: Check if run was paused or cancelled before starting model call
      await run.checkpoint();

      console.log(`[Example Agent] Task ${taskItem.id}: Executing model call...`);
      const modelResponse = await agent.modelCall(
        {
          provider: "openai",
          model: "gpt-4o",
          inputSummary: `Evaluate ${taskItem.name}`,
        },
        async (info) => {
          await sleep(3000);
          info?.recordOutput({
            inputTokens: 250,
            outputTokens: 90,
            totalTokens: 340,
            costUsd: 0.002,
            outputSummary: `Hypothesis ready for task ${taskItem.id}`,
          });
          return `Hypothesis for task ${taskItem.id}: Optimal telemetry streaming achieved.`;
        }
      );
      console.log(`[Example Agent] Model response: ${modelResponse}`);

      // Cooperative Checkpoint 2: Check if run was paused or cancelled before starting tool call
      await run.checkpoint();

      console.log(`[Example Agent] Task ${taskItem.id}: Executing tool call...`);
      const toolResult = await agent.toolCall(
        {
          toolName: taskItem.tool,
          arguments: { taskId: taskItem.id, tokenSecret: "secret_123_redact" },
        },
        async () => {
          await sleep(2500);
          return { status: "success", taskId: taskItem.id, resultData: "Telemetry synced" };
        }
      );
      console.log(`[Example Agent] Task ${taskItem.id} tool result:`, toolResult);
      await sleep(1000);
    }

    // Complete agent & run when no cancellation occurs
    await agent.completed({
      summary: "Agent completed all 3 tasks with model calls, tool calls, and cooperative checkpoints",
      output: { status: "success", completedTasks: tasks.length },
    });

    await run.completed({
      summary: "Run completed successfully",
      output: { runId: run.runId, status: "completed" },
    });

    console.log(`\n[Example Agent] Run finished cleanly! Open ${baseUrl}/runs to view the timeline.`);
  } catch (err: unknown) {
    if (err instanceof StewardRunCancelledError) {
      console.log(`\n[Example Agent] 🛑 Run was CANCELLED via cooperative control: ${err.message}`);
      console.log("[Example Agent] Aborting remaining pipeline tasks cleanly.");
    } else {
      console.error("[Example Agent] Run failed with unexpected error:", err);
      await agent.failed({ error: err as Error });
      await run.failed({ error: err as Error });
    }
  } finally {
    run.stopCommandListener();
  }
}

main().catch((err) => {
  console.error("Agent main execution crashed:", err);
  process.exit(1);
});
