import type { SummaryData } from "./summary-schema";

const phaseLabel: Record<SummaryData["features"][number]["phase"], string> = {
  mvp: "MVP",
  "phase-2": "Phase 2",
  later: "Later",
};

function list(items: string[]): string {
  return items.length === 0
    ? "_None captured._"
    : items.map((item) => `- ${item}`).join("\n");
}

export function summaryToMarkdown(
  summary: SummaryData,
  meta: { contactName: string; companyName: string; startedAt: string },
): string {
  const parts: string[] = [];

  parts.push(`# Discovery Summary — ${meta.companyName}`);
  parts.push(
    `Contact: ${meta.contactName}\nSession started: ${meta.startedAt}`,
  );

  parts.push("## Entities");
  parts.push(
    summary.entities.length === 0
      ? "_None captured._"
      : summary.entities
          .map((e) => `- **${e.name}** — ${e.description}`)
          .join("\n"),
  );

  parts.push("## Workflows");
  parts.push(
    summary.workflows.length === 0
      ? "_None captured._"
      : summary.workflows
          .map(
            (w) =>
              `### ${w.name}\n${w.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`,
          )
          .join("\n\n"),
  );

  parts.push("## Features");
  if (summary.features.length === 0) {
    parts.push("_None captured._");
  } else {
    for (const phase of ["mvp", "phase-2", "later"] as const) {
      const group = summary.features.filter((f) => f.phase === phase);
      if (group.length === 0) continue;
      parts.push(`### ${phaseLabel[phase]}`);
      parts.push(
        group.map((f) => `- **${f.name}** — ${f.description}`).join("\n"),
      );
    }
  }

  parts.push("## Integrations");
  parts.push(
    summary.integrations.length === 0
      ? "_None captured._"
      : summary.integrations
          .map((i) => `- **${i.name}** — ${i.purpose}`)
          .join("\n"),
  );

  parts.push("## Constraints");
  parts.push(list(summary.constraints));

  parts.push("## Open Questions");
  parts.push(list(summary.openQuestions));

  return parts.join("\n\n") + "\n";
}
