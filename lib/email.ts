import "server-only";
import { Resend } from "resend";
import { summaryToMarkdown } from "./summary-to-markdown";
import type { SummaryData } from "./summary-schema";

const resend = new Resend(process.env.RESEND_API_KEY);

const RECIPIENT = "cat@lightpier.io";

export async function sendSummaryEmail(
  summary: SummaryData,
  meta: { contactName: string; companyName: string; startedAt: string },
): Promise<void> {
  const markdown = summaryToMarkdown(summary, meta);

  // Convert minimal markdown to HTML for the email body
  const html = `<pre style="font-family:monospace;white-space:pre-wrap;max-width:700px">${markdown.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`;

  await resend.emails.send({
    from: "ClientIntakeBot <noreply@lightpier.io>",
    to: RECIPIENT,
    subject: `Discovery Summary — ${meta.companyName} (${meta.contactName})`,
    text: markdown,
    html,
  });
}
