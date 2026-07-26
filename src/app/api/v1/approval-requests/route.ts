import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { authenticateApiKey } from "@/lib/api-keys";
import { prisma } from "@/lib/db";
import { redactSensitiveData } from "@/lib/redaction";
import { ingestEvent } from "@/lib/event-ingestion";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const authResult = await authenticateApiKey(authHeader);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { project } = authResult;
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { externalId, runId, agentName, toolName, arguments: rawArgs, reason, riskLevel, expiresInSeconds } = body;

    if (!externalId || typeof externalId !== "string" || !externalId.trim()) {
      return NextResponse.json({ error: "Field 'externalId' is required" }, { status: 400 });
    }
    if (!runId || typeof runId !== "string" || !runId.trim()) {
      return NextResponse.json({ error: "Field 'runId' is required" }, { status: 400 });
    }
    if (!agentName || typeof agentName !== "string" || !agentName.trim()) {
      return NextResponse.json({ error: "Field 'agentName' is required" }, { status: 400 });
    }
    if (!toolName || typeof toolName !== "string" || !toolName.trim()) {
      return NextResponse.json({ error: "Field 'toolName' is required" }, { status: 400 });
    }
    if (!reason || typeof reason !== "string" || !reason.trim()) {
      return NextResponse.json({ error: "Field 'reason' is required" }, { status: 400 });
    }

    const expirySec = typeof expiresInSeconds === "number" && expiresInSeconds > 0 ? Math.min(expiresInSeconds, 86400) : 300;

    // Confirm run belongs to project
    const run = await prisma.run.findUnique({
      where: {
        projectId_externalId: {
          projectId: project.id,
          externalId: runId,
        },
      },
    });

    if (!run) {
      return NextResponse.json({ error: `Run '${runId}' not found for project` }, { status: 400 });
    }

    // Check duplicate
    const existing = await prisma.approvalRequest.findUnique({
      where: {
        projectId_externalId: {
          projectId: project.id,
          externalId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { accepted: true, duplicate: true, approvalRequest: existing },
        { status: 200 }
      );
    }

    const redactedArgs = redactSensitiveData(rawArgs || {});
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expirySec * 1000);

    const approvalRequest = await prisma.approvalRequest.create({
      data: {
        projectId: project.id,
        runId: run.id,
        externalId,
        agentName,
        toolName,
        arguments: redactedArgs as Prisma.InputJsonValue,
        reason,
        riskLevel: riskLevel || "medium",
        status: "PENDING",
        requestedAt: now,
        expiresAt,
      },
    });

    // Emit approval.requested event into run timeline
    await ingestEvent(
      project.id,
      {
        specVersion: "1.0",
        eventId: `evt_appr_req_${externalId}`,
        eventType: "approval.requested",
        occurredAt: now.toISOString(),
        agentKey: agentName,
        runId: runId,
        payload: {
          approvalId: externalId,
          toolName,
          reason,
          riskLevel: riskLevel || "medium",
          context: redactedArgs as Record<string, unknown>,
        },
      }
    ).catch(() => {});

    return NextResponse.json(
      { accepted: true, duplicate: false, approvalRequest },
      { status: 201 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
