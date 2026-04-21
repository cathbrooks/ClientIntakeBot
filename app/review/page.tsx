import Link from "next/link";
import { format } from "date-fns";
import { listSessions } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const sessions = await listSessions();

  return (
    <main className="flex-1 w-full max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Sessions</h1>

      {sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sessions yet.</p>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Company</th>
                <th className="px-4 py-2 font-medium">Contact</th>
                <th className="px-4 py-2 font-medium">Started</th>
                <th className="px-4 py-2 font-medium">Ended</th>
                <th className="px-4 py-2 font-medium">Summary</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="px-4 py-2 font-medium">{s.company_name}</td>
                  <td className="px-4 py-2">{s.contact_name}</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {format(new Date(s.started_at), "PP p")}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {s.ended_at ? format(new Date(s.ended_at), "PP p") : "—"}
                  </td>
                  <td className="px-4 py-2">
                    {s.summary ? (
                      <span className="text-xs rounded bg-muted px-2 py-0.5">
                        ✓
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      className="text-sm underline underline-offset-2 hover:text-primary"
                      href={`/review/${s.id}`}
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
