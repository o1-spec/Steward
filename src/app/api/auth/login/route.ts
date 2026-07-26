import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { rateLimitRequest } from "@/lib/rate-limiter";
import { recordAuditLog } from "@/lib/audit-logger";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const limitCheck = await rateLimitRequest(`login:${ip}`, { limit: 5, windowMs: 60000 });
    if (!limitCheck.allowed) {
      return limitCheck.response;
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const { email, password } = body;
    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      await recordAuditLog({
        actorType: "USER",
        actor: cleanEmail,
        action: "USER_LOGIN_FAILED",
        outcome: "FAILED",
        reason: "User not found",
        ipAddress: ip,
        userAgent: request.headers.get("user-agent") || undefined,
      });
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      await recordAuditLog({
        actorType: "USER",
        actorId: user.id,
        actor: user.email,
        action: "USER_LOGIN_FAILED",
        outcome: "FAILED",
        reason: "Invalid password",
        ipAddress: ip,
        userAgent: request.headers.get("user-agent") || undefined,
      });
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Create session & HTTP-only cookie
    await createSession(user.id);

    // Audit Log
    await recordAuditLog({
      actorType: "USER",
      actorId: user.id,
      actor: user.email,
      action: "USER_LOGIN",
      targetType: "USER",
      targetId: user.id,
      outcome: "SUCCESS",
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
