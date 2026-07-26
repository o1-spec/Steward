import { cookies } from "next/headers";
import { prisma } from "./db";

const ACTIVE_PROJECT_COOKIE = "stwd_active_project";

export async function getActiveProjectId(request?: Request): Promise<string | null> {
  if (request) {
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(new RegExp(`(?:^|; )\\s*${ACTIVE_PROJECT_COOKIE}\\s*=\\s*([^;]+)`));
    if (match) {
      return decodeURIComponent(match[1]);
    }
  }

  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(ACTIVE_PROJECT_COOKIE);
    return cookie ? cookie.value : null;
  } catch {
    return null;
  }
}

export async function setActiveProjectIdCookie(projectId: string) {
  try {
    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_PROJECT_COOKIE, projectId, {
      httpOnly: false, // accessible via JS to sync active project in UI
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
  } catch {
    // ignore
  }
}

export async function checkProjectMembership(
  userId: string,
  projectIdOrSlug: string,
  requiredRole?: "OWNER" | "MEMBER"
) {
  // Find project by id or slug
  const project = await prisma.project.findFirst({
    where: {
      OR: [{ id: projectIdOrSlug }, { slug: projectIdOrSlug }],
    },
  });

  if (!project) {
    return { isMember: false, project: null, member: null, error: "Project not found" };
  }

  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId: project.id,
        userId,
      },
    },
  });

  if (!member) {
    return { isMember: false, project, member: null, error: "Access denied. Not a project member." };
  }

  if (requiredRole === "OWNER" && member.role !== "OWNER") {
    return { isMember: false, project, member, error: "Owner role required for this action." };
  }

  return {
    isMember: true,
    project,
    member,
    role: member.role,
    error: null,
  };
}
