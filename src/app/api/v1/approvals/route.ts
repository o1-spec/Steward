import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getActiveProjectId, checkProjectMembership } from "@/lib/project-auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");
    const queryProjectId = searchParams.get("projectId");
    const activeCookieId = await getActiveProjectId(request);

    const targetProjectId = queryProjectId || activeCookieId;

    let projectMembership;
    if (targetProjectId) {
      projectMembership = await checkProjectMembership(user.id, targetProjectId);
    }

    if (!projectMembership || !projectMembership.isMember || !projectMembership.project) {
      const firstMember = await prisma.projectMember.findFirst({
        where: { userId: user.id },
        include: { project: true },
        orderBy: { createdAt: "asc" },
      });

      if (!firstMember) {
        return NextResponse.json({ approvals: [] }, { status: 200 });
      }

      projectMembership = {
        isMember: true,
        project: firstMember.project,
        member: firstMember,
        role: firstMember.role,
        error: null,
      };
    }

    const project = projectMembership.project!;

    const whereCondition: { projectId: string; status?: string } = {
      projectId: project.id,
    };

    if (statusFilter && statusFilter !== "all" && statusFilter.trim() !== "") {
      whereCondition.status = statusFilter.toUpperCase();
    }

    const approvals = await prisma.approvalRequest.findMany({
      where: whereCondition,
      orderBy: { requestedAt: "desc" },
      take: 50,
      include: {
        run: {
          select: { externalId: true, agentName: true },
        },
      },
    });

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        slug: project.slug,
      },
      approvals,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
