import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");
  const projectSlug = searchParams.get("projectSlug") || "steward-demo";

  let project = await prisma.project.findUnique({
    where: { slug: projectSlug },
  });

  if (!project) {
    project = await prisma.project.findFirst();
  }

  if (!project) {
    return NextResponse.json({ runs: [], project: null }, { status: 200 });
  }

  const whereCondition: { projectId: string; status?: string } = {
    projectId: project.id,
  };

  if (statusFilter && statusFilter !== "all" && statusFilter.trim() !== "") {
    whereCondition.status = statusFilter;
  }

  const runs = await prisma.run.findMany({
    where: whereCondition,
    orderBy: {
      startedAt: "desc",
    },
    take: 50,
    include: {
      _count: {
        select: { events: true },
      },
      events: {
        orderBy: { timestamp: "desc" },
        take: 1,
        select: { timestamp: true },
      },
    },
  });

  const formattedRuns = runs.map((run) => ({
    id: run.id,
    externalId: run.externalId,
    projectId: run.projectId,
    agentName: run.agentName,
    status: run.status,
    startedAt: run.startedAt,
    endedAt: run.endedAt,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    eventCount: run._count.events,
    latestEventAt: run.events[0]?.timestamp || run.startedAt,
  }));

  return NextResponse.json({
    project: {
      id: project.id,
      name: project.name,
      slug: project.slug,
    },
    runs: formattedRuns,
  });
}
