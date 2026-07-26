import { prisma } from "../../../../../../lib/db";
import { stewardEventBus } from "../../../../../../lib/event-bus";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;

  const run = await prisma.run.findFirst({
    where: {
      OR: [{ id: runId }, { externalId: runId }],
    },
    select: { id: true, externalId: true, projectId: true },
  });

  if (!run) {
    return new Response(JSON.stringify({ error: "Run not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const initialFrame = `event: connected\ndata: ${JSON.stringify({
        status: "connected",
        runId: run.id,
        externalId: run.externalId,
      })}\n\n`;
      controller.enqueue(encoder.encode(initialFrame));

      const onNewEvent = (eventData: unknown) => {
        try {
          const frame = `event: event\ndata: ${JSON.stringify(eventData)}\n\n`;
          controller.enqueue(encoder.encode(frame));
        } catch {
          // Stream controller closed
        }
      };

      stewardEventBus.on(`run:event:${run.id}`, onNewEvent);
      if (run.externalId !== run.id) {
        stewardEventBus.on(`run:event:${run.externalId}`, onNewEvent);
      }

      const pingInterval = setInterval(() => {
        try {
          const pingFrame = `event: ping\ndata: ${JSON.stringify({
            timestamp: new Date().toISOString(),
          })}\n\n`;
          controller.enqueue(encoder.encode(pingFrame));
        } catch {
          clearInterval(pingInterval);
        }
      }, 15000);

      const cleanup = () => {
        clearInterval(pingInterval);
        stewardEventBus.off(`run:event:${run.id}`, onNewEvent);
        if (run.externalId !== run.id) {
          stewardEventBus.off(`run:event:${run.externalId}`, onNewEvent);
        }
      };

      request.signal.addEventListener("abort", () => {
        cleanup();
        try {
          controller.close();
        } catch {
          // Controller already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
