import { NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api-keys";
import { ingestEvent } from "@/lib/event-ingestion";
import { rateLimitRequest } from "@/lib/rate-limiter";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const authResult = await authenticateApiKey(authHeader);

  if (!authResult.authenticated) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const limitCheck = await rateLimitRequest(`events:${authResult.apiKey.id}`, { limit: 500, windowMs: 60000 });
  if (!limitCheck.allowed) {
    return limitCheck.response;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body in request" },
      { status: 400 }
    );
  }

  // Always use the authenticated API key's projectId
  const result = await ingestEvent(authResult.project.id, body);

  if (!result.success) {
    return NextResponse.json(
      {
        error: result.error,
        details: result.details,
      },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      accepted: result.accepted,
      duplicate: result.duplicate,
      eventId: result.eventId,
    },
    { status: result.statusCode }
  );
}
