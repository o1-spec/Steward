import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api-keys";
import { prisma } from "@/lib/db";
import { ingestEvent } from "@/lib/event-ingestion";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization");
    const authResult = await authenticateApiKey(authHeader);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { project } = authResult;
    const { id } = await params;

    const approvalRequest = await prisma.approvalRequest.findFirst({
      where: {
        projectId: project.id,
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
    let currentStatus = approvalRequest.status;

    // Lazy expiration check
    if (currentStatus === "PENDING" && now > approvalRequest.expiresAt) {
      currentStatus = "EXPIRED";
      await prisma.approvalRequest.update({
        where: { id: approvalRequest.id },
        data: { status: "EXPIRED" },
      });

      // Emit approval.expired event into run timeline
      if (approvalRequest.run) {
        await ingestEvent(
          project.id,
          {
            specVersion: "1.0",
            eventId: `evt_appr_exp_${approvalRequest.externalId}`,
            eventType: "approval.expired",
            occurredAt: now.toISOString(),
            agentKey: approvalRequest.agentName,
            runId: approvalRequest.run.externalId,
            payload: {
              approvalId: approvalRequest.externalId,
              reason: `Approval request expired after ${approvalRequest.expiresAt.toISOString()}`,
            },
          }
        ).catch(() => {});
      }
    }

    return NextResponse.json({
      id: approvalRequest.id,
      externalId: approvalRequest.externalId,
      status: currentStatus,
      decidedAt: approvalRequest.decidedAt,
      decisionReason: approvalRequest.decisionReason,
      expiresAt: approvalRequest.expiresAt,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
