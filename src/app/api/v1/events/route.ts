import { NextResponse } from "next/server";
import { authenticateApiKey } from "../../../../lib/api-keys";
import { ingestEvent } from "../../../../lib/event-ingestion";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const authResult = await authenticateApiKey(authHeader);

  if (!authResult.authenticated) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
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
