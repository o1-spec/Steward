import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { checkProjectMembership } from "@/lib/project-auth";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { runId } = await params;

    const run = await prisma.run.findFirst({
      where: {
        OR: [{ id: runId }, { externalId: runId }],
      },
      include: {
        project: {
          select: { id: true, name: true, slug: true },
        },
        events: {
          orderBy: [{ sequence: "asc" }, { timestamp: "asc" }],
        },
      },
    });

    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    // Verify membership in run's project
    const authCheck = await checkProjectMembership(user.id, run.projectId);
    if (!authCheck.isMember) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    return NextResponse.json({
      run: {
        id: run.id,
        externalId: run.externalId,
        projectId: run.projectId,
        agentName: run.agentName,
        status: run.status,
        controlState: run.controlState || "ACTIVE",
        startedAt: run.startedAt,
        endedAt: run.endedAt,
        createdAt: run.createdAt,
        updatedAt: run.updatedAt,
        eventCount: run.events.length,
        events: run.events,
        project: run.project,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
