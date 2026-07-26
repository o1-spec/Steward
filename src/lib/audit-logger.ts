import crypto from "node:crypto";
import { prisma } from "./db";
import { redactSensitiveData } from "./redaction";
import { Prisma } from "@prisma/client";

export interface RecordAuditOptions {
  projectId?: string;
  approvalRequestId?: string;
  actorType: "USER" | "AGENT" | "SYSTEM";
  actorId?: string;
  actor: string;
  action: string;
  targetType?: string;
  targetId?: string;
  outcome: "SUCCESS" | "FAILED" | "DENIED";
  reason?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function recordAuditLog(options: RecordAuditOptions) {
  try {
    const redactedMeta = options.metadata ? redactSensitiveData(options.metadata) : null;

    let ipAddressHash: string | undefined = undefined;
    if (options.ipAddress) {
      ipAddressHash = crypto.createHash("sha256").update(options.ipAddress).digest("hex").slice(0, 16);
    }

    return await prisma.auditLog.create({
      data: {
        projectId: options.projectId || null,
        approvalRequestId: options.approvalRequestId || null,
        actorType: options.actorType,
        actorId: options.actorId || null,
        actor: options.actor,
        action: options.action,
        targetType: options.targetType || null,
        targetId: options.targetId || null,
        outcome: options.outcome,
        reason: options.reason || null,
        metadata: redactedMeta as Prisma.InputJsonValue,
        ipAddressHash: ipAddressHash || null,
        userAgent: options.userAgent ? options.userAgent.slice(0, 255) : null,
      },
    });
  } catch (err) {
    console.error("[AuditLog] Failed to record audit log:", err);
  }
}
