import { anthropic as anthropicProvider } from "@ai-sdk/anthropic";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { NextResponse, type NextRequest } from "next/server";
import { CHAT_MODEL } from "@/lib/anthropic";
import { getSession, insertMessage } from "@/lib/db";
import { buildSystemPrompt } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

type ChatRequestBody = {
  id?: string;
  messages: UIMessage[];
  sessionId: string;
};

function extractText(message: UIMessage): string {
  return message.parts
    .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as ChatRequestBody | null;
  if (!body || typeof body.sessionId !== "string" || !Array.isArray(body.messages)) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const session = await getSession(body.sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const lastMessage = body.messages[body.messages.length - 1];
  if (!lastMessage || lastMessage.role !== "user") {
    return NextResponse.json(
      { error: "Last message must be a user message" },
      { status: 400 },
    );
  }

  const userText = extractText(lastMessage);
  if (!userText.trim()) {
    return NextResponse.json(
      { error: "Empty user message" },
      { status: 400 },
    );
  }

  await insertMessage({
    sessionId: session.id,
    role: "user",
    content: userText,
  });

  const systemPrompt = buildSystemPrompt({
    industry: session.industry,
    contactName: session.contact_name,
    companyName: session.company_name,
  });

  const modelMessages = await convertToModelMessages(body.messages);

  const result = streamText({
    model: anthropicProvider(CHAT_MODEL),
    system: systemPrompt,
    messages: modelMessages,
    onFinish: async ({ text }) => {
      if (text && text.trim().length > 0) {
        await insertMessage({
          sessionId: session.id,
          role: "assistant",
          content: text,
        });
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
