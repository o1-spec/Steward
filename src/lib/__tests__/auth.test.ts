import { describe, expect, it, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "../db";
import { hashPassword, verifyPassword } from "../auth";
import { createProjectApiKey, hashApiKey } from "../api-keys";
import { defaultRateLimiter } from "../rate-limiter";

describe("Milestone 7: Authentication, Projects & API-Key Security", () => {
  let testUserId: string;
  let testUserEmail: string;

  beforeEach(async () => {
    // Clear test tables
    await prisma.auditLog.deleteMany({});
    await prisma.runCommand.deleteMany({});
    await prisma.approvalRequest.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.run.deleteMany({});
    await prisma.projectApiKey.deleteMany({});
    await prisma.projectMember.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({});

    testUserEmail = "owner@steward.dev";
    const passwordHash = await hashPassword("Password123!");

    const user = await prisma.user.create({
      data: {
        email: testUserEmail,
        passwordHash,
        name: "Owner User",
      },
    });
    testUserId = user.id;
  });

  describe("Password Hashing & Verification", () => {
    it("should hash password securely and verify matching passwords", async () => {
      const plain = "SuperSecret123!";
      const hash = await hashPassword(plain);

      expect(hash).not.toBe(plain);
      expect(await verifyPassword(plain, hash)).toBe(true);
      expect(await verifyPassword("WrongPassword", hash)).toBe(false);
    });
  });

  describe("User Registration & Login Handlers", () => {
    it("should register a new user and hash password", async () => {
      const { POST: registerPost } = await import("../../app/api/auth/register/route");

      const req = new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "127.0.0.1" },
        body: JSON.stringify({ email: "newuser@steward.dev", password: "Password123!", name: "New User" }),
      });

      const res = await registerPost(req as unknown as NextRequest);
      expect(res.status).toBe(201);

      const dbUser = await prisma.user.findUnique({ where: { email: "newuser@steward.dev" } });
      expect(dbUser).not.toBeNull();
      expect(dbUser?.passwordHash).not.toBe("Password123!");
    });

    it("should return generic 401 error on invalid login attempt to prevent account enumeration", async () => {
      const { POST: loginPost } = await import("../../app/api/auth/login/route");

      const req = new Request("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "127.0.0.2" },
        body: JSON.stringify({ email: "nonexistent@steward.dev", password: "Password123!" }),
      });

      const res = await loginPost(req as unknown as NextRequest);
      expect(res.status).toBe(401);

      const body = await res.json();
      expect(body.error).toBe("Invalid email or password");
    });
  });

  describe("Project Creation & Owner Membership", () => {
    it("should create project and assign creating user as OWNER atomically", async () => {
      // Create session for test user
      const session = await prisma.session.create({
        data: {
          userId: testUserId,
          sessionToken: "token_owner_1",
          expiresAt: new Date(Date.now() + 86400000),
        },
      });

      const { POST: createProjectPost } = await import("../../app/api/projects/route");

      const req = new Request("http://localhost:3000/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `stwd_session=${session.sessionToken}`,
        },
        body: JSON.stringify({ name: "Autonomous Systems Project" }),
      });

      const res = await createProjectPost(req as unknown as NextRequest);
      expect(res.status).toBe(201);

      const body = await res.json();
      expect(body.project.name).toBe("Autonomous Systems Project");

      const dbMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: body.project.id,
            userId: testUserId,
          },
        },
      });

      expect(dbMember?.role).toBe("OWNER");
    });
  });

  describe("Project & Data Isolation", () => {
    it("should prevent non-member user from viewing project runs", async () => {
      // Create Project 1 owned by testUserId
      const p1 = await prisma.project.create({
        data: { name: "Project 1", slug: "project-1" },
      });
      await prisma.projectMember.create({
        data: { projectId: p1.id, userId: testUserId, role: "OWNER" },
      });

      // Create Run in Project 1
      await prisma.run.create({
        data: {
          projectId: p1.id,
          externalId: "run_p1_001",
          agentName: "agent-1",
          status: "RUNNING",
          startedAt: new Date(),
        },
      });

      // Create User 2
      const user2 = await prisma.user.create({
        data: { email: "user2@steward.dev", passwordHash: "hash" },
      });
      const session2 = await prisma.session.create({
        data: { userId: user2.id, sessionToken: "token_user2", expiresAt: new Date(Date.now() + 86400000) },
      });

      // User 2 requests run_p1_001
      const { GET: getRun } = await import("../../app/api/v1/runs/[runId]/route");
      const req = new Request("http://localhost:3000/api/v1/runs/run_p1_001", {
        headers: { Cookie: `stwd_session=${session2.sessionToken}` },
      });

      const res = await getRun(req as unknown as NextRequest, { params: Promise.resolve({ runId: "run_p1_001" }) });
      expect(res.status).toBe(404); // Returns 404 to avoid exposing existence
    });
  });

  describe("API Key Management & Revocation", () => {
    it("should generate API key, store hash only, and reject revoked key authentication", async () => {
      const project = await prisma.project.create({
        data: { name: "API Key Test Project", slug: "apikey-test" },
      });

      const { apiKeyRecord, secretKey } = await createProjectApiKey(project.id, "Prod Key");

      expect(secretKey.startsWith("stwd_live_")).toBe(true);
      expect(apiKeyRecord.keyHash).toBe(hashApiKey(secretKey));
      expect(apiKeyRecord.keyHash).not.toBe(secretKey);

      // Authenticate with valid key
      const { authenticateApiKey } = await import("../api-keys");
      const auth1 = await authenticateApiKey(`Bearer ${secretKey}`);
      expect(auth1.authenticated).toBe(true);
      expect(auth1.project?.id).toBe(project.id);

      // Revoke key
      await prisma.projectApiKey.update({
        where: { id: apiKeyRecord.id },
        data: { revokedAt: new Date() },
      });

      // Authenticate with revoked key
      const auth2 = await authenticateApiKey(`Bearer ${secretKey}`);
      expect(auth2.authenticated).toBe(false);
    });
  });

  describe("Rate Limiting", () => {
    it("should return HTTP 429 when rate limit limit is exceeded", async () => {
      const key = "test_rate_limit_key_001";
      const options = { limit: 2, windowMs: 60000 };

      const r1 = await defaultRateLimiter.check(key, options);
      expect(r1.allowed).toBe(true);

      const r2 = await defaultRateLimiter.check(key, options);
      expect(r2.allowed).toBe(true);

      const r3 = await defaultRateLimiter.check(key, options);
      expect(r3.allowed).toBe(false);
    });
  });

  describe("Audit Log", () => {
    it("should append audit log entry with redacted metadata", async () => {
      const { recordAuditLog } = await import("../audit-logger");

      await recordAuditLog({
        actorType: "USER",
        actorId: testUserId,
        actor: testUserEmail,
        action: "TEST_ACTION",
        outcome: "SUCCESS",
        metadata: { tokenSecret: "secret_value_123", normalField: "normal_value" },
      });

      const logs = await prisma.auditLog.findMany({ where: { actorId: testUserId } });
      expect(logs.length).toBe(1);

      const meta = logs[0].metadata as Record<string, string>;
      expect(meta.tokenSecret).toBe("[REDACTED]");
      expect(meta.normalField).toBe("normal_value");
    });
  });
});
