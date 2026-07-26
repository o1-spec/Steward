# Contributing to Steward V1

Thank you for contributing to Steward! This guide outlines the development workflow, quality checks, and code standards required for contributions.

---

## Local Development Workflow

### Prerequisites
- Node.js >= 20.x
- PostgreSQL database

### 1. Repository Setup
```bash
git clone https://github.com/o1-spec/Steward.git
cd steward
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Database Migration & Client Generation
```bash
npx prisma db push
npx prisma generate
```

### 4. Running the Development Server
```bash
npm run dev
```

---

## Quality Checks Required Before Pull Requests

Every PR must pass all of the following commands without error:

```bash
# 1. Vitest Test Suite
npm test

# 2. TypeScript Strict Type-Check
npm run typecheck

# 3. ESLint Code Formatting & Quality Check
npm run lint

# 4. Build Node.js SDK Package
npm run build:sdk

# 5. Build Next.js Production App
npm run build
```

---

## Code Guidelines & Standards

- **Security First**: Plaintext secrets, passwords, or raw API keys must **never** be logged, returned in API responses, or committed to git.
- **Redaction**: All events and audit logs must use centralized recursive redaction (`src/lib/redaction.ts`).
- **Idempotency & Isolation**: Every agent API endpoint must enforce project isolation derived strictly from the authenticated API key hash.
- **Type Safety**: Avoid using `any` or loose type casts (`as any`).
