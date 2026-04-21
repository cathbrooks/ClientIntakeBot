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
      <header className="border-b px-4 py-3 flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-medium leading-tight">
            {session.company_name}
          </div>
          <div className="text-xs text-muted-foreground leading-tight">
            {session.contact_name}
            {session.email ? ` · ${session.email}` : ""}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Industry: {session.industry}
        </div>
      </header>

      <div className="flex-1 min-h-0 max-w-3xl w-full mx-auto">
        <Chat sessionId={id} initialMessages={initialMessages} />
      </div>
    </div>
  );
}
