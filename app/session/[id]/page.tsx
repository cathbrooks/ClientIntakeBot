import { notFound } from "next/navigation";
import { Chat } from "@/components/chat";
import { getSession, listMessages } from "@/lib/db";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession(id);
  if (!session) notFound();

  const messages = await listMessages(id);
  const initialMessages = messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
  }));

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className="border-b bg-card/50 backdrop-blur-sm px-4 py-3 flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold leading-tight">
            {session.company_name}
          </div>
          <div className="font-mono text-xs text-muted-foreground leading-tight mt-0.5">
            {session.contact_name}
            {session.email ? ` · ${session.email}` : ""}
          </div>
        </div>
        <div className="font-mono text-xs text-primary/70 uppercase tracking-widest">
          {session.industry}
        </div>
      </header>

      <div className="flex-1 min-h-0 max-w-3xl w-full mx-auto">
        <Chat sessionId={id} initialMessages={initialMessages} />
      </div>
    </div>
  );
}
