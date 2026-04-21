# Client Intake Bot

Internal web tool for running a structured discovery conversation with a prospective client before we scope and build them a custom CRM. First use: an AV (audio/visual production) company. The `industry` is hardcoded to `'av'` on session creation; the conversation logic itself is industry-agnostic so we can point it at a new industry later by adding a file under `prompts/industries/`.

## Stack

- Next.js (App Router, TypeScript)
- Tailwind CSS + shadcn/ui
- Vercel AI SDK (`ai`) with `@ai-sdk/anthropic` for the streaming chat
- `@anthropic-ai/sdk` directly for the end-of-session summary (non-streaming, forced tool use for structured JSON)
- Postgres via Supabase (`@supabase/supabase-js`, service role key, server-only)

Chat model: `claude-sonnet-4-6`. Summary model: `claude-opus-4-7`.

## Local setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in:
   - `ANTHROPIC_API_KEY` — from [console.anthropic.com](https://console.anthropic.com)
   - `SUPABASE_URL` — e.g. `https://<project-ref>.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` — from Supabase dashboard, Project Settings → API
3. Run the database migration against your Supabase project (see below).
4. `npm run dev` and open <http://localhost:3000>.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Open the SQL editor and paste the contents of `supabase/migrations/0001_init.sql`, then run it. (Or use the Supabase CLI: `supabase db push`.)
3. Confirm `sessions` and `messages` tables exist. No RLS is configured — all access is from server routes using the service role key.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the repo into Vercel.
3. Set the three env vars (`ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) in Project Settings → Environment Variables. None of them should be `NEXT_PUBLIC_` — the client never talks to Supabase or Anthropic directly.
4. Deploy. The `/review` and `/review/[id]` URLs are unauthenticated but unlisted — treat the URL as the secret.

## Editing the prompts

All prompts live under `prompts/` and are read at server startup.

- `prompts/system/role.md` — bot identity, posture, tone (industry-agnostic)
- `prompts/system/methodology.md` — discovery methodology and question-asking principles (industry-agnostic)
- `prompts/system/output-expectations.md` — the buckets the bot listens for and summarizes back during the conversation (industry-agnostic; mirrors the summary schema)
- `prompts/industries/av.md` — AV vocabulary, common entities, workflows, integrations, pain points
- `prompts/summary/extract.md` — extraction prompt used by the summarize endpoint

The composed system prompt for a chat turn is `role + methodology + output-expectations + <industry>` plus a short header with the contact's first name and company. Files are loaded at module import, so the Next.js dev server picks up edits on restart; in production a redeploy is needed.

To point this at a new industry: add `prompts/industries/<slug>.md` and update the `industry` default on `/api/session/route.ts`.

## Routes

- `/` — landing + intake form
- `/session/[id]` — chat
- `/session/[id]/end` — generates (or renders) the structured summary
- `/review` — list of all sessions
- `/review/[id]` — transcript + summary for one session

## Structure

```
app/                   routes & API handlers
components/            chat UI, intake form, summary report, shadcn ui/
lib/                   supabase client, anthropic client, prompt composition, summary schema, db helpers
prompts/               prompt files (edit these to change behavior)
supabase/migrations/   SQL migration
```
