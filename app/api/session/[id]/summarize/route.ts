import { NextResponse, type NextRequest } from "next/server";
import { anthropic, SUMMARY_MODEL } from "@/lib/anthropic";
import { getSession, listMessages, saveSummary } from "@/lib/db";
import { getSummaryPrompt } from "@/lib/prompts";
import {
  summarySchema,
  summaryToolSchema,
  type SummaryData,
} from "@/lib/summary-schema";
import { sendSummaryEmail } from "@/lib/email";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const session = await getSession(id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.summary) {
    return NextResponse.json({ summary: session.summary, regenerated: false });
  }

  const messages = await listMessages(id);
  if (messages.length === 0) {
    return NextResponse.json(
      { error: "Session has no messages to summarize" },
      { status: 400 },
    );
  }

  const transcript = messages
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n\n");

  let response;
  try {
    response = await anthropic.messages.create({
      model: SUMMARY_MODEL,
      max_tokens: 8192,
      system: getSummaryPrompt(),
      tools: [summaryToolSchema],
      tool_choice: { type: "tool", name: summaryToolSchema.name },
      messages: [
        {
          role: "user",
          content: `Here is the full transcript of the discovery session. Extract the structured summary using the record_summary tool.\n\n---\n\n${transcript}`,
        },
      ],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Summary generation failed: ${message}` },
      { status: 502 },
    );
  }

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    return NextResponse.json(
      { error: "Model did not return a structured summary" },
      { status: 502 },
    );
  }

  const parsed = summarySchema.safeParse(toolUse.input);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Summary failed validation",
        details: parsed.error.flatten(),
      },
      { status: 502 },
    );
  }

  const summary: SummaryData = parsed.data;
  await saveSummary({ sessionId: id, summary });

  const meta = {
    contactName: session.contact_name,
    companyName: session.company_name,
    startedAt: session.started_at,
  };
  // Fire-and-forget — email failure doesn't block the response
  sendSummaryEmail(summary, meta).catch((err) =>
    console.error("sendSummaryEmail failed:", err),
  );

  return NextResponse.json({ summary, regenerated: true });
}
