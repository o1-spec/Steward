import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { authenticateApiKey } from "@/lib/api-keys";
import { prisma } from "@/lib/db";
import { redactSensitiveData } from "@/lib/redaction";
import { ingestEvent } from "@/lib/event-ingestion";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string; commandId: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization");
    const authResult = await authenticateApiKey(authHeader);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { project } = authResult;
    const { runId: externalRunId, commandId } = await params;

    const run = await prisma.run.findUnique({
      where: {
        projectId_externalId: {
          projectId: project.id,
          externalId: externalRunId,
        },
      },
    });

    if (!run) {
      return NextResponse.json({ error: "Run not found for project" }, { status: 404 });
    }

    const command = await prisma.runCommand.findFirst({
      where: {
        projectId: project.id,
        runId: run.id,
        OR: [{ id: commandId }, { externalId: commandId }],
      },
    });

    if (!command) {
      return NextResponse.json({ error: "Command not found" }, { status: 404 });
    }

    // Idempotent check
    if (command.status === "FAILED") {
      return NextResponse.json({ success: true, duplicate: true, command });
    }

    if (!["PENDING", "ACKNOWLEDGED"].includes(command.status)) {
      return NextResponse.json(
        { error: `Cannot fail command with status '${command.status}'` },
        { status: 409 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const redactedError = body.error ? redactSensitiveData(body.error) : null;
    const now = new Date();

    // Revert controlState to last confirmed state
    const revertedControlState = command.type === "RESUME" ? "PAUSED" : "ACTIVE";

    const [updatedCommand] = await prisma.$transaction([
      prisma.runCommand.update({
        where: { id: command.id },
        data: {
          status: "FAILED",
          failedAt: now,
          error: redactedError as Prisma.InputJsonValue,
        },
      }),
      prisma.run.update({
        where: { id: run.id },
        data: { controlState: revertedControlState },
      }),
    ]);

    // Emit command.failed timeline event
    await ingestEvent(
      project.id,
      {
        specVersion: "1.0",
        eventId: `evt_cmd_fail_${command.externalId}`,
        eventType: "command.failed",
        occurredAt: now.toISOString(),
        agentKey: run.agentName,
        runId: run.externalId,
        payload: {
          commandId: command.externalId,
          commandType: command.type,
          error: (redactedError as Record<string, unknown>) || undefined,
          message: body.error?.message || "Command execution failed in agent SDK",
        },
      }
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      duplicate: false,
      command: updatedCommand,
      runControlState: revertedControlState,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
