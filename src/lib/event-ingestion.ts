import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { validateEvent } from "./protocol/validation";
import { StewardEventType } from "./protocol/event-types";
import { stewardEventBus } from "./event-bus";

export type IngestionResponse =
  | {
      success: true;
      statusCode: 200 | 201;
      accepted: true;
      duplicate: boolean;
      eventId: string;
    }
  | {
      success: false;
      statusCode: 400;
      error: string;
      details?: unknown;
    };

export async function ingestEvent(
  projectId: string,
  rawEvent: unknown
): Promise<IngestionResponse> {
  const validation = validateEvent(rawEvent);
  if (!validation.success) {
    return {
      success: false,
      statusCode: 400,
      error: validation.error.message,
      details: validation.error,
    };
  }

  const envelope = validation.data;
  const runExternalId = envelope.runId || envelope.eventId;
  const occurredAtDate = new Date(envelope.occurredAt);

  let targetStatus: string | undefined;
  let setEndedAt: Date | undefined;
  let setStartedAt: Date | undefined;

  switch (envelope.eventType as StewardEventType) {
    case "run.started":
      targetStatus = "running";
      setStartedAt = occurredAtDate;
      break;
    case "run.paused":
      targetStatus = "paused";
      break;
    case "run.resumed":
      targetStatus = "running";
      break;
    case "run.completed":
      targetStatus = "completed";
      setEndedAt = occurredAtDate;
      break;
    case "run.failed":
      targetStatus = "failed";
      setEndedAt = occurredAtDate;
      break;
    case "run.cancelled":
      targetStatus = "cancelled";
      setEndedAt = occurredAtDate;
      break;
    default:
      break;
  }

  let run = await prisma.run.findUnique({
    where: {
      projectId_externalId: {
        projectId,
        externalId: runExternalId,
      },
    },
  });

  if (run) {
    const updateData: Prisma.RunUpdateInput = {};
    if (targetStatus) {
      updateData.status = targetStatus;
    }
    if (setEndedAt) {
      updateData.endedAt = setEndedAt;
    }
    if (setStartedAt) {
      updateData.startedAt = setStartedAt;
    }
    if (Object.keys(updateData).length > 0) {
      run = await prisma.run.update({
        where: { id: run.id },
        data: updateData,
      });
    }
  } else {
    run = await prisma.run.create({
      data: {
        projectId,
        externalId: runExternalId,
        agentName: envelope.agentKey,
        status: targetStatus || "active",
        startedAt: setStartedAt || occurredAtDate,
        endedAt: setEndedAt,
      },
    });
  }

  const existingEvent = await prisma.event.findUnique({
    where: {
      projectId_externalId: {
        projectId,
        externalId: envelope.eventId,
      },
    },
  });

  if (existingEvent) {
    return {
      success: true,
      statusCode: 200,
      accepted: true,
      duplicate: true,
      eventId: existingEvent.id,
    };
  }

  try {
    const newEvent = await prisma.event.create({
      data: {
        projectId,
        runId: run.id,
        externalId: envelope.eventId,
        type: envelope.eventType,
        timestamp: occurredAtDate,
        sequence: envelope.sequence ?? null,
        payload: (envelope.payload ?? {}) as Prisma.InputJsonValue,
      },
    });

    // Broadcast event to active SSE listeners
    stewardEventBus.emit(`run:event:${run.id}`, newEvent);
    stewardEventBus.emit(`run:event:${run.externalId}`, newEvent);

    return {
      success: true,
      statusCode: 201,
      accepted: true,
      duplicate: false,
      eventId: newEvent.id,
    };
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      const existing = await prisma.event.findUnique({
        where: {
          projectId_externalId: {
            projectId,
            externalId: envelope.eventId,
          },
        },
      });
      if (existing) {
        return {
          success: true,
          statusCode: 200,
          accepted: true,
          duplicate: true,
          eventId: existing.id,
        };
      }
    }
    throw err;
  }
}
