import { notFound } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";
import { MessageBubble } from "@/components/message-bubble";
import { SummaryReport } from "@/components/summary-report";
import { Separator } from "@/components/ui/separator";
import { getSession, listMessages } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession(id);
  if (!session) notFound();

  const messages = await listMessages(id);

  const meta = {
    contactName: session.contact_name,
    companyName: session.company_name,
    startedAt: format(new Date(session.started_at), "PPpp"),
  };

  return (
    <main className="flex-1 w-full max-w-3xl mx-auto p-6 space-y-10">
      <div>
        <Link
          href="/review"
          className="text-xs text-muted-foreground hover:underline"
        >
          ← All sessions
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {session.company_name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {session.contact_name}
          {session.email ? ` · ${session.email}` : ""} ·{" "}
          {format(new Date(session.started_at), "PPpp")}
          {session.ended_at
            ? ` → ${format(new Date(session.ended_at), "PPpp")}`
            : ""}
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">Transcript</h2>
        <Separator className="mb-4" />
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No messages.</p>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => (
              <MessageBubble key={m.id} role={m.role}>
                {m.content}
              </MessageBubble>
            ))}
          </div>
        )}
      </section>

      {session.summary ? (
        <SummaryReport summary={session.summary} meta={meta} />
      ) : (
        <p className="text-sm text-muted-foreground italic">
          No summary generated yet.
        </p>
      )}
    </main>
  );
}
