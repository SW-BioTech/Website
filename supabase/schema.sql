-- ===================================================================
-- SW Biotech — Live Q&A schema
-- Paste this whole file into the Supabase SQL Editor and run it once.
--
-- Prerequisites in the Supabase dashboard:
--   1. Authentication -> Sign In / Providers -> enable "Anonymous sign-ins".
--   2. After running this, set a real moderator passphrase (see bottom).
-- ===================================================================

-- ---- Tables --------------------------------------------------------

create table if not exists public.rooms (
  code        text primary key,
  title       text,
  created_at  timestamptz not null default now()
);

create table if not exists public.questions (
  id          uuid primary key default gen_random_uuid(),
  room_code   text not null references public.rooms (code) on delete cascade,
  body        text not null check (char_length(body) between 1 and 280),
  vote_count  integer not null default 0,
  user_id     uuid not null default auth.uid(),
  created_at  timestamptz not null default now()
);

create index if not exists questions_room_idx on public.questions (room_code);

create table if not exists public.votes (
  question_id uuid not null references public.questions (id) on delete cascade,
  user_id     uuid not null default auth.uid(),
  created_at  timestamptz not null default now(),
  primary key (question_id, user_id)
);

-- Private key/value config. No RLS policies are added for this table, so it is
-- unreadable by the anon/authenticated API. Only SECURITY DEFINER functions
-- (below) can read it. This is where the moderator passphrase lives.
create table if not exists public.app_config (
  key   text primary key,
  value text not null
);

insert into public.app_config (key, value)
values ('mod_passphrase', 'CHANGE_ME_SECRET')
on conflict (key) do nothing;

-- ---- Vote count kept in sync via trigger ---------------------------

create or replace function public.sync_vote_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.questions
       set vote_count = vote_count + 1
     where id = new.question_id;
  elsif tg_op = 'DELETE' then
    update public.questions
       set vote_count = greatest(vote_count - 1, 0)
     where id = old.question_id;
  end if;
  return null;
end;
$$;

drop trigger if exists votes_count_trg on public.votes;
create trigger votes_count_trg
after insert or delete on public.votes
for each row execute function public.sync_vote_count();

-- ---- Server-side submit rate limit (one question / 15s per user) ---

create or replace function public.enforce_question_rate_limit()
returns trigger
language plpgsql
as $$
declare
  recent_count int;
begin
  select count(*) into recent_count
    from public.questions
   where user_id = new.user_id
     and created_at > now() - interval '15 seconds';

  if recent_count >= 1 then
    raise exception 'rate_limit: please wait a few seconds before posting again';
  end if;

  return new;
end;
$$;

drop trigger if exists questions_rate_limit_trg on public.questions;
create trigger questions_rate_limit_trg
before insert on public.questions
for each row execute function public.enforce_question_rate_limit();

-- ---- Moderator delete (passphrase checked server-side) -------------
-- The passphrase never ships in the front-end bundle; the moderator types it
-- in and it is verified here against app_config.

create or replace function public.delete_question(p_question_id uuid, p_passphrase text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  stored text;
begin
  select value into stored from public.app_config where key = 'mod_passphrase';

  if stored is null or p_passphrase is distinct from stored then
    raise exception 'unauthorized';
  end if;

  delete from public.questions where id = p_question_id;
  return true;
end;
$$;

grant execute on function public.delete_question(uuid, text) to anon, authenticated;

-- ---- Admin: verify passphrase + create panels ----------------------
-- Panel creation is restricted to organisers. Both functions check the same
-- moderator passphrase server-side, so the front-end "Start a panel" form can
-- be hidden until verified without that being the only line of defence.

create or replace function public.verify_admin(p_passphrase text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_config
     where key = 'mod_passphrase' and value = p_passphrase
  );
$$;

grant execute on function public.verify_admin(text) to anon, authenticated;

create or replace function public.create_room(p_passphrase text, p_title text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  stored    text;
  alphabet  text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  new_code  text;
  i         int;
begin
  select value into stored from public.app_config where key = 'mod_passphrase';
  if stored is null or p_passphrase is distinct from stored then
    raise exception 'unauthorized';
  end if;

  loop
    new_code := '';
    for i in 1..5 loop
      new_code := new_code || substr(alphabet, floor(random() * length(alphabet))::int + 1, 1);
    end loop;
    begin
      insert into public.rooms (code, title) values (new_code, nullif(btrim(p_title), ''));
      return new_code;
    exception when unique_violation then
      -- extremely unlikely; just generate another code
    end;
  end loop;
end;
$$;

grant execute on function public.create_room(text, text) to anon, authenticated;

-- ---- Row Level Security --------------------------------------------

alter table public.rooms      enable row level security;
alter table public.questions  enable row level security;
alter table public.votes      enable row level security;
alter table public.app_config enable row level security; -- intentionally no policies

-- rooms: anyone may read (so audiences can join by code), but creation is
-- admin-only via create_room(). There is intentionally NO public INSERT policy.
drop policy if exists rooms_read on public.rooms;
create policy rooms_read on public.rooms for select using (true);

drop policy if exists rooms_insert on public.rooms;

-- questions: anyone may read; you may insert rows attributed to yourself.
-- No update/delete policy => deletion only happens via delete_question().
drop policy if exists questions_read on public.questions;
create policy questions_read on public.questions for select using (true);

drop policy if exists questions_insert on public.questions;
create policy questions_insert on public.questions for insert
  with check (auth.uid() = user_id);

-- votes: anyone may read; you may add/remove only your own vote.
-- The (question_id, user_id) primary key is what prevents double-voting.
drop policy if exists votes_read on public.votes;
create policy votes_read on public.votes for select using (true);

drop policy if exists votes_insert on public.votes;
create policy votes_insert on public.votes for insert
  with check (auth.uid() = user_id);

drop policy if exists votes_delete on public.votes;
create policy votes_delete on public.votes for delete
  using (auth.uid() = user_id);

-- ---- Realtime ------------------------------------------------------
-- Stream new questions, live vote counts, and moderator deletes to clients.

alter publication supabase_realtime add table public.questions;

-- REPLICA IDENTITY FULL puts the whole row in DELETE payloads. Without this,
-- deletes only carry the primary key, so the room_code filter on the client
-- subscription can't match them and deletes won't propagate live.
alter table public.questions replica identity full;

-- ===================================================================
-- FINAL STEP — set your moderator passphrase (change the value!):
--
--   update public.app_config set value = 'your-strong-passphrase'
--    where key = 'mod_passphrase';
--
-- This same passphrase is used by organisers to create panels (the "Start a
-- panel" form on /#/qa) and to unlock moderator delete controls inside a room
-- (open it with ?mod=1, e.g. https://<your-site>/#/qa/ABC123?mod=1).
-- ===================================================================
