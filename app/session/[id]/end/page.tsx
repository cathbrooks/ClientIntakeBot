import { notFound } from "next/navigation";
import { format } from "date-fns";
import { SummaryReport } from "@/components/summary-report";
import { EndClient } from "./end-client";
import { getSession } from "@/lib/db";

export default async function EndPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession(id);
  if (!session) notFound();

  const meta = {
    contactName: session.contact_name,
    companyName: session.company_name,
    startedAt: format(new Date(session.started_at), "PPpp"),
  };

  return (
    <main className="flex-1 w-full max-w-3xl mx-auto p-6">
      {session.summary ? (
        <SummaryReport summary={session.summary} meta={meta} />
      ) : (
        <EndClient sessionId={id} meta={meta} />
      )}
    </main>
  );
}
