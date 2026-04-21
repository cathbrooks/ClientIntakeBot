import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSession, insertMessage } from "@/lib/db";
import { buildWelcomeMessage } from "@/lib/prompts";

export const runtime = "nodejs";

const intakeSchema = z.object({
  contactName: z.string().min(1).max(200),
  companyName: z.string().min(1).max(200),
  email: z
    .string()
    .email()
    .max(200)
    .nullable()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = intakeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const session = await createSession({
    contactName: parsed.data.contactName,
    companyName: parsed.data.companyName,
    email: parsed.data.email ?? null,
    industry: "av",
  });

  await insertMessage({
    sessionId: session.id,
    role: "assistant",
    content: buildWelcomeMessage({
      contactName: session.contact_name,
      companyName: session.company_name,
    }),
  });

  return NextResponse.json({ id: session.id });
}
