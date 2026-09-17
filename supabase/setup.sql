-- ============================================================
-- HALLOWMARSH: full database setup
-- One file for a fresh Supabase project. Run once in the SQL Editor.
-- Equivalent to applying 0001, 0002, 0003, and 0004 in order, minus the
-- create-then-replace steps the migrations needed while evolving.
--
-- Contents:
--   1. Extensions and helpers
--   2. Tables and indexes
--   3. Triggers (updated_at, reaction counters, signup)
--   4. Seed data (roles, permissions, reactions, projects)
--   5. Row Level Security (member-only reads, owner-only writes)
--   6. Storage bucket and policies
--   7. Backfill for accounts that existed before this ran
--
-- Auth lives in Supabase's managed auth.users and is never duplicated here.
-- Invite codes are inserted manually, for example:
--   insert into public.invite_codes (code, uses_remaining) values ('MARSH-ABCD', 1);
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS AND HELPERS
-- ============================================================

create extension if not exists pg_trgm;      -- trigram indexing for search
create extension if not exists citext;       -- case-insensitive handles

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ============================================================
-- 2. TABLES AND INDEXES
-- ============================================================

-- ---------- profiles (1:1 with auth.users) ----------
create table public.profiles (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  handle         citext unique not null
                 check (handle ~ '^[a-z0-9_]{3,24}$'),
  display_name   text check (char_length(display_name) <= 50),
  bio            text check (char_length(bio) <= 500),
  avatar_url     text,
  banner_url     text,
  custom_status  text check (char_length(custom_status) <= 140),
  presence       text not null default 'online'
                 check (presence in ('online','away','busy','invisible')),
  last_seen_at   timestamptz not null default now(),
  view_count     bigint not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create index profiles_handle_trgm on public.profiles using gin (handle gin_trgm_ops);

-- ---------- social graph ----------
create table public.follows (
  follower_id  uuid not null references public.profiles(user_id) on delete cascade,
  followee_id  uuid not null references public.profiles(user_id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index follows_followee_idx on public.follows (followee_id);

create table public.blocks (
  blocker_id  uuid not null references public.profiles(user_id) on delete cascade,
  blocked_id  uuid not null references public.profiles(user_id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table public.mutes (
  muter_id   uuid not null references public.profiles(user_id) on delete cascade,
  muted_id   uuid not null references public.profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (muter_id, muted_id),
  check (muter_id <> muted_id)
);

-- ---------- posts ----------
create table public.posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references public.profiles(user_id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 2000),
  visibility  text not null default 'public'
              check (visibility in ('public','friends','group')),
  deleted_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

create index posts_feed_idx on public.posts (created_at desc, id desc) where deleted_at is null;
create index posts_author_idx on public.posts (author_id, created_at desc);

-- ---------- reactions (registry-driven) ----------
create table public.reaction_types (
  key    text primary key,
  label  text not null,
  glyph  text not null,
  sort   int  not null default 0,
  active boolean not null default true
);

create table public.reactions (
  user_id        uuid not null references public.profiles(user_id) on delete cascade,
  reactable_type text not null check (reactable_type in ('post','comment')),
  reactable_id   uuid not null,
  type           text not null references public.reaction_types(key),
  created_at     timestamptz not null default now(),
  primary key (user_id, reactable_type, reactable_id, type)
);

create table public.post_reaction_counts (
  post_id uuid primary key references public.posts(id) on delete cascade,
  count   bigint not null default 0
);

-- ---------- roles & permissions ----------
create table public.roles (
  key        text primary key,
  name       text not null,
  rank       int  not null,             -- higher = more authority
  is_system  boolean not null default false
);

create table public.permissions (
  key  text primary key               -- e.g. 'posts.moderate'
);

create table public.role_permissions (
  role_key       text not null references public.roles(key) on delete cascade,
  permission_key text not null references public.permissions(key) on delete cascade,
  primary key (role_key, permission_key)
);

create table public.user_roles (
  user_id    uuid not null references public.profiles(user_id) on delete cascade,
  role_key   text not null references public.roles(key) on delete cascade,
  granted_by uuid references public.profiles(user_id),
  granted_at timestamptz not null default now(),
  expires_at timestamptz,               -- temporary moderator roles
  primary key (user_id, role_key)
);

-- ---------- observability ----------
create table public.platform_metrics (
  date     date primary key,
  counters jsonb not null default '{}'::jsonb
);

create table public.audit_log (
  id          bigint generated always as identity primary key,
  actor_id    uuid,
  action      text not null,
  target_type text,
  target_id   text,
  payload     jsonb,
  created_at  timestamptz not null default now()
);
-- audit_log is append-only: inserts only, never updated or deleted.

-- ---------- invite-only beta ----------
create table public.invite_codes (
  code           text primary key check (code = upper(trim(code)) and char_length(code) between 6 and 64),
  uses_remaining integer not null default 1 check (uses_remaining >= 0),
  created_at     timestamptz not null default now(),
  used_at        timestamptz
);

-- ---------- portfolio projects ----------
create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(title) between 1 and 80),
  description text not null default '' check (char_length(description) <= 500),
  -- Repository as "owner/name" on GitHub. Empty when there is no public repo.
  repo        text not null default '' check (char_length(repo) <= 120),
  image_url   text check (image_url is null or char_length(image_url) <= 500),
  sort        int  not null default 0,
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create index projects_order_idx on public.projects (sort, created_at);

-- ============================================================
-- 3. TRIGGERS
-- ============================================================

-- Denormalized reaction counter, maintained transactionally so the feed
-- never N+1s. DELETE triggers cannot reference NEW (42P17), so the trigger
-- is split by event and each WHEN clause touches only the row it has.
create or replace function public.bump_post_reaction_count()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.post_reaction_counts (post_id, count)
    values (new.reactable_id, 1)
    on conflict (post_id) do update set count = post_reaction_counts.count + 1;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.post_reaction_counts
    set count = greatest(count - 1, 0) where post_id = old.reactable_id;
    return old;
  end if;
end $$;

create trigger reactions_bump_post_count_insert
  after insert on public.reactions
  for each row
  when (new.reactable_type = 'post')
  execute function public.bump_post_reaction_count();

create trigger reactions_bump_post_count_delete
  after delete on public.reactions
  for each row
  when (old.reactable_type = 'post')
  execute function public.bump_post_reaction_count();

-- has_role: security-definer so RLS policies can call it without recursion.
create or replace function public.has_role(uid uuid, min_rank int)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.key = ur.role_key
    where ur.user_id = uid
      and r.rank >= min_rank
      and (ur.expires_at is null or ur.expires_at > now())
  );
$$;

-- Runs on every signup: consumes one invite use, then creates the profile.
-- The handle the user chose is used when it is valid and free; otherwise we
-- fall back to something derived from the email and user id.
-- Bootstrap: the earliest confirmed account becomes Owner.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  requested_code   text := upper(trim(coalesce(new.raw_user_meta_data->>'invite_code', '')));
  requested_handle citext := nullif(lower(trim(coalesce(new.raw_user_meta_data->>'handle', ''))), '');
  candidate        citext;
begin
  update public.invite_codes
  set uses_remaining = uses_remaining - 1, used_at = coalesce(used_at, now())
  where code = requested_code and uses_remaining > 0;

  if not found then
    raise exception 'invite_required';
  end if;

  if requested_handle is not null
     and requested_handle ~ '^[a-z0-9_]{3,24}$'
     and not exists (select 1 from public.profiles where handle = requested_handle) then
    candidate := requested_handle;
  else
    candidate := left(coalesce(requested_handle, split_part(new.email, '@', 1)), 17)
                 || '_' || left(new.id::text, 4);
    if candidate !~ '^[a-z0-9_]{3,24}$'
       or exists (select 1 from public.profiles where handle = candidate) then
      candidate := 'member_' || left(new.id::text, 8);
    end if;
  end if;

  insert into public.profiles (user_id, handle, display_name)
  values (
    new.id,
    candidate,
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 4. SEED DATA
-- ============================================================

insert into public.reaction_types (key, label, glyph, sort) values
  ('like', 'Like', '👍', 1),
  ('love', 'Love', '❤️', 2),
  ('laugh', 'Laugh', '😄', 3),
  ('interesting', 'Interesting', '🤔', 4),
  ('support', 'Support', '🫂', 5);

insert into public.roles (key, name, rank, is_system) values
  ('owner',      'Owner',      100, true),
  ('admin',      'Admin',       80, true),
  ('moderator',  'Moderator',   60, true),
  ('member',     'Member',      40, true),
  ('new_member', 'New Member',  20, true);

insert into public.permissions (key) values
  ('posts.create'), ('posts.moderate'), ('comments.moderate'),
  ('users.suspend'), ('reports.view'), ('reports.resolve'),
  ('themes.manage'), ('currency.manage'), ('roles.manage'), ('audit.view');

-- Least privilege; moderator grants are added per-phase.
insert into public.role_permissions (role_key, permission_key)
select r.key, p.key
from public.roles r
join public.permissions p on true
where r.key in ('owner', 'admin');

insert into public.role_permissions (role_key, permission_key)
select 'moderator', p.key from (values ('comments.moderate'),('reports.view')) as p(key);

insert into public.role_permissions (role_key, permission_key)
select r.key, 'posts.create'
from public.roles r where r.key in ('member','new_member','moderator');

-- Portfolio projects shown on the public landing page. Guarded so re-running
-- never duplicates rows.
insert into public.projects (title, description, repo, sort)
select v.title, v.description, v.repo, v.sort
from (
  values
    ('Hallowmarsh', 'This site: a small invite-only community and portfolio.', 'hallowmarshmallow/marshy.cc.cd', 1),
    ('MarshAPI', 'A fork of the ClassicUs API, kept updated for 2026.8.9.', 'hallowmarshmallow/ClassicUs.MarshAPI', 2),
    ('ClassicUs.Reactor', 'A modded handshake for the game Classicus.', 'hallowmarshmallow/ClassicUs.Reactor', 3),
    ('Classicus decompiled', 'A decompiled dump of Classic Us plus Il2Cpp decompiler tooling.', 'hallowmarshmallow/classicus-decompiled', 4),
    ('townofroles', 'A small project. Description to come.', 'hallowmarshmallow/townofroles', 5)
) as v(title, description, repo, sort)
where not exists (select 1 from public.projects);

-- ============================================================
-- 5. ROW LEVEL SECURITY
-- Server-side authorization is authoritative; the UI mirror is cosmetic.
-- ============================================================

alter table public.profiles             enable row level security;
alter table public.follows              enable row level security;
alter table public.blocks               enable row level security;
alter table public.mutes                enable row level security;
alter table public.posts                enable row level security;
alter table public.reaction_types       enable row level security;
alter table public.reactions            enable row level security;
alter table public.post_reaction_counts enable row level security;
alter table public.roles                enable row level security;
alter table public.permissions          enable row level security;
alter table public.role_permissions     enable row level security;
alter table public.user_roles           enable row level security;
alter table public.platform_metrics     enable row level security;
alter table public.audit_log            enable row level security;
alter table public.invite_codes         enable row level security;
alter table public.projects             enable row level security;

-- invite_codes: no client-facing policy. The signup trigger is the only path.

-- profiles: members read members; each user updates only their own row.
create policy profiles_read_members on public.profiles for select
  using (auth.uid() is not null);
create policy profiles_update on public.profiles for update
  using (auth.uid() = user_id);

-- follows: read inside the marsh; create/delete only your own edges.
create policy follows_read_members on public.follows for select
  using (auth.uid() is not null);
create policy follows_insert on public.follows for insert
  with check (auth.uid() = follower_id);
create policy follows_delete on public.follows for delete
  using (auth.uid() = follower_id);

-- blocks/mutes: strictly private to their owner.
create policy blocks_owner on public.blocks for all
  using (auth.uid() = blocker_id) with check (auth.uid() = blocker_id);
create policy mutes_owner on public.mutes for all
  using (auth.uid() = muter_id) with check (auth.uid() = muter_id);

-- posts: member-only reads, member visibility only, soft-delete by author.
create policy posts_read_members on public.posts for select using (
  auth.uid() is not null
  and deleted_at is null
  and (visibility = 'friends' or author_id = auth.uid())
);

create policy posts_insert_members on public.posts for insert
  with check (auth.uid() = author_id and visibility = 'friends');

create policy posts_update on public.posts for update
  using (auth.uid() = author_id and deleted_at is null);

-- soft-delete own posts; moderators may hard-remove.
create policy posts_delete on public.posts for delete
  using (
    auth.uid() = author_id
    or public.has_role(auth.uid(), 60)  -- moderator+
  );

-- reactions registry: members read, admins manage.
create policy reaction_types_read_members on public.reaction_types for select
  using (auth.uid() is not null and active);
create policy reaction_types_manage on public.reaction_types for all
  using (public.has_role(auth.uid(), 80)) with check (public.has_role(auth.uid(), 80));

create policy reactions_read_members on public.reactions for select
  using (auth.uid() is not null);
create policy reactions_write on public.reactions for insert
  with check (auth.uid() = user_id);
create policy reactions_delete on public.reactions for delete
  using (auth.uid() = user_id);

create policy counts_read_members on public.post_reaction_counts for select
  using (auth.uid() is not null);

-- roles: visible to all (the UI mirror is cosmetic); manageable by owner only.
create policy roles_read on public.roles for select using (true);
create policy perms_read on public.permissions for select using (true);
create policy role_perms_read on public.role_permissions for select using (true);
create policy role_perms_manage on public.role_permissions for all
  using (public.has_role(auth.uid(), 100)) with check (public.has_role(auth.uid(), 100));
create policy user_roles_read on public.user_roles for select using (true);
create policy user_roles_manage on public.user_roles for all
  using (public.has_role(auth.uid(), 100)) with check (public.has_role(auth.uid(), 100));

-- metrics and audit: owner only.
create policy metrics_read on public.platform_metrics for select
  using (public.has_role(auth.uid(), 100));
create policy audit_read on public.audit_log for select
  using (public.has_role(auth.uid(), 100));

-- projects: the landing page is public, so published rows are readable by
-- anyone; every write is owner-only.
create policy projects_read on public.projects for select
  using (published or public.has_role(auth.uid(), 100));
create policy projects_write on public.projects for all
  using (public.has_role(auth.uid(), 100))
  with check (public.has_role(auth.uid(), 100));

-- ============================================================
-- 6. STORAGE (avatars, banners, project images)
-- ============================================================

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Anyone can fetch an uploaded image by URL (the bucket is public).
drop policy if exists media_read on storage.objects;
create policy media_read on storage.objects for select
  using (bucket_id = 'media');

-- Only the owner may upload, replace, or delete images.
drop policy if exists media_write on storage.objects;
create policy media_write on storage.objects for insert
  with check (bucket_id = 'media' and public.has_role(auth.uid(), 100));

drop policy if exists media_update on storage.objects;
create policy media_update on storage.objects for update
  using (bucket_id = 'media' and public.has_role(auth.uid(), 100))
  with check (bucket_id = 'media' and public.has_role(auth.uid(), 100));

drop policy if exists media_delete on storage.objects;
create policy media_delete on storage.objects for delete
  using (bucket_id = 'media' and public.has_role(auth.uid(), 100));

-- ============================================================
-- 7. BACKFILL for accounts that existed BEFORE this file ran
-- (for example an owner account created via the dashboard first).
-- The signup trigger only fires on future inserts. The EARLIEST CONFIRMED
-- account becomes owner; unconfirmed duplicates are ignored.
-- ============================================================

insert into public.profiles (user_id, handle, display_name)
select
  u.id,
  case
    when not exists (
      select 1 from public.profiles p2
      where p2.handle = split_part(u.email, '@', 1)
    )
    then split_part(u.email, '@', 1)
    else split_part(u.email, '@', 1) || '_' || left(u.id::text, 4)
  end,
  coalesce(nullif(u.raw_user_meta_data->>'display_name', ''), split_part(u.email, '@', 1))
from auth.users u
where u.email is not null
  and not exists (select 1 from public.profiles p where p.user_id = u.id);

insert into public.user_roles (user_id, role_key)
select p.user_id,
  case
    when p.user_id = (
      select p2.user_id
      from public.profiles p2
      join auth.users u2 on u2.id = p2.user_id
      where u2.email_confirmed_at is not null
      order by u2.email_confirmed_at asc, p2.user_id asc
      limit 1
    )
      then 'owner'
    else 'new_member'
  end
from public.profiles p
where not exists (select 1 from public.user_roles ur where ur.user_id = p.user_id);
