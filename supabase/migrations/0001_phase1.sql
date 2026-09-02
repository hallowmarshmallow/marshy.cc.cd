-- ============================================================
-- HALLOWMARSH — Phase 1 schema migration (§6.1 Phase-1 subset)
-- Apply: supabase.com dashboard → SQL Editor → paste → Run
--        (or: supabase db push, if you use the CLI)
-- Entities: profiles, follows, blocks, mutes, posts,
--           reaction_types, roles/permissions/user_roles,
--           platform_metrics, audit_log
-- Auth lives in Supabase's managed auth.users — never duplicated here.
-- ============================================================

-- ---------- helpers ----------
create extension if not exists pg_trgm;      -- §7.13 search groundwork
create extension if not exists citext;       -- case-insensitive handles

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- profiles (1:1 with auth.users) ----------
create table public.profiles (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  handle         citext unique not null
                 check (handle ~ '^[a-z0-9_]{3,24}$'),
  display_name   text check (char_length(display_name) <= 50),
  bio            text check (char_length(bio) <= 500),
  avatar_url     text,
  banner_url     text,
  custom_status  text check (char_length(custom_status) <= 140),  -- §1.4
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

-- Auto-create a profile row whenever a user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, handle, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'handle', split_part(new.email, '@', 1))
      || '_' || left(new.id::text, 4),          -- uniqueness without blocking signup
    coalesce(new.raw_user_meta_data->>'display_name', 'newcomer')
  );
  -- Bootstrap: very first profile becomes Owner (§7.8 — document: env-free bootstrap)
  if (select count(*) from public.profiles) = 1 then
    insert into public.user_roles (user_id, role_key)
    select new.id, 'owner';
  else
    insert into public.user_roles (user_id, role_key)
    select new.id, 'new_member';
  end if;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

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

-- ---------- reactions (registry-driven, §7.5) ----------
create table public.reaction_types (
  key    text primary key,
  label  text not null,
  glyph  text not null,
  sort   int  not null default 0,
  active boolean not null default true
);

insert into public.reaction_types (key, label, glyph, sort) values
  ('like', 'Like', '👍', 1),
  ('love', 'Love', '❤️', 2),
  ('laugh', 'Laugh', '😄', 3),
  ('interesting', 'Interesting', '🤔', 4),
  ('support', 'Support', '🫂', 5);

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

-- Denormalized counter maintained transactionally (§6.2 — never N+1 in feed)
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

create trigger reactions_bump_post_count
  after insert or delete on public.reactions
  for each row
  when (new.reactable_type = 'post' or old.reactable_type = 'post')
  execute function public.bump_post_reaction_count();

-- ---------- roles & permissions (§7.8) ----------
create table public.roles (
  key        text primary key,
  name       text not null,
  rank       int  not null,             -- higher = more authority
  is_system  boolean not null default false
);

insert into public.roles (key, name, rank, is_system) values
  ('owner',      'Owner',      100, true),
  ('admin',      'Admin',       80, true),
  ('moderator',  'Moderator',   60, true),
  ('member',     'Member',      40, true),
  ('new_member', 'New Member',  20, true);

create table public.permissions (
  key  text primary key               -- e.g. 'posts.moderate'
);

insert into public.permissions (key) values
  ('posts.create'), ('posts.moderate'), ('comments.moderate'),
  ('users.suspend'), ('reports.view'), ('reports.resolve'),
  ('themes.manage'), ('currency.manage'), ('roles.manage'), ('audit.view');

create table public.role_permissions (
  role_key       text not null references public.roles(key) on delete cascade,
  permission_key text not null references public.permissions(key) on delete cascade,
  primary key (role_key, permission_key)
);

insert into public.role_permissions (role_key, permission_key)
select r.key, p.key
from public.roles r
join public.permissions p on true
where r.key in ('owner', 'admin');       -- least privilege; moderator grants added per-phase

insert into public.role_permissions (role_key, permission_key)
select 'moderator', p.key from (values ('comments.moderate'),('reports.view')) as p(key);

insert into public.role_permissions (role_key, permission_key)
select r.key, 'posts.create'
from public.roles r where r.key in ('member','new_member','moderator');

create table public.user_roles (
  user_id    uuid not null references public.profiles(user_id) on delete cascade,
  role_key   text not null references public.roles(key) on delete cascade,
  granted_by uuid references public.profiles(user_id),
  granted_at timestamptz not null default now(),
  expires_at timestamptz,               -- temp mod roles (§6.1)
  primary key (user_id, role_key)
);

-- has_role: security-definer so RLS policies can call it without recursion
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
-- audit_log is append-only: inserts only, no updates/deletes ever (§7.12)

-- ============================================================
-- ROW LEVEL SECURITY (§6.3 — server-side authorization is law)
-- ============================================================
alter table public.profiles            enable row level security;
alter table public.follows             enable row level security;
alter table public.blocks              enable row level security;
alter table public.mutes               enable row level security;
alter table public.posts               enable row level security;
alter table public.reaction_types      enable row level security;
alter table public.reactions           enable row level security;
alter table public.post_reaction_counts enable row level security;
alter table public.roles               enable row level security;
alter table public.role_permissions    enable row level security;
alter table public.user_roles          enable row level security;
alter table public.platform_metrics    enable row level security;
alter table public.audit_log           enable row level security;

-- profiles: public read; write own only
create policy profiles_read   on public.profiles for select using (true);
create policy profiles_update on public.profiles for update using (auth.uid() = user_id);

-- follows: read public; create/delete only your own edges
create policy follows_read   on public.follows for select using (true);
create policy follows_insert on public.follows for insert with check (auth.uid() = follower_id);
create policy follows_delete on public.follows for delete using (auth.uid() = follower_id);

-- blocks/mutes: strictly private to their owner
create policy blocks_owner on public.blocks for all
  using (auth.uid() = blocker_id) with check (auth.uid() = blocker_id);
create policy mutes_owner on public.mutes for all
  using (auth.uid() = muter_id) with check (auth.uid() = muter_id);

-- posts: public reads public; friends-visibility read via follows; write own
create policy posts_read_public on public.posts for select
  using (
    deleted_at is null
    and (
      visibility = 'public'
      or author_id = auth.uid()
      or (visibility = 'friends' and exists (
        select 1 from public.follows f
        where f.follower_id = auth.uid() and f.followee_id = posts.author_id
      ))
      -- 'group' visibility: deny in Phase 1 (groups ship Phase 3)
      and visibility <> 'group'
    )
  );

create policy posts_insert on public.posts for insert
  with check (auth.uid() = author_id and visibility <> 'group');

create policy posts_update on public.posts for update
  using (auth.uid() = author_id and deleted_at is null);

-- soft-delete own posts
create policy posts_soft_delete on public.posts for delete
  using (
    auth.uid() = author_id
    or public.has_role(auth.uid(), 60)  -- moderator+
  );

-- reactions registry: public read, admin-only write
create policy reaction_types_read on public.reaction_types for select using (active);
create policy reaction_types_manage on public.reaction_types for all
  using (public.has_role(auth.uid(), 80)) with check (public.has_role(auth.uid(), 80));

create policy reactions_read   on public.reactions for select using (true);
create policy reactions_write  on public.reactions for insert
  with check (auth.uid() = user_id);
create policy reactions_delete on public.reactions for delete
  using (auth.uid() = user_id);

create policy counts_read on public.post_reaction_counts for select using (true);

-- roles: visible to all (UI mirror is cosmetic, §7.8); manageable by owner only
create policy roles_read    on public.roles for select using (true);
create policy user_roles_read on public.user_roles for select using (true);
create policy user_roles_manage on public.user_roles for all
  using (public.has_role(auth.uid(), 100)) with check (public.has_role(auth.uid(), 100));
create policy perms_read    on public.permissions for select using (true);
create policy role_perms_read on public.role_permissions for select using (true);
create policy role_perms_manage on public.role_permissions for all
  using (public.has_role(auth.uid(), 100)) with check (public.has_role(auth.uid(), 100));

-- metrics: nobody but owner via service role; audit: read owner, insert system
create policy metrics_denied  on public.platform_metrics for select using (public.has_role(auth.uid(), 100));
create policy audit_read      on public.audit_log for select using (public.has_role(auth.uid(), 100));

-- ============================================================
-- Storage bucket (avatars/banners) — run once
-- ============================================================
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- ============================================================
-- Backfill: accounts that existed BEFORE this migration ran
-- (e.g. the owner account created via dashboard/API first).
-- The signup trigger above only fires on future inserts, so we
-- backfill profiles here; the EARLIEST account becomes owner.
-- Idempotent: safe to re-run.
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
    when p.user_id = (select user_id from public.profiles order by created_at asc, user_id asc limit 1)
      then 'owner'
    else 'new_member'
  end
from public.profiles p
where not exists (select 1 from public.user_roles ur where ur.user_id = p.user_id);
