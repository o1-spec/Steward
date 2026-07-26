"use client";

import React, { useEffect, useState, useRef } from "react";
import { Sidebar } from "@/components/Sidebar";
import { RunList, RunItem } from "@/components/RunList";
import { RunDetail, RunDetailData } from "@/components/RunDetail";
import { EventItem } from "@/components/EventCard";
import { ConnectionState } from "@/components/ConnectionStatus";

export default function RunsPage() {
  const [runs, setRuns] = useState<RunItem[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<RunDetailData | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectName, setProjectName] = useState<string>("Steward Demo");
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [isLoadingRuns, setIsLoadingRuns] = useState<boolean>(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");

  const eventSourceRef = useRef<EventSource | null>(null);

  // Fetch runs list
  useEffect(() => {
    let isMounted = true;
    async function loadRuns() {
      try {
        const query = statusFilter !== "all" ? `?status=${encodeURIComponent(statusFilter)}` : "";
        const res = await fetch(`/api/v1/runs${query}`);
        if (!res.ok || !isMounted) return;

        const data = await res.json();
        if (isMounted) {
          setRuns(data.runs || []);
          if (data.project?.name) {
            setProjectName(data.project.name);
          }
          if (!selectedRunId && data.runs && data.runs.length > 0) {
            setSelectedRunId(data.runs[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch runs:", err);
      } finally {
        if (isMounted) {
          setIsLoadingRuns(false);
        }
      }
    }

    loadRuns();
    return () => {
      isMounted = false;
    };
  }, [statusFilter, selectedRunId]);

  // Fetch details for selected run
  useEffect(() => {
    let isMounted = true;
    if (!selectedRunId) {
      return;
    }

    async function loadDetail() {
      setIsLoadingDetail(true);
      try {
        const res = await fetch(`/api/v1/runs/${encodeURIComponent(selectedRunId as string)}`);
        if (!res.ok) {
          if (isMounted) setSelectedRun(null);
          return;
        }
        const data = await res.json();
        if (isMounted) {
          setSelectedRun(data.run);
        }
      } catch (err) {
        console.error("Failed to fetch run details:", err);
      } finally {
        if (isMounted) {
          setIsLoadingDetail(false);
        }
      }
    }

    loadDetail();

    return () => {
      isMounted = false;
    };
  }, [selectedRunId]);

  // Connect Server-Sent Events stream for selected run
  useEffect(() => {
    if (!selectedRunId) {
      return;
    }

    // Close previous stream if open
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const streamUrl = `/api/v1/runs/${encodeURIComponent(selectedRunId)}/stream`;
    const es = new EventSource(streamUrl);
    eventSourceRef.current = es;

    es.addEventListener("connected", () => {
      setConnectionState("connected");
    });

    es.addEventListener("ping", () => {
      setConnectionState("connected");
    });

    es.addEventListener("event", (evt: MessageEvent) => {
      try {
        const newEvent: EventItem = JSON.parse(evt.data);

        // Append new event to selected run without duplicate IDs
        setSelectedRun((prev) => {
          if (!prev) return prev;

          const exists = prev.events.some(
            (e) => e.id === newEvent.id || e.externalId === newEvent.externalId
          );
          if (exists) return prev;

          const updatedEvents = [...prev.events, newEvent].sort((a, b) => {
            if (
              a.sequence !== null &&
              a.sequence !== undefined &&
              b.sequence !== null &&
              b.sequence !== undefined
            ) {
              return a.sequence - b.sequence;
            }
            return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          });

          let updatedStatus = prev.status;
          let updatedEndedAt = prev.endedAt;

          if (newEvent.type === "run.started" || newEvent.type === "run.resumed") {
            updatedStatus = "running";
          } else if (newEvent.type === "run.paused") {
            updatedStatus = "paused";
          } else if (newEvent.type === "run.completed") {
            updatedStatus = "completed";
            updatedEndedAt = newEvent.timestamp;
          } else if (newEvent.type === "run.failed") {
            updatedStatus = "failed";
            updatedEndedAt = newEvent.timestamp;
          } else if (newEvent.type === "run.cancelled") {
            updatedStatus = "cancelled";
            updatedEndedAt = newEvent.timestamp;
          }

          return {
            ...prev,
            status: updatedStatus,
            endedAt: updatedEndedAt,
            eventCount: updatedEvents.length,
            events: updatedEvents,
          };
        });

        // Also update runs list event count and status
        setRuns((prevRuns) =>
          prevRuns.map((r) => {
            if (r.id === selectedRunId || r.externalId === selectedRunId) {
              let status = r.status;
              if (newEvent.type === "run.started" || newEvent.type === "run.resumed")
                status = "running";
              if (newEvent.type === "run.paused") status = "paused";
              if (newEvent.type === "run.completed") status = "completed";
              if (newEvent.type === "run.failed") status = "failed";
              if (newEvent.type === "run.cancelled") status = "cancelled";

              return {
                ...r,
                status,
                eventCount: r.eventCount + 1,
                latestEventAt: newEvent.timestamp,
              };
            }
            return r;
          })
        );
      } catch (err) {
        console.error("Error parsing stream event:", err);
      }
    });

    es.onerror = () => {
      setConnectionState("reconnecting");
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
      setConnectionState("disconnected");
    };
  }, [selectedRunId]);

  const handleSelectRun = (runId: string) => {
    setSelectedRunId(runId);
    setMobileView("detail");
  };

  const activeRunCount = runs.filter(
    (r) => r.status === "running" || r.status === "active"
  ).length;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 antialiased overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <div className="hidden md:block">
        <Sidebar
          connectionState={connectionState}
          projectName={projectName}
          activeRunCount={activeRunCount}
        />
      </div>

      {/* Main Layout Container */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Run List Panel */}
        <div
          className={`${
            mobileView === "list" ? "block" : "hidden"
          } md:block w-full md:w-80 shrink-0`}
        >
          <RunList
            runs={runs}
            selectedRunId={selectedRunId || undefined}
            onSelectRun={handleSelectRun}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            isLoading={isLoadingRuns}
          />
        </div>

        {/* Main Run Detail View */}
        <div
          className={`${
            mobileView === "detail" ? "block" : "hidden"
          } md:block flex-1 flex flex-col min-w-0`}
        >
          {/* Mobile Back Button */}
          <div className="md:hidden p-3 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
            <button
              onClick={() => setMobileView("list")}
              className="text-xs text-indigo-400 font-medium flex items-center gap-1"
            >
              ← Back to Runs
            </button>
            <span className="text-xs text-slate-400 font-mono">{projectName}</span>
          </div>

          <RunDetail run={selectedRun} isLoading={isLoadingDetail} />
        </div>
      </div>
    </div>
  );
}
