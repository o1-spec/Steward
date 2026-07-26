import { NextRequest, NextResponse } from "next/server";
import { destroySession, getCurrentUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit-logger";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (user) {
      await recordAuditLog({
        actorType: "USER",
        actorId: user.id,
        actor: user.email,
        action: "USER_LOGOUT",
        outcome: "SUCCESS",
      });
    }

    await destroySession(request);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
