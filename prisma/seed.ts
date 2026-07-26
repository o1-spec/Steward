import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function generateApiKeySecret(): string {
  const bytes = crypto.randomBytes(24).toString("hex");
  return `stwd_live_${bytes}`;
}

function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

function getKeyPrefix(key: string): string {
  return key.slice(0, 18);
}

async function main() {
  console.log("[Seed] Seeding development environment...");

  // 1. Create dev user
  const email = "dev@steward.dev";
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const passwordHash = await bcrypt.hash("Password123!", 10);
    user = await prisma.user.create({
      data: {
        email,
        name: "Development User",
        passwordHash,
      },
    });
    console.log(`[Seed] Created development user: ${user.email} (Password: Password123!)`);
  } else {
    console.log(`[Seed] Found existing development user: ${user.email}`);
  }

  // 2. Create dev project
  let project = await prisma.project.findUnique({
    where: { slug: "steward-demo" },
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        name: "Steward Demo",
        slug: "steward-demo",
      },
    });
    console.log(`[Seed] Created project: ${project.name} (${project.id})`);
  } else {
    console.log(`[Seed] Found existing project: ${project.name} (${project.id})`);
  }

  // 3. Ensure owner membership
  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId: project.id,
        userId: user.id,
      },
    },
  });

  if (!member) {
    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: user.id,
        role: "OWNER",
      },
    });
    console.log(`[Seed] Added ${user.email} as OWNER of ${project.name}`);
  }

  // 4. Create API Key
  const forceNewKey = process.argv.includes("--force");
  const existingKeyCount = await prisma.projectApiKey.count({
    where: { projectId: project.id, revokedAt: null },
  });

  if (existingKeyCount > 0 && !forceNewKey) {
    console.log(
      `[Seed] Project already has ${existingKeyCount} active API key(s). Skipping API key creation. (Use --force to generate a new key)`
    );
    return;
  }

  const secretKey = generateApiKeySecret();
  const keyHash = hashApiKey(secretKey);
  const keyPrefix = getKeyPrefix(secretKey);

  const apiKey = await prisma.projectApiKey.create({
    data: {
      projectId: project.id,
      name: "Demo API Key",
      keyPrefix,
      keyHash,
    },
  });

  console.log(`\n[Seed] Created API key for '${project.name}':`);
  console.log(`  Key ID:     ${apiKey.id}`);
  console.log(`  Key Prefix: ${apiKey.keyPrefix}`);
  console.log(`  API Key:    ${secretKey}`);
  console.log(
    `\nIMPORTANT: Copy this key now! The raw secret key is never stored in the database.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
