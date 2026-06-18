alter table public.profiles
  add column if not exists banned boolean not null default false,
  add column if not exists banned_at timestamptz;
