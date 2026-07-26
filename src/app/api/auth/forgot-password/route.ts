import { NextRequest, NextResponse } from "next/server";
import { rateLimitRequest } from "@/lib/rate-limiter";
import { recordAuditLog } from "@/lib/audit-logger";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const limitCheck = await rateLimitRequest(`forgot_password:${ip}`, { limit: 3, windowMs: 60000 });
    if (!limitCheck.allowed) {
      return limitCheck.response;
    }

    const body = await request.json().catch(() => null);
    const email = body?.email ? String(body.email).trim().toLowerCase() : "";

    if (email) {
      await recordAuditLog({
        actorType: "USER",
        actor: email,
        action: "PASSWORD_RESET_REQUEST",
        outcome: "SUCCESS",
        ipAddress: ip,
      });
    }

    // Generic success response to reduce account enumeration
    return NextResponse.json({
      message: "If an account exists for this email, password reset instructions have been dispatched.",
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
