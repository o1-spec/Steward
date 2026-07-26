import crypto from "node:crypto";
import { prisma } from "./db";

export function generateApiKeySecret(): string {
  const bytes = crypto.randomBytes(24).toString("hex");
  return `stwd_live_${bytes}`;
}

export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export function getKeyPrefix(key: string): string {
  return key.slice(0, 18);
}

export async function createProjectApiKey(
  projectId: string,
  name: string = "Default API Key"
) {
  const secretKey = generateApiKeySecret();
  const keyHash = hashApiKey(secretKey);
  const keyPrefix = getKeyPrefix(secretKey);

  const apiKeyRecord = await prisma.projectApiKey.create({
    data: {
      projectId,
      name,
      keyPrefix,
      keyHash,
    },
  });

  return {
    apiKeyRecord,
    secretKey,
  };
}

export async function authenticateApiKey(authHeader: string | null | undefined) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      authenticated: false as const,
      error: "Missing or invalid Authorization header",
    };
  }

  const rawKey = authHeader.substring(7).trim();
  if (!rawKey) {
    return { authenticated: false as const, error: "API key cannot be empty" };
  }

  const keyHash = hashApiKey(rawKey);

  const apiKey = await prisma.projectApiKey.findFirst({
    where: {
      keyHash,
      revokedAt: null,
    },
    include: {
      project: true,
    },
  });

  if (!apiKey) {
    return { authenticated: false as const, error: "Invalid or revoked API key" };
  }

  // Throttled lastUsedAt update strategy: only write if null or older than 60 seconds
  const now = new Date();
  if (!apiKey.lastUsedAt || now.getTime() - apiKey.lastUsedAt.getTime() > 60000) {
    prisma.projectApiKey
      .update({
        where: { id: apiKey.id },
        data: { lastUsedAt: now },
      })
      .catch(() => {});
  }

  return {
    authenticated: true as const,
    apiKey,
    project: apiKey.project,
  };
}
