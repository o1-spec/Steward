"use client";

import React from "react";

export type ConnectionState = "connected" | "reconnecting" | "disconnected";

interface ConnectionStatusProps {
  status: ConnectionState;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status }) => {
  const config = {
    connected: {
      label: "Connected",
      color: "bg-emerald-500",
      textColor: "text-emerald-400",
      pingColor: "bg-emerald-400",
    },
    reconnecting: {
      label: "Reconnecting",
      color: "bg-amber-500",
      textColor: "text-amber-400",
      pingColor: "bg-amber-400",
    },
    disconnected: {
      label: "Disconnected",
      color: "bg-rose-500",
      textColor: "text-rose-400",
      pingColor: "bg-rose-400",
    },
  }[status];

  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-inner text-xs font-medium">
      <span className="relative flex h-2 w-2">
        {status === "connected" && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.pingColor} opacity-75`}
          />
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${config.color}`}
        />
      </span>
      <span className={config.textColor}>{config.label}</span>
    </div>
  );
};
