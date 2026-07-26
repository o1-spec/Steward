import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { setActiveProjectIdCookie } from "@/lib/project-auth";
import { recordAuditLog } from "@/lib/audit-logger";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberships = await prisma.projectMember.findMany({
      where: { userId: user.id },
      include: {
        project: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const projects = memberships.map((m) => ({
      id: m.project.id,
      name: m.project.name,
      slug: m.project.slug,
      role: m.role,
      createdAt: m.project.createdAt,
    }));

    return NextResponse.json({ projects });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { name, slug: customSlug } = body;
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const baseSlug = customSlug && typeof customSlug === "string" && customSlug.trim()
      ? slugify(customSlug)
      : slugify(name);

    if (!baseSlug) {
      return NextResponse.json({ error: "Invalid project slug" }, { status: 400 });
    }

    let finalSlug = baseSlug;
    let counter = 1;
    while (await prisma.project.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter++}`;
    }

    // Atomic Project creation & Owner membership
    const project = await prisma.$transaction(async (tx) => {
      const p = await tx.project.create({
        data: {
          name: name.trim(),
          slug: finalSlug,
        },
      });

      await tx.projectMember.create({
        data: {
          projectId: p.id,
          userId: user.id,
          role: "OWNER",
        },
      });

      return p;
    });

    await setActiveProjectIdCookie(project.id);

    await recordAuditLog({
      projectId: project.id,
      actorType: "USER",
      actorId: user.id,
      actor: user.email,
      action: "PROJECT_CREATE",
      targetType: "PROJECT",
      targetId: project.id,
      outcome: "SUCCESS",
      metadata: { name: project.name, slug: project.slug },
    });

    return NextResponse.json(
      {
        project: {
          id: project.id,
          name: project.name,
          slug: project.slug,
          role: "OWNER",
          createdAt: project.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
