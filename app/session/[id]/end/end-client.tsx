"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { SummaryReport } from "@/components/summary-report";
import type { SummaryData } from "@/lib/summary-schema";

type Status = "loading" | "ready" | "error";

export function EndClient({
  sessionId,
  meta,
}: {
  sessionId: string;
  meta: { contactName: string; companyName: string; startedAt: string };
}) {
  const [status, setStatus] = useState<Status>("loading");
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const ran = useRef(false);

  async function generate() {
    setStatus("loading");
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/session/${sessionId}/summarize`, {
        method: "POST",
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.error ?? `Request failed with ${res.status}`);
      }
      setSummary(body.summary as SummaryData);
      setStatus("ready");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
    }
  }

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    generate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === "loading") {
    return (
      <div className="py-20 text-center">
        <div className="text-lg font-medium">Generating summary&hellip;</div>
        <p className="mt-1 text-sm text-muted-foreground">
          Reading the full transcript and extracting structured requirements.
          This usually takes 10&ndash;30 seconds.
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="py-12 space-y-4">
        <div className="rounded-md border border-destructive/50 bg-destructive/10 text-destructive px-4 py-3">
          <div className="font-medium">Summary generation failed.</div>
          <div className="mt-0.5 text-sm opacity-90">{errorMessage}</div>
        </div>
        <Button type="button" onClick={generate}>
          Try again
        </Button>
      </div>
    );
  }

  if (!summary) return null;
  return <SummaryReport summary={summary} meta={meta} />;
}
