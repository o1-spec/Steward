import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api-keys";
import { prisma } from "@/lib/db";
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
    if (command.status === "ACKNOWLEDGED") {
      return NextResponse.json({ success: true, duplicate: true, command });
    }

    if (command.status !== "PENDING") {
      return NextResponse.json(
        { error: `Cannot acknowledge command with status '${command.status}'` },
        { status: 409 }
      );
    }

    const now = new Date();
    const updated = await prisma.runCommand.update({
      where: { id: command.id },
      data: {
        status: "ACKNOWLEDGED",
        acknowledgedAt: now,
      },
    });

    // Emit command.acknowledged timeline event
    await ingestEvent(
      project.id,
      {
        specVersion: "1.0",
        eventId: `evt_cmd_ack_${command.externalId}`,
        eventType: "command.acknowledged",
        occurredAt: now.toISOString(),
        agentKey: run.agentName,
        runId: run.externalId,
        payload: {
          commandId: command.externalId,
          status: "ACKNOWLEDGED",
          message: `Agent acknowledged ${command.type} command`,
        },
      }
    ).catch(() => {});

    return NextResponse.json({ success: true, duplicate: false, command: updated });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
