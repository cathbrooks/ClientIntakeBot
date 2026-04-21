import { z } from "zod";

export const summarySchema = z.object({
  entities: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
      }),
    )
    .describe(
      "Nouns of the business: people, objects, or concepts the system needs to model (e.g. Event, Client, Gear Item, Crew Member).",
    ),
  workflows: z
    .array(
      z.object({
        name: z.string(),
        steps: z.array(z.string()),
      }),
    )
    .describe(
      "End-to-end processes, expressed as ordered steps (e.g. Quote → Confirm → Prep → Event → Invoice).",
    ),
  features: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        phase: z.enum(["mvp", "phase-2", "later"]),
      }),
    )
    .describe(
      "Distinct capabilities the CRM needs, each tagged by build phase. 'mvp' = required for first usable release; 'phase-2' = important but not blocking; 'later' = nice-to-have or speculative.",
    ),
  integrations: z
    .array(
      z.object({
        name: z.string(),
        purpose: z.string(),
      }),
    )
    .describe(
      "External systems the CRM must talk to, with a short note on why (e.g. QuickBooks — sync invoices).",
    ),
  constraints: z
    .array(z.string())
    .describe(
      "Hard limits or requirements: budget, timeline, team skills, compliance, hosting preferences, etc.",
    ),
  openQuestions: z
    .array(z.string())
    .describe(
      "Questions the user couldn't answer in-session; items requiring follow-up before build.",
    ),
});

export type SummaryData = z.infer<typeof summarySchema>;

export const summaryToolSchema = {
  name: "record_summary",
  description:
    "Record the structured discovery summary extracted from the transcript.",
  input_schema: {
    type: "object" as const,
    properties: {
      entities: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
          },
          required: ["name", "description"],
          additionalProperties: false,
        },
      },
      workflows: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            steps: { type: "array", items: { type: "string" } },
          },
          required: ["name", "steps"],
          additionalProperties: false,
        },
      },
      features: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            phase: { type: "string", enum: ["mvp", "phase-2", "later"] },
          },
          required: ["name", "description", "phase"],
          additionalProperties: false,
        },
      },
      integrations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            purpose: { type: "string" },
          },
          required: ["name", "purpose"],
          additionalProperties: false,
        },
      },
      constraints: {
        type: "array",
        items: { type: "string" },
      },
      openQuestions: {
        type: "array",
        items: { type: "string" },
      },
    },
    required: [
      "entities",
      "workflows",
      "features",
      "integrations",
      "constraints",
      "openQuestions",
    ],
    additionalProperties: false,
  },
};
