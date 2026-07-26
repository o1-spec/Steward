import { Steward } from "@steward/sdk";

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
    name: "Automated Research & Analysis Run",
    input: { query: "Autonomous agent observability" },
  });

  console.log(`[Steward SDK] Started run: ${run.runId}`);
  await run.started({ task: "Execute comprehensive research pipeline" });
  await sleep(1000);

  const agent = run.agent({
    name: "research-agent",
    metadata: { version: "1.2.0" },
  });

  await agent.started({ input: { topic: "Agent telemetry" } });
  await sleep(1000);

  // 1. Perform simulated model call
  console.log("[Example Agent] Executing model call...");
  const modelResult = await agent.modelCall(
    {
      provider: "openai",
      model: "gpt-4o",
      inputSummary: "Generate research hypothesis for telemetry",
    },
    async (info) => {
      await sleep(1200);
      info?.recordOutput({
        inputTokens: 350,
        outputTokens: 120,
        totalTokens: 470,
        costUsd: 0.0028,
        outputSummary: "Hypothesis generated for structured event streaming",
      });
      return "Hypothesis: Real-time event streaming improves agent oversight by 85%";
    }
  );
  console.log(`[Example Agent] Model response: ${modelResult}`);
  await sleep(1000);

  // 2. Perform successful tool call with sensitive token to demonstrate redaction
  console.log("[Example Agent] Executing successful tool call...");
  const searchResult = await agent.toolCall(
    {
      toolName: "web.search",
      arguments: {
        query: "steward supervision platform",
        apiKey: "secret_live_key_should_be_redacted",
      },
    },
    async () => {
      await sleep(800);
      return { resultsCount: 4, topResult: "Steward V1 Event Protocol Documentation" };
    }
  );
  console.log("[Example Agent] Tool result:", searchResult);
  await sleep(1000);

  // 3. Perform Guarded Tool Call requiring Human Approval
  console.log("\n[Example Agent] Requesting human approval for high-risk action...");
  console.log(`[Example Agent] ⏳ Agent is PAUSED waiting for decision at ${baseUrl}/approvals ...`);

  try {
    const publishResult = await agent.guardedToolCall(
      {
        toolName: "github.publishReleaseReport",
        arguments: {
          repository: "o1-spec/Steward",
          version: "v1.0.0-rc1",
          secretToken: "ghp_super_secret_token_12345",
        },
        reason: "Publish automated release notes report to GitHub",
        riskLevel: "high",
        timeoutMs: 120000,
      },
      async () => {
        console.log("[Example Agent] ✅ Human APPROVED the action! Executing tool callback...");
        await sleep(500);
        return { published: true, releaseUrl: "https://github.com/o1-spec/Steward/releases/v1.0.0-rc1" };
      }
    );
    console.log("[Example Agent] Guarded tool execution result:", publishResult);
  } catch (err: unknown) {
    console.log(`[Example Agent] 🛑 Guarded tool call did NOT execute: ${(err as Error).message}`);
  }
  await sleep(1000);

  // 4. Complete agent & run
  await agent.completed({
    summary: "Agent completed pipeline with model calls, tool calls, and approval gates",
    output: { status: "success", hypothesis: modelResult },
  });

  await run.completed({
    summary: "Run completed successfully",
    output: { runId: run.runId, status: "completed" },
  });

  console.log(`\n[Example Agent] Run finished! Open ${baseUrl}/runs to view the timeline.`);
}

main().catch((err) => {
  console.error("Agent execution failed:", err);
  process.exit(1);
});
