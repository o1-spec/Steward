import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { checkProjectMembership } from "@/lib/project-auth";
import { prisma } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit-logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; keyId: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, keyId } = await params;
    // Require OWNER role
    const authCheck = await checkProjectMembership(user.id, projectId, "OWNER");

    if (!authCheck.isMember || !authCheck.project) {
      return NextResponse.json({ error: authCheck.error || "Project not found" }, { status: 404 });
    }

    const apiKeyRecord = await prisma.projectApiKey.findFirst({
      where: {
        id: keyId,
        projectId: authCheck.project.id,
      },
    });

    if (!apiKeyRecord) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    if (apiKeyRecord.revokedAt) {
      return NextResponse.json({ success: true, duplicate: true, apiKey: apiKeyRecord });
    }

    const now = new Date();
    const updated = await prisma.projectApiKey.update({
      where: { id: apiKeyRecord.id },
      data: { revokedAt: now },
    });

    await recordAuditLog({
      projectId: authCheck.project.id,
      actorType: "USER",
      actorId: user.id,
      actor: user.email,
      action: "API_KEY_REVOKE",
      targetType: "API_KEY",
      targetId: apiKeyRecord.id,
      outcome: "SUCCESS",
      metadata: { keyPrefix: apiKeyRecord.keyPrefix, name: apiKeyRecord.name },
    });

    return NextResponse.json({
      success: true,
      apiKey: {
        id: updated.id,
        name: updated.name,
        keyPrefix: updated.keyPrefix,
        revokedAt: updated.revokedAt,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
