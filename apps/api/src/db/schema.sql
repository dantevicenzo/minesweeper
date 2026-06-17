-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Profiles (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text unique not null,
  avatar_url text,
  xp integer not null default 0,
  level integer not null default 1,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Games
create type game_status as enum ('in_progress', 'won', 'lost');
create type difficulty as enum ('easy', 'medium', 'hard', 'custom');

create table if not exists public.games (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete set null,
  width integer not null,
  height integer not null,
  mine_count integer not null,
  state jsonb not null,
  difficulty difficulty not null,
  status game_status not null default 'in_progress',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_ms integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Leaderboard
create table if not exists public.leaderboard_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  difficulty difficulty not null,
  duration_ms integer not null,
  created_at timestamptz not null default now()
);

-- Achievements (definitions)
create table if not exists public.achievements (
  id uuid primary key default uuid_generate_v4(),
  key text unique not null,
  name_key text not null,
  description_key text not null,
  icon text not null,
  criteria jsonb not null default '{}'::jsonb
);

-- User achievements
create table if not exists public.user_achievements (
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  notified boolean not null default false,
  primary key (user_id, achievement_id)
);

-- XP events
create table if not exists public.xp_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null,
  reason text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_games_user_id on public.games(user_id);
create index if not exists idx_games_status on public.games(status);
create index if not exists idx_leaderboard_difficulty on public.leaderboard_entries(difficulty, duration_ms);
create index if not exists idx_xp_events_user_id on public.xp_events(user_id);
create index if not exists idx_profiles_xp on public.profiles(xp desc);

-- RLS
alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.leaderboard_entries enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.xp_events enable row level security;

-- Profiles: user can read/update own profile; admins can read/update all
create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Games: user can CRUD own games; anyone can read completed games for leaderboard
create policy "Users CRUD own games"
  on public.games for all
  using (auth.uid() = user_id);

create policy "Anyone read completed games"
  on public.games for select
  using (status != 'in_progress' or user_id is null);

-- Leaderboard: anyone can read; only insert own entries
create policy "Anyone read leaderboard"
  on public.leaderboard_entries for select
  using (true);

create policy "Users insert own leaderboard entry"
  on public.leaderboard_entries for insert
  with check (auth.uid() = user_id);

-- Achievements: anyone can read
create policy "Anyone read achievements"
  on public.achievements for select
  using (true);

-- User achievements: can read own; system inserts
create policy "Users read own achievements"
  on public.user_achievements for select
  using (auth.uid() = user_id);

-- XP events: can read own
create policy "Users read own xp"
  on public.xp_events for select
  using (auth.uid() = user_id);

-- Function to auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email, 'Player'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

-- Trigger for new user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
