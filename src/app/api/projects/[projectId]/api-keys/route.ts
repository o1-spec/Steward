import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { checkProjectMembership } from "@/lib/project-auth";
import { prisma } from "@/lib/db";
import { createProjectApiKey } from "@/lib/api-keys";
import { rateLimitRequest } from "@/lib/rate-limiter";
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

    const apiKeys = await prisma.projectApiKey.findMany({
      where: { projectId: authCheck.project.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      apiKeys: apiKeys.map((key) => ({
        id: key.id,
        name: key.name,
        keyPrefix: key.keyPrefix,
        lastUsedAt: key.lastUsedAt,
        revokedAt: key.revokedAt,
        createdAt: key.createdAt,
      })),
      userRole: authCheck.role,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
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

    const limitCheck = await rateLimitRequest(`create_key:${user.id}:${authCheck.project.id}`, { limit: 5, windowMs: 60000 });
    if (!limitCheck.allowed) {
      return limitCheck.response;
    }

    const body = await request.json().catch(() => ({}));
    const keyName = body.name && typeof body.name === "string" ? body.name.trim() : "Agent API Key";

    // Generate Key using cryptographically secure random generator
    const { apiKeyRecord, secretKey } = await createProjectApiKey(authCheck.project.id, keyName);

    await recordAuditLog({
      projectId: authCheck.project.id,
      actorType: "USER",
      actorId: user.id,
      actor: user.email,
      action: "API_KEY_CREATE",
      targetType: "API_KEY",
      targetId: apiKeyRecord.id,
      outcome: "SUCCESS",
      metadata: { keyPrefix: apiKeyRecord.keyPrefix, name: apiKeyRecord.name },
    });

    return NextResponse.json(
      {
        apiKey: {
          id: apiKeyRecord.id,
          name: apiKeyRecord.name,
          keyPrefix: apiKeyRecord.keyPrefix,
          secretKey, // Shown EXACTLY ONCE
          createdAt: apiKeyRecord.createdAt,
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
