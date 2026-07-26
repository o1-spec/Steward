import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api-keys";
import { prisma } from "@/lib/db";
import { ingestEvent } from "@/lib/event-ingestion";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization");
    const authResult = await authenticateApiKey(authHeader);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { project } = authResult;
    const { runId: externalRunId } = await params;

    const run = await prisma.run.findUnique({
      where: {
        projectId_externalId: {
          projectId: project.id,
          externalId: externalRunId,
        },
      },
    });

    if (!run) {
      return NextResponse.json({ error: "Run not found for authenticated project" }, { status: 404 });
    }

    const now = new Date();
    const expiryCutoff = new Date(now.getTime() - 300000); // 5 minutes default timeout

    // Lazy expiration check for commands past expiry cutoff
    const expiredCommands = await prisma.runCommand.findMany({
      where: {
        runId: run.id,
        status: "PENDING",
        requestedAt: { lt: expiryCutoff },
      },
    });

    for (const cmd of expiredCommands) {
      await prisma.runCommand.update({
        where: { id: cmd.id },
        data: { status: "EXPIRED" },
      });

      // Revert run control state to last confirmed state
      const revertedState = cmd.type === "RESUME" ? "PAUSED" : "ACTIVE";
      await prisma.run.update({
        where: { id: run.id },
        data: { controlState: revertedState },
      });

      // Emit command.expired timeline event
      await ingestEvent(
        project.id,
        {
          specVersion: "1.0",
          eventId: `evt_cmd_exp_${cmd.externalId}`,
          eventType: "command.expired",
          occurredAt: now.toISOString(),
          agentKey: run.agentName,
          runId: run.externalId,
          payload: {
            commandId: cmd.externalId,
            commandType: cmd.type,
            reason: `Command unacknowledged after 5 minutes`,
          },
        }
      ).catch(() => {});
    }

    // Fetch remaining active unresolved commands
    const pendingCommands = await prisma.runCommand.findMany({
      where: {
        runId: run.id,
        status: { in: ["PENDING", "ACKNOWLEDGED"] },
      },
      orderBy: {
        requestedAt: "asc",
      },
    });

    return NextResponse.json({
      commands: pendingCommands.map((cmd) => ({
        id: cmd.id,
        commandId: cmd.externalId,
        externalId: cmd.externalId,
        type: cmd.type,
        status: cmd.status,
        requestedAt: cmd.requestedAt,
        reason: cmd.reason,
      })),
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
