import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { rateLimitRequest } from "@/lib/rate-limiter";
import { recordAuditLog } from "@/lib/audit-logger";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const limitCheck = await rateLimitRequest(`register:${ip}`, { limit: 5, windowMs: 60000 });
    if (!limitCheck.allowed) {
      return limitCheck.response;
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const { email, password, name } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email address already exists" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        passwordHash,
        name: name ? String(name).trim() : null,
      },
    });

    // Create session & HTTP-only cookie
    await createSession(user.id);

    // Audit Log
    await recordAuditLog({
      actorType: "USER",
      actorId: user.id,
      actor: user.email,
      action: "USER_REGISTER",
      targetType: "USER",
      targetId: user.id,
      outcome: "SUCCESS",
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
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
