import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ user: null, projects: [] }, { status: 401 });
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

    return NextResponse.json({
      user,
      projects,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
