import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { checkProjectMembership } from "@/lib/project-auth";
import { prisma } from "@/lib/db";
import { ingestEvent } from "@/lib/event-ingestion";
import { rateLimitRequest } from "@/lib/rate-limiter";
import { recordAuditLog } from "@/lib/audit-logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    // 1. Dashboard Authorization Check: Agent API keys cannot issue control commands
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer stwd_live_")) {
      return NextResponse.json(
        { error: "Agent API keys cannot issue run control commands" },
        { status: 403 }
      );
    }

    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { runId } = await params;
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { type, reason, requestedBy } = body;
    if (!type || !["PAUSE", "RESUME", "CANCEL"].includes(type.toUpperCase())) {
      return NextResponse.json(
        { error: "Field 'type' must be PAUSE, RESUME, or CANCEL" },
        { status: 400 }
      );
    }

    const cmdType = type.toUpperCase() as "PAUSE" | "RESUME" | "CANCEL";

    // 2. Fetch target run
    const run = await prisma.run.findFirst({
      where: {
        OR: [{ id: runId }, { externalId: runId }],
      },
    });

    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    // 3. Verify user membership in project
    const authCheck = await checkProjectMembership(user.id, run.projectId);
    if (!authCheck.isMember) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    const limitCheck = await rateLimitRequest(`run_command:${user.id}`, { limit: 10, windowMs: 60000 });
    if (!limitCheck.allowed) {
      return limitCheck.response;
    }

    // 4. State transition validation
    const currentControlState = run.controlState || "ACTIVE";
    const currentStatus = run.status.toUpperCase();

    if (["COMPLETED", "FAILED", "CANCELLED"].includes(currentStatus)) {
      return NextResponse.json(
        { error: `Cannot issue commands on a run in terminal state '${currentStatus}'` },
        { status: 409 }
      );
    }

    // Duplicate command check
    const existingPending = await prisma.runCommand.findFirst({
      where: {
        runId: run.id,
        status: { in: ["PENDING", "ACKNOWLEDGED"] },
      },
    });

    if (existingPending) {
      if (existingPending.type === cmdType) {
        return NextResponse.json(
          { error: `A '${cmdType}' command is already pending for this run` },
          { status: 409 }
        );
      }
      if (cmdType !== "CANCEL") {
        return NextResponse.json(
          { error: `Cannot issue '${cmdType}' command while a '${existingPending.type}' command is pending` },
          { status: 409 }
        );
      }
    }

    if (cmdType === "PAUSE" && currentControlState !== "ACTIVE" && currentControlState !== "RESUME_REQUESTED") {
      return NextResponse.json(
        { error: `Cannot request PAUSE when run control state is '${currentControlState}'` },
        { status: 409 }
      );
    }

    if (cmdType === "RESUME" && currentControlState !== "PAUSED" && currentControlState !== "PAUSE_REQUESTED") {
      return NextResponse.json(
        { error: `Cannot request RESUME when run control state is '${currentControlState}'` },
        { status: 409 }
      );
    }

    let nextControlState = currentControlState;
    if (cmdType === "PAUSE") nextControlState = "PAUSE_REQUESTED";
    if (cmdType === "RESUME") nextControlState = "RESUME_REQUESTED";
    if (cmdType === "CANCEL") nextControlState = "CANCEL_REQUESTED";

    const now = new Date();
    const commandId = `cmd_${cmdType.toLowerCase()}_${Math.random().toString(36).substring(2, 10)}_${now.getTime()}`;
    const actorName = requestedBy ? String(requestedBy).trim() : user.email;

    const command = await prisma.$transaction(async (tx) => {
      await tx.run.update({
        where: { id: run.id },
        data: { controlState: nextControlState },
      });

      return await tx.runCommand.create({
        data: {
          projectId: run.projectId,
          runId: run.id,
          externalId: commandId,
          type: cmdType,
          status: "PENDING",
          requestedAt: now,
          requestedBy: actorName,
          reason: reason ? String(reason).trim() : null,
        },
      });
    });

    await recordAuditLog({
      projectId: run.projectId,
      actorType: "USER",
      actorId: user.id,
      actor: actorName,
      action: `RUN_COMMAND_${cmdType}`,
      targetType: "RUN",
      targetId: run.id,
      outcome: "SUCCESS",
      reason: reason || undefined,
      metadata: { commandId: command.externalId, runExternalId: run.externalId },
    });

    // Ingest event into run stream
    await ingestEvent(
      run.projectId,
      {
        specVersion: "1.0",
        eventId: `evt_cmd_req_${command.externalId}`,
        eventType: "command.requested",
        occurredAt: now.toISOString(),
        agentKey: run.agentName,
        runId: run.externalId,
        payload: {
          commandId: command.externalId,
          commandType: cmdType,
          requestedBy: actorName,
          reason: reason || undefined,
        },
      }
    ).catch(() => {});

    return NextResponse.json(
      {
        accepted: true,
        command: {
          id: command.id,
          externalId: command.externalId,
          type: command.type,
          status: command.status,
          requestedAt: command.requestedAt,
          requestedBy: command.requestedBy,
          reason: command.reason,
        },
        runControlState: nextControlState,
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
