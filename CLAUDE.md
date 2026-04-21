# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Next.js dev server on http://localhost:3000
- `npm run build` — production build (also serves as the type-check step; there is no separate `tsc` or lint script)
- `npm run start` — serve the production build

No test runner is configured.

## Next.js version warning

Per `AGENTS.md`: this repo uses Next.js 16 with React 19. APIs, conventions, and file structure may differ from training data. Before writing Next.js code, consult `node_modules/next/dist/docs/` rather than relying on memory. Heed deprecation notices.

Notable for route handlers: `context.params` is a `Promise<{...}>` and must be awaited (see `app/api/session/[id]/summarize/route.ts`).

## Architecture

This is a single-purpose internal tool: a chat UI that runs a structured discovery conversation with a prospective client, then produces a structured JSON summary at the end.

### Two distinct Anthropic integrations (intentional)

1. **Chat turn** (`app/api/chat/route.ts`): uses `@ai-sdk/anthropic` + `streamText` from `ai` for streaming to the browser via `useChat` (`components/chat.tsx`). Model: `CHAT_MODEL` (`claude-sonnet-4-6`).
2. **End-of-session summary** (`app/api/session/[id]/summarize/route.ts`): uses `@anthropic-ai/sdk` directly with **forced tool use** (`tool_choice: { type: "tool", name: "record_summary" }`) to get validated structured JSON. Model: `SUMMARY_MODEL` (`claude-opus-4-7`). Models are centralized in `lib/anthropic.ts`.

Don't conflate the two. The Vercel AI SDK is for the streaming UI; the raw SDK is for structured extraction.

### Summary schema is dual-declared

`lib/summary-schema.ts` declares the summary shape **twice**: once as a Zod schema (`summarySchema`, used to validate the tool-use input on the server) and once as a hand-written JSON Schema (`summaryToolSchema`, sent to Anthropic as the tool definition). If you change one, change the other — they must stay in lockstep. The Zod schema is the source of truth for `SummaryData`.

### Prompt composition

Prompts live in `prompts/` and are read from disk at module import (`lib/prompts.ts`) — **the dev server must be restarted after editing a prompt file**; hot reload won't pick it up. In production a redeploy is required.

The composed system prompt for a chat turn is: `header + system/role.md + system/methodology.md + system/output-expectations.md + industries/<industry>.md`. The `industry` is a column on `sessions` but is hardcoded to `'av'` at session creation in `app/api/session/route.ts`. To add a new industry: drop `prompts/industries/<slug>.md` and change that default (or make it user-selectable).

`system/output-expectations.md` mirrors the summary schema buckets — keep them aligned when you edit either.

### Server-only boundary

Anything that touches Anthropic or Supabase imports `"server-only"` at the top (`lib/anthropic.ts`, `lib/supabase.ts`, `lib/db.ts`, `lib/prompts.ts`). The client never holds API keys. Supabase uses the **service role key** and bypasses RLS — all reads/writes go through server routes. No user auth exists; the `/review` URLs are treated as unlisted secrets.

### Message persistence pattern

In `app/api/chat/route.ts`, the user message is inserted into Postgres **before** streaming starts, and the assistant message is inserted in the `onFinish` callback after streaming completes. The initial assistant welcome message is inserted in `app/api/session/route.ts` at session creation so the chat UI has something to render on first load. The UI (`components/chat.tsx`) hydrates from server-fetched `initialMessages` and does not re-post history.

### End-of-session flow

`/session/[id]/end` (`app/session/[id]/end/page.tsx`) renders `SummaryReport` immediately if `session.summary` is already populated; otherwise the client component `EndClient` POSTs to `/api/session/[id]/summarize`, which is idempotent (returns the existing summary if one exists, otherwise generates + persists + returns).

### Paths

`@/*` alias maps to the repo root (see `tsconfig.json`), so `@/lib/db` etc. resolve from anywhere.

## Env

Required in `.env.local` (and Vercel project settings):

- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY` — used by `/api/transcribe` for Whisper speech-to-text
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

None should be prefixed `NEXT_PUBLIC_` — the client must never talk to Anthropic, OpenAI, or Supabase directly.

## Database

Single migration at `supabase/migrations/0001_init.sql` — two tables (`sessions`, `messages`) with cascade delete. Apply via Supabase SQL editor or `supabase db push`. No RLS. If you add columns, update the `Session`/`Message` types in `lib/db.ts` and any helpers that select them.
