-- CampBase MVP schema for Supabase/PostgreSQL.
-- Run this in Supabase SQL Editor. RLS is enabled on all tables.
-- IMPORTANT: do not put the service_role key in browser code.

create extension if not exists pgcrypto;

create type public.app_role as enum ('owner', 'coach', 'player', 'family');
create type public.match_status as enum ('upcoming', 'played', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.club_members (
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'coach',
  created_at timestamptz not null default now(),
  primary key (club_id, user_id)
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  name text not null,
  category text not null,
  format text not null default 'Futbol 7',
  season text not null,
  created_at timestamptz not null default now()
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  display_name text not null,
  shirt_number integer check (shirt_number between 0 and 99),
  position text not null default 'Polivalente',
  birth_year integer,
  notes_private text,
  created_at timestamptz not null default now()
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  opponent text not null,
  kickoff timestamptz not null,
  competition text not null default 'Lliga',
  venue text not null default 'home' check (venue in ('home','away')),
  status public.match_status not null default 'upcoming',
  goals_for integer check (goals_for is null or goals_for >= 0),
  goals_against integer check (goals_against is null or goals_against >= 0),
  opponent_notes text,
  created_at timestamptz not null default now()
);

create table public.match_player_stats (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  started boolean not null default false,
  minutes integer not null default 0 check (minutes between 0 and 180),
  goals integer not null default 0 check (goals >= 0),
  assists integer not null default 0 check (assists >= 0),
  yellow_cards integer not null default 0 check (yellow_cards >= 0),
  red_cards integer not null default 0 check (red_cards >= 0),
  created_at timestamptz not null default now(),
  unique (match_id, player_id)
);

create table public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  focus text not null default '',
  duration_minutes integer not null default 75 check (duration_minutes between 15 and 240),
  notes_private text,
  created_at timestamptz not null default now()
);

create table public.training_attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.training_sessions(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  status text not null default 'present' check (status in ('present','absent','late','excused')),
  unique (session_id, player_id)
);

create or replace function public.is_club_member(target_club uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.club_members cm where cm.club_id = target_club and cm.user_id = auth.uid()); $$;

create or replace function public.can_access_team(target_team uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (
  select 1 from public.teams t
  join public.club_members cm on cm.club_id = t.club_id
  where t.id = target_team and cm.user_id = auth.uid()
); $$;

create or replace function public.can_edit_team(target_team uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (
  select 1 from public.teams t
  join public.club_members cm on cm.club_id = t.club_id
  where t.id = target_team and cm.user_id = auth.uid() and cm.role in ('owner','coach')
); $$;

alter table public.profiles enable row level security;
alter table public.clubs enable row level security;
alter table public.club_members enable row level security;
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.match_player_stats enable row level security;
alter table public.training_sessions enable row level security;
alter table public.training_attendance enable row level security;

create policy "profiles read self" on public.profiles for select using (id = auth.uid());
create policy "profiles update self" on public.profiles for update using (id = auth.uid());
create policy "clubs read member" on public.clubs for select using (public.is_club_member(id));
create policy "clubs create authenticated" on public.clubs for insert to authenticated with check (created_by = auth.uid());
create policy "members read own club" on public.club_members for select using (user_id = auth.uid() or public.is_club_member(club_id));
create policy "owner can add club members" on public.club_members for insert to authenticated with check (
  exists (select 1 from public.club_members cm where cm.club_id = club_id and cm.user_id = auth.uid() and cm.role = 'owner')
  or (user_id = auth.uid() and role = 'owner')
);
create policy "teams read member" on public.teams for select using (public.is_club_member(club_id));
create policy "teams edit owner coach" on public.teams for all using (
  exists (select 1 from public.club_members cm where cm.club_id = teams.club_id and cm.user_id = auth.uid() and cm.role in ('owner','coach'))
) with check (
  exists (select 1 from public.club_members cm where cm.club_id = teams.club_id and cm.user_id = auth.uid() and cm.role in ('owner','coach'))
);
create policy "players read team member" on public.players for select using (public.can_access_team(team_id));
create policy "players edit coach" on public.players for all using (public.can_edit_team(team_id)) with check (public.can_edit_team(team_id));
create policy "matches read team member" on public.matches for select using (public.can_access_team(team_id));
create policy "matches edit coach" on public.matches for all using (public.can_edit_team(team_id)) with check (public.can_edit_team(team_id));
create policy "stats read team member" on public.match_player_stats for select using (
  exists (select 1 from public.matches m where m.id = match_id and public.can_access_team(m.team_id))
);
create policy "stats edit coach" on public.match_player_stats for all using (
  exists (select 1 from public.matches m where m.id = match_id and public.can_edit_team(m.team_id))
) with check (
  exists (select 1 from public.matches m where m.id = match_id and public.can_edit_team(m.team_id))
);
create policy "training read team member" on public.training_sessions for select using (public.can_access_team(team_id));
create policy "training edit coach" on public.training_sessions for all using (public.can_edit_team(team_id)) with check (public.can_edit_team(team_id));
create policy "attendance read team member" on public.training_attendance for select using (
  exists (select 1 from public.training_sessions s where s.id = session_id and public.can_access_team(s.team_id))
);
create policy "attendance edit coach" on public.training_attendance for all using (
  exists (select 1 from public.training_sessions s where s.id = session_id and public.can_edit_team(s.team_id))
) with check (
  exists (select 1 from public.training_sessions s where s.id = session_id and public.can_edit_team(s.team_id))
);

-- Account provisioning: create a profile on auth signup.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$ begin
  insert into public.profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'display_name',''));
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();
