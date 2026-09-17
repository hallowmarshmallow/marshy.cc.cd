-- ============================================================
-- HALLOWMARSH — Invite-only beta
-- New accounts need a one-time invite code. Existing accounts remain valid.
-- Seed codes manually as the owner, for example:
--   insert into public.invite_codes (code, uses_remaining) values ('MARSH-ABCD', 1);
-- ============================================================

create table if not exists public.invite_codes (
  code           text primary key check (code = upper(trim(code)) and char_length(code) between 6 and 64),
  uses_remaining integer not null default 1 check (uses_remaining >= 0),
  created_at     timestamptz not null default now(),
  used_at       timestamptz
);

alter table public.invite_codes enable row level security;

-- No client-facing read/write policy: the signup trigger is the only path.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  requested_code text := upper(trim(coalesce(new.raw_user_meta_data->>'invite_code', '')));
begin
  update public.invite_codes
  set uses_remaining = uses_remaining - 1, used_at = coalesce(used_at, now())
  where code = requested_code and uses_remaining > 0;

  if not found then
    raise exception 'invite_required';
  end if;

  insert into public.profiles (user_id, handle, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'handle', split_part(new.email, '@', 1))
      || '_' || left(new.id::text, 4),
    coalesce(new.raw_user_meta_data->>'display_name', 'newcomer')
  );

  if exists (
    select 1 from public.profiles p
    join auth.users u on u.id = p.user_id
    where u.email_confirmed_at is not null
      and p.user_id <> new.id
  ) then
    insert into public.user_roles (user_id, role_key)
    values (new.id, 'new_member');
  else
    insert into public.user_roles (user_id, role_key)
    values (new.id, 'owner');
  end if;
  return new;
end $$;

-- The trigger created in 0001 keeps the same name and now uses the guarded function.

-- Preserve existing content while moving it behind the member wall.
update public.posts
set visibility = 'friends'
where visibility = 'public';

drop policy if exists profiles_read on public.profiles;
create policy profiles_read_members on public.profiles for select using (auth.uid() is not null);

drop policy if exists follows_read on public.follows;
create policy follows_read_members on public.follows for select using (auth.uid() is not null);

drop policy if exists posts_read_public on public.posts;
create policy posts_read_members on public.posts for select using (
  auth.uid() is not null
  and deleted_at is null
  and (visibility = 'friends' or author_id = auth.uid())
);

drop policy if exists posts_insert on public.posts;
create policy posts_insert_members on public.posts for insert
  with check (auth.uid() = author_id and visibility = 'friends');

drop policy if exists reaction_types_read on public.reaction_types;
create policy reaction_types_read_members on public.reaction_types for select using (auth.uid() is not null and active);

drop policy if exists reactions_read on public.reactions;
create policy reactions_read_members on public.reactions for select using (auth.uid() is not null);

drop policy if exists counts_read on public.post_reaction_counts;
create policy counts_read_members on public.post_reaction_counts for select using (auth.uid() is not null);
