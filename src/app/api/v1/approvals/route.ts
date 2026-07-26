import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ingestEvent } from "@/lib/event-ingestion";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");
    const reqProjectId = searchParams.get("projectId");

    // Fetch active project by ID, slug 'steward-demo', or latest created
    let project = null;
    if (reqProjectId) {
      project = await prisma.project.findUnique({ where: { id: reqProjectId } });
    }
    if (!project) {
      project = await prisma.project.findUnique({ where: { slug: "steward-demo" } });
    }
    if (!project) {
      project = await prisma.project.findFirst({ orderBy: { createdAt: "desc" } });
    }

    if (!project) {
      return NextResponse.json({ approvals: [] });
    }

    const now = new Date();

    // 1. Lazy check for expired pending requests
    const expiredPending = await prisma.approvalRequest.findMany({
      where: {
        projectId: project.id,
        status: "PENDING",
        expiresAt: { lt: now },
      },
      include: { run: true },
    });

    for (const req of expiredPending) {
      await prisma.approvalRequest.update({
        where: { id: req.id },
        data: { status: "EXPIRED" },
      });

      if (req.run) {
        await ingestEvent(
          project.id,
          {
            specVersion: "1.0",
            eventId: `evt_appr_exp_${req.externalId}`,
            eventType: "approval.expired",
            occurredAt: now.toISOString(),
            agentKey: req.agentName,
            runId: req.run.externalId,
            payload: {
              approvalId: req.externalId,
              reason: "Expired prior to human decision",
            },
          }
        ).catch(() => {});
      }
    }

    // 2. Build status query
    const whereClause: Prisma.ApprovalRequestWhereInput = {
      projectId: project.id,
      ...(statusFilter && statusFilter !== "ALL" ? { status: statusFilter.toUpperCase() } : {}),
    };

    const approvals = await prisma.approvalRequest.findMany({
      where: whereClause,
      include: {
        run: {
          select: {
            id: true,
            externalId: true,
            agentName: true,
            status: true,
          },
        },
      },
      orderBy: [
        { requestedAt: "desc" },
      ],
    });

    // Sort pending items to top
    approvals.sort((a, b) => {
      if (a.status === "PENDING" && b.status !== "PENDING") return -1;
      if (a.status !== "PENDING" && b.status === "PENDING") return 1;
      return b.requestedAt.getTime() - a.requestedAt.getTime();
    });

    return NextResponse.json({ approvals });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
