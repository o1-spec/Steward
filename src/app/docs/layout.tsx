import React from "react";
import { DocsShell } from "@/components/docs/DocsShell";

export const metadata = {
  title: {
    template: "%s — Steward Docs",
    default: "Build human oversight into your agents — Steward Docs",
  },
  description:
    "Connect a Node.js agent, stream its activity, hold sensitive tools for approval and respond to cooperative control commands.",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <DocsShell>{children}</DocsShell>;
}
