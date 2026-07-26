import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ingestEvent } from "@/lib/event-ingestion";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Security check: Agent API keys cannot make human decisions
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.toLowerCase().startsWith("bearer stwd_live_")) {
      return NextResponse.json(
        { error: "Agent API keys are strictly forbidden from deciding approval requests." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { decision, reason, decidedBy = "human_supervisor" } = body;

    if (decision !== "APPROVED" && decision !== "REJECTED") {
      return NextResponse.json(
        { error: "Field 'decision' must be either 'APPROVED' or 'REJECTED'" },
        { status: 400 }
      );
    }

    // Find approval request by DB id or externalId
    const approvalRequest = await prisma.approvalRequest.findFirst({
      where: {
        OR: [{ id }, { externalId: id }],
      },
      include: {
        run: true,
      },
    });

    if (!approvalRequest) {
      return NextResponse.json({ error: "Approval request not found" }, { status: 404 });
    }

    const now = new Date();

    // Check if expired prior to decision
    if (approvalRequest.status === "PENDING" && now > approvalRequest.expiresAt) {
      await prisma.approvalRequest.update({
        where: { id: approvalRequest.id },
        data: { status: "EXPIRED" },
      });

      await prisma.auditLog.create({
        data: {
          projectId: approvalRequest.projectId,
          approvalRequestId: approvalRequest.id,
          action: `DECISION_${decision}`,
          outcome: "CONFLICT_EXPIRED",
          actor: decidedBy,
          reason: reason || null,
        },
      });

      return NextResponse.json(
        { error: "Approval request has already expired" },
        { status: 409 }
      );
    }

    // Atomic update
    const result = await prisma.approvalRequest.updateMany({
      where: {
        id: approvalRequest.id,
        status: "PENDING",
        expiresAt: { gte: now },
      },
      data: {
        status: decision,
        decidedAt: now,
        decidedBy,
        decisionReason: reason || null,
      },
    });

    // Record audit entry
    await prisma.auditLog.create({
      data: {
        projectId: approvalRequest.projectId,
        approvalRequestId: approvalRequest.id,
        action: `DECISION_${decision}`,
        outcome: result.count > 0 ? "SUCCESS" : "CONFLICT",
        actor: decidedBy,
        reason: reason || null,
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Approval request is no longer pending" },
        { status: 409 }
      );
    }

    const updated = await prisma.approvalRequest.findUnique({
      where: { id: approvalRequest.id },
    });

    // Emit event into run timeline
    const eventType = decision === "APPROVED" ? "approval.approved" : "approval.rejected";
    if (approvalRequest.run) {
      await ingestEvent(
        approvalRequest.projectId,
        {
          specVersion: "1.0",
          eventId: `evt_appr_dec_${decision.toLowerCase()}_${approvalRequest.externalId}`,
          eventType,
          occurredAt: now.toISOString(),
          agentKey: approvalRequest.agentName,
          runId: approvalRequest.run.externalId,
          payload: {
            approvalId: approvalRequest.externalId,
            decidedBy,
            reason: reason || undefined,
          },
        }
      ).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      decision,
      approvalRequest: updated,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
