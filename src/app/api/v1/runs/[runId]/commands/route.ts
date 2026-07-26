import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ingestEvent } from "@/lib/event-ingestion";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    // 1. Dashboard Auth Check: Agent API keys are strictly forbidden from issuing commands
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer stwd_live_")) {
      return NextResponse.json(
        { error: "Agent API keys cannot issue control commands. Use dashboard authorization." },
        { status: 403 }
      );
    }

    const { runId } = await params;
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { type, reason, requestedBy } = body;

    if (!type || !["PAUSE", "RESUME", "CANCEL"].includes(type.toUpperCase())) {
      return NextResponse.json(
        { error: "Field 'type' must be one of: PAUSE, RESUME, CANCEL" },
        { status: 400 }
      );
    }

    const commandType = type.toUpperCase() as "PAUSE" | "RESUME" | "CANCEL";

    // 2. Fetch run by id or externalId
    const run = await prisma.run.findFirst({
      where: {
        OR: [{ id: runId }, { externalId: runId }],
      },
      include: {
        project: true,
      },
    });

    if (!run) {
      return NextResponse.json({ error: `Run '${runId}' not found` }, { status: 404 });
    }

    // 3. Reject commands on terminal runs
    if (["COMPLETED", "FAILED", "CANCELLED"].includes(run.status.toUpperCase())) {
      return NextResponse.json(
        { error: `Cannot issue commands on a terminal run with status '${run.status}'` },
        { status: 409 }
      );
    }

    const currentControlState = (run.controlState || "ACTIVE").toUpperCase();

    // 4. Validate transition against control state
    let targetControlState: string;

    if (commandType === "PAUSE") {
      if (currentControlState !== "ACTIVE") {
        return NextResponse.json(
          { error: `Cannot request PAUSE when run control state is '${currentControlState}'` },
          { status: 409 }
        );
      }
      targetControlState = "PAUSE_REQUESTED";
    } else if (commandType === "RESUME") {
      if (currentControlState !== "PAUSED") {
        return NextResponse.json(
          { error: `Cannot request RESUME when run control state is '${currentControlState}'` },
          { status: 409 }
        );
      }
      targetControlState = "RESUME_REQUESTED";
    } else if (commandType === "CANCEL") {
      if (["CANCEL_REQUESTED", "CANCELLED"].includes(currentControlState)) {
        return NextResponse.json(
          { error: "Run cancellation is already requested or in progress" },
          { status: 409 }
        );
      }
      targetControlState = "CANCEL_REQUESTED";
    } else {
      return NextResponse.json({ error: "Unsupported command type" }, { status: 400 });
    }

    // 5. Check for unresolved command of the same type
    const unresolvedSameType = await prisma.runCommand.findFirst({
      where: {
        runId: run.id,
        type: commandType,
        status: { in: ["PENDING", "ACKNOWLEDGED"] },
      },
    });

    if (unresolvedSameType) {
      return NextResponse.json(
        { error: `A ${commandType} command is already unresolved for this run` },
        { status: 409 }
      );
    }

    const externalCmdId = `cmd_${commandType.toLowerCase()}_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
    const now = new Date();

    // 6. Execute atomic creation & control state update
    const [commandRecord] = await prisma.$transaction([
      prisma.runCommand.create({
        data: {
          projectId: run.projectId,
          runId: run.id,
          externalId: externalCmdId,
          type: commandType,
          status: "PENDING",
          requestedAt: now,
          requestedBy: requestedBy || "human_dashboard",
          reason: reason || null,
        },
      }),
      prisma.run.update({
        where: { id: run.id },
        data: { controlState: targetControlState },
      }),
    ]);

    // 7. Emit timeline event
    await ingestEvent(
      run.projectId,
      {
        specVersion: "1.0",
        eventId: `evt_${externalCmdId}`,
        eventType: "command.requested",
        occurredAt: now.toISOString(),
        agentKey: run.agentName,
        runId: run.externalId,
        payload: {
          commandId: externalCmdId,
          commandType,
          requestedBy: requestedBy || "human_dashboard",
          reason: reason || undefined,
        },
      }
    ).catch(() => {});

    return NextResponse.json(
      {
        accepted: true,
        command: {
          id: commandRecord.id,
          externalId: commandRecord.externalId,
          type: commandRecord.type,
          status: commandRecord.status,
          requestedAt: commandRecord.requestedAt,
          requestedBy: commandRecord.requestedBy,
          reason: commandRecord.reason,
        },
        runControlState: targetControlState,
      },
      { status: 202 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
