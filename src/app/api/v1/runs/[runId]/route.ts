import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
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

  return NextResponse.json({
    run: {
      id: run.id,
      externalId: run.externalId,
      projectId: run.projectId,
      agentName: run.agentName,
      status: run.status,
      startedAt: run.startedAt,
      endedAt: run.endedAt,
      createdAt: run.createdAt,
      updatedAt: run.updatedAt,
      eventCount: run.events.length,
      events: run.events,
      project: run.project,
    },
  });
}
