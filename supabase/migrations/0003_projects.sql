-- ============================================================
-- HALLOWMARSH: portfolio projects
-- The projects shown on the public landing page, editable by the owner.
-- Apply after 0001_phase1.sql and 0002_invite_only.sql.
-- ============================================================

create table if not exists public.projects (
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

alter table public.projects enable row level security;

-- The landing page is public, so published projects are readable by anyone.
-- The owner can also read unpublished drafts.
create policy projects_read on public.projects for select
  using (published or public.has_role(auth.uid(), 100));

-- Only the owner may add, change, or remove projects.
create policy projects_write on public.projects for all
  using (public.has_role(auth.uid(), 100))
  with check (public.has_role(auth.uid(), 100));

-- Seed the list that used to be hardcoded, but only into an empty table so
-- re-running this migration never duplicates rows.
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
