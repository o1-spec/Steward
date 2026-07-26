import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { checkProjectMembership } from "@/lib/project-auth";
import { prisma } from "@/lib/db";
import { ingestEvent } from "@/lib/event-ingestion";
import { rateLimitRequest } from "@/lib/rate-limiter";
import { recordAuditLog } from "@/lib/audit-logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Dashboard Auth Check: Agent API keys are strictly forbidden from deciding approvals
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer stwd_live_")) {
      return NextResponse.json(
        { error: "Agent API keys cannot make human approval decisions" },
        { status: 403 }
      );
    }

    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { decision, reason, decidedBy } = body;
    if (!decision || !["APPROVED", "REJECTED"].includes(decision.toUpperCase())) {
      return NextResponse.json(
        { error: "Field 'decision' must be APPROVED or REJECTED" },
        { status: 400 }
      );
    }

    const dec = decision.toUpperCase() as "APPROVED" | "REJECTED";

    // 2. Fetch approval request
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

    // 3. Verify user membership in project
    const authCheck = await checkProjectMembership(user.id, approvalRequest.projectId);
    if (!authCheck.isMember) {
      return NextResponse.json({ error: "Approval request not found" }, { status: 404 });
    }

    const limitCheck = await rateLimitRequest(`approval_decision:${user.id}`, { limit: 10, windowMs: 60000 });
    if (!limitCheck.allowed) {
      return limitCheck.response;
    }

    const now = new Date();

    // Check expiration or existing decision
    if (approvalRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: `Approval request is already in status '${approvalRequest.status}'` },
        { status: 409 }
      );
    }

    if (now > approvalRequest.expiresAt) {
      // Lazily transition to EXPIRED
      await prisma.approvalRequest.update({
        where: { id: approvalRequest.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json(
        { error: "Approval request has expired" },
        { status: 409 }
      );
    }

    // 4. Atomic decision update using Prisma
    const updatedCount = await prisma.approvalRequest.updateMany({
      where: {
        id: approvalRequest.id,
        status: "PENDING",
        expiresAt: { gte: now },
      },
      data: {
        status: dec,
        decidedAt: now,
        decidedBy: decidedBy ? String(decidedBy).trim() : user.email,
        decisionReason: reason ? String(reason).trim() : null,
      },
    });

    if (updatedCount.count === 0) {
      return NextResponse.json(
        { error: "Conflict: Approval request was already decided or expired" },
        { status: 409 }
      );
    }

    const updated = await prisma.approvalRequest.findUnique({
      where: { id: approvalRequest.id },
    });

    // 5. Record AuditLog entry
    await recordAuditLog({
      projectId: approvalRequest.projectId,
      approvalRequestId: approvalRequest.id,
      actorType: "USER",
      actorId: user.id,
      actor: decidedBy ? String(decidedBy).trim() : user.email,
      action: `DECISION_${dec}`,
      targetType: "APPROVAL_REQUEST",
      targetId: approvalRequest.id,
      outcome: "SUCCESS",
      reason: reason || undefined,
      metadata: {
        toolName: approvalRequest.toolName,
        runId: approvalRequest.runId,
      },
    });

    // 6. Emit timeline event
    const eventType = dec === "APPROVED" ? "approval.approved" : "approval.rejected";
    if (approvalRequest.run) {
      await ingestEvent(
        approvalRequest.projectId,
        {
          specVersion: "1.0",
          eventId: `evt_appr_dec_${dec.toLowerCase()}_${approvalRequest.externalId}`,
          eventType,
          occurredAt: now.toISOString(),
          agentKey: approvalRequest.agentName,
          runId: approvalRequest.run.externalId,
          payload: {
            approvalId: approvalRequest.externalId,
            decidedBy: decidedBy ? String(decidedBy).trim() : user.email,
            reason: reason || undefined,
          },
        }
      ).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      decision: dec,
      approvalRequest: updated,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
