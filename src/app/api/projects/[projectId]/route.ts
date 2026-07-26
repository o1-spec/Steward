import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { checkProjectMembership } from "@/lib/project-auth";
import { prisma } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit-logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    const authCheck = await checkProjectMembership(user.id, projectId);

    if (!authCheck.isMember || !authCheck.project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const memberCount = await prisma.projectMember.count({
      where: { projectId: authCheck.project.id },
    });

    const apiKeyCount = await prisma.projectApiKey.count({
      where: { projectId: authCheck.project.id, revokedAt: null },
    });

    return NextResponse.json({
      project: {
        id: authCheck.project.id,
        name: authCheck.project.name,
        slug: authCheck.project.slug,
        role: authCheck.role,
        memberCount,
        apiKeyCount,
        createdAt: authCheck.project.createdAt,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    // Require OWNER role
    const authCheck = await checkProjectMembership(user.id, projectId, "OWNER");

    if (!authCheck.isMember || !authCheck.project) {
      return NextResponse.json({ error: authCheck.error || "Project not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { name, slug } = body;
    const updateData: { name?: string; slug?: string } = {};

    if (name && typeof name === "string" && name.trim()) {
      updateData.name = name.trim();
    }
    if (slug && typeof slug === "string" && slug.trim()) {
      const cleanSlug = slug.trim().toLowerCase().replace(/[^\w-]/g, "");
      const existingSlug = await prisma.project.findUnique({ where: { slug: cleanSlug } });
      if (existingSlug && existingSlug.id !== authCheck.project.id) {
        return NextResponse.json({ error: "Slug is already in use by another project" }, { status: 400 });
      }
      updateData.slug = cleanSlug;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updated = await prisma.project.update({
      where: { id: authCheck.project.id },
      data: updateData,
    });

    await recordAuditLog({
      projectId: updated.id,
      actorType: "USER",
      actorId: user.id,
      actor: user.email,
      action: "PROJECT_UPDATE",
      targetType: "PROJECT",
      targetId: updated.id,
      outcome: "SUCCESS",
      metadata: updateData,
    });

    return NextResponse.json({
      project: {
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        role: "OWNER",
        updatedAt: updated.updatedAt,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
