create extension if not exists pgcrypto;

create table if not exists public.shift_sessions (
  id uuid primary key default gen_random_uuid(),
  guild_id text not null,
  user_id text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shift_sessions_duration_nonnegative
    check (duration_seconds is null or duration_seconds >= 0)
);

create unique index if not exists shift_sessions_one_active_per_user
  on public.shift_sessions (guild_id, user_id)
  where ended_at is null;

create index if not exists shift_sessions_guild_user_started_idx
  on public.shift_sessions (guild_id, user_id, started_at desc);

create index if not exists shift_sessions_guild_started_idx
  on public.shift_sessions (guild_id, started_at desc);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists shift_sessions_set_updated_at on public.shift_sessions;
create trigger shift_sessions_set_updated_at
before update on public.shift_sessions
for each row execute function public.set_updated_at();
