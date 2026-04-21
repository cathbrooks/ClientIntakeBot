"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { summaryToMarkdown } from "@/lib/summary-to-markdown";
import type { SummaryData } from "@/lib/summary-schema";

const phaseLabel: Record<SummaryData["features"][number]["phase"], string> = {
  mvp: "MVP",
  "phase-2": "Phase 2",
  later: "Later",
};

export function SummaryReport({
  summary,
  meta,
}: {
  summary: SummaryData;
  meta: { contactName: string; companyName: string; startedAt: string };
}) {
  const [copied, setCopied] = useState(false);

  async function copyMarkdown() {
    const md = summaryToMarkdown(summary, meta);
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select-and-copy via textarea
      const ta = document.createElement("textarea");
      ta.value = md;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const phased = {
    mvp: summary.features.filter((f) => f.phase === "mvp"),
    "phase-2": summary.features.filter((f) => f.phase === "phase-2"),
    later: summary.features.filter((f) => f.phase === "later"),
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Discovery Summary &mdash; {meta.companyName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Contact: {meta.contactName} · Started: {meta.startedAt}
          </p>
        </div>
        <Button type="button" onClick={copyMarkdown} variant="outline">
          {copied ? "Copied!" : "Copy as markdown"}
        </Button>
      </div>

      <Section title="Entities">
        {summary.entities.length === 0 ? (
          <Empty />
        ) : (
          <ul className="space-y-2">
            {summary.entities.map((e, i) => (
              <li key={i}>
                <span className="font-medium">{e.name}</span>{" "}
                <span className="text-muted-foreground">— {e.description}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Workflows">
        {summary.workflows.length === 0 ? (
          <Empty />
        ) : (
          <div className="space-y-4">
            {summary.workflows.map((w, i) => (
              <div key={i}>
                <div className="font-medium">{w.name}</div>
                <ol className="list-decimal list-inside text-sm text-muted-foreground mt-1 space-y-0.5">
                  {w.steps.map((s, j) => (
                    <li key={j}>{s}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Features">
        {summary.features.length === 0 ? (
          <Empty />
        ) : (
          <div className="space-y-4">
            {(["mvp", "phase-2", "later"] as const).map((phase) =>
              phased[phase].length > 0 ? (
                <div key={phase}>
                  <div className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                    {phaseLabel[phase]}
                  </div>
                  <ul className="mt-1 space-y-1">
                    {phased[phase].map((f, i) => (
                      <li key={i}>
                        <span className="font-medium">{f.name}</span>{" "}
                        <span className="text-muted-foreground">
                          — {f.description}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null,
            )}
          </div>
        )}
      </Section>

      <Section title="Integrations">
        {summary.integrations.length === 0 ? (
          <Empty />
        ) : (
          <ul className="space-y-2">
            {summary.integrations.map((i, idx) => (
              <li key={idx}>
                <span className="font-medium">{i.name}</span>{" "}
                <span className="text-muted-foreground">— {i.purpose}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Constraints">
        {summary.constraints.length === 0 ? (
          <Empty />
        ) : (
          <ul className="list-disc list-inside space-y-1">
            {summary.constraints.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Open questions">
        {summary.openQuestions.length === 0 ? (
          <Empty />
        ) : (
          <ul className="list-disc list-inside space-y-1">
            {summary.openQuestions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold tracking-tight mb-3">{title}</h2>
      <Separator className="mb-4" />
      {children}
    </section>
  );
}

function Empty() {
  return <p className="text-sm text-muted-foreground italic">None captured.</p>;
}
