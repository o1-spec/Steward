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
    if (command.status === "COMPLETED") {
      return NextResponse.json({ success: true, duplicate: true, command });
    }

    if (!["PENDING", "ACKNOWLEDGED"].includes(command.status)) {
      return NextResponse.json(
        { error: `Cannot complete command with status '${command.status}'` },
        { status: 409 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const redactedResult = body.result ? redactSensitiveData(body.result) : null;
    const now = new Date();

    let nextControlState = "ACTIVE";
    let isTerminal = false;

    if (command.type === "PAUSE") {
      nextControlState = "PAUSED";
    } else if (command.type === "RESUME") {
      nextControlState = "ACTIVE";
    } else if (command.type === "CANCEL") {
      nextControlState = "CANCELLED";
      isTerminal = true;
    }

    const [updatedCommand] = await prisma.$transaction([
      prisma.runCommand.update({
        where: { id: command.id },
        data: {
          status: "COMPLETED",
          completedAt: now,
          result: redactedResult as Prisma.InputJsonValue,
        },
      }),
      prisma.run.update({
        where: { id: run.id },
        data: {
          controlState: nextControlState,
          ...(isTerminal ? { status: "CANCELLED", endedAt: now } : {}),
        },
      }),
    ]);

    // Emit timeline event
    await ingestEvent(
      project.id,
      {
        specVersion: "1.0",
        eventId: `evt_cmd_cmpl_${command.externalId}`,
        eventType: "command.completed",
        occurredAt: now.toISOString(),
        agentKey: run.agentName,
        runId: run.externalId,
        payload: {
          commandId: command.externalId,
          commandType: command.type,
          result: (redactedResult as Record<string, unknown>) || undefined,
        },
      }
    ).catch(() => {});

    if (command.type === "CANCEL") {
      await ingestEvent(
        project.id,
        {
          specVersion: "1.0",
          eventId: `evt_run_cncl_${command.externalId}`,
          eventType: "run.cancelled",
          occurredAt: now.toISOString(),
          agentKey: run.agentName,
          runId: run.externalId,
          payload: {
            reason: command.reason || "Cancelled via human dashboard command",
          },
        }
      ).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      duplicate: false,
      command: updatedCommand,
      runControlState: nextControlState,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
