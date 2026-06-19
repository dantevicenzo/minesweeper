-- Rename display_name -> full_name; drop the old unique constraint explicitly
-- (RENAME COLUMN preserves constraints, so we drop it by name).
alter table public.profiles rename column display_name to full_name;
alter table public.profiles drop constraint if exists profiles_display_name_key;
alter table public.profiles alter column full_name drop not null;

-- Add nullable columns (gate preenche username; email backfilled from auth.users)
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists email text;

-- Unique partial indexes (case-insensitive; both allow multiple NULLs)
create unique index if not exists profiles_username_unique
  on public.profiles(lower(username)) where username is not null;
create unique index if not exists profiles_email_unique
  on public.profiles(lower(email)) where email is not null;

-- Backfill email from auth.users for existing profiles
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

-- Recreate handle_new_user for new schema (username stays NULL until gate)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', null),
    new.email,
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;
