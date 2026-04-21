create table sessions (
  id uuid primary key default gen_random_uuid(),
  contact_name text not null,
  company_name text not null,
  email text,
  industry text not null default 'av',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  summary jsonb
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index on messages (session_id, created_at);
