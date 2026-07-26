import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";

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
  const forceNewKey = process.argv.includes("--force");

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
    console.log(`[Seed] Existing project found: ${project.name} (${project.id})`);
  }

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

  console.log(`[Seed] Created API key for '${project.name}':`);
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
