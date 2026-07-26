# Steward

Steward is a human-supervision workspace for autonomous AI agents.

## Getting Started

### 1. Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://postgres@localhost:5439/steward"
```

### 2. Database Setup & Migrations

To sync your database schema with Prisma:

```bash
# Push schema changes to PostgreSQL
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

### 3. Database Seed Command

To seed the initial development environment with a demo project and copyable API key:

```bash
npm run db:seed
```

Output will display the complete API key (e.g., `stwd_live_...`). Note that raw secret keys are hashed with SHA-256 and never stored in plain text.

To force generation of a new API key:

```bash
npm run db:seed -- --force
```

### 4. Running Development Server

```bash
npm run dev
```

The API endpoint will be available at `http://localhost:3000/api/v1/events`.

---

## API Usage Example

### Ingest Event (`POST /api/v1/events`)

Send a `run.started` event using your project API key:

```bash
curl -X POST http://localhost:3000/api/v1/events \
  -H "Authorization: Bearer stwd_live_YOUR_API_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "specVersion": "1.0",
    "eventId": "evt_run_start_001",
    "eventType": "run.started",
    "occurredAt": "2026-07-26T02:00:00.000Z",
    "agentKey": "agent_alpha",
    "runId": "run_001",
    "sequence": 1,
    "payload": {
      "task": "Execute automated diagnostic scan"
    }
  }'
```

### Expected Response

**New Event (HTTP 201 Created):**
```json
{
  "accepted": true,
  "duplicate": false,
  "eventId": "cms14xm1900024c78ni58g7rc"
}
```

**Duplicate Event (HTTP 200 OK):**
```json
{
  "accepted": true,
  "duplicate": true,
  "eventId": "cms14xm1900024c78ni58g7rc"
}
```

---

## Testing & Validation

```bash
# Run Vitest test suite
npm test

# Run TypeScript type check
npm run typecheck

# Run ESLint
npm run lint

# Build production bundle
npm run build
```
