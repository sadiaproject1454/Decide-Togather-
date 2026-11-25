-- ============================================================================
-- Decide Together - Initial PostgreSQL Schema & Row Level Security (RLS)
-- ============================================================================

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  avatar_url text,
  bio text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id bigint generated always as identity primary key,
  name text not null,
  description text not null default '',
  owner_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists workspaces_owner_id_idx on public.workspaces (owner_id);

create table if not exists public.workspace_members (
  id bigint generated always as identity primary key,
  workspace_id bigint not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz not null default now(),
  constraint workspace_members_unique_member unique (workspace_id, user_id)
);

create index if not exists workspace_members_workspace_id_idx on public.workspace_members (workspace_id);
create index if not exists workspace_members_user_id_idx on public.workspace_members (user_id);

create table if not exists public.decisions (
  id bigint generated always as identity primary key,
  workspace_id bigint not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  status text not null default 'open' check (status in ('open', 'voting', 'closed')),
  deadline timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists decisions_workspace_id_idx on public.decisions (workspace_id);
create index if not exists decisions_created_by_idx on public.decisions (created_by);

create table if not exists public.decision_options (
  id bigint generated always as identity primary key,
  decision_id bigint not null references public.decisions(id) on delete cascade,
  label text not null,
  votes integer not null default 0 check (votes >= 0),
  created_at timestamptz not null default now()
);

create index if not exists decision_options_decision_id_idx on public.decision_options (decision_id);

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create or replace function private.is_workspace_member(ws_id bigint)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspaces w
    where w.id = ws_id
      and w.owner_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = ws_id
      and wm.user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_workspace_member(bigint) from public, anon;
grant execute on function private.is_workspace_member(bigint) to authenticated;

create or replace function private.is_workspace_admin(ws_id bigint)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspaces w
    where w.id = ws_id
      and w.owner_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = ws_id
      and wm.user_id = (select auth.uid())
      and wm.role = 'admin'
  );
$$;

revoke all on function private.is_workspace_admin(bigint) from public, anon;
grant execute on function private.is_workspace_admin(bigint) to authenticated;

alter table public.users enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.decisions enable row level security;
alter table public.decision_options enable row level security;

revoke all on public.users, public.workspaces, public.workspace_members, public.decisions, public.decision_options from anon;
grant select, insert, update, delete on public.users, public.workspaces, public.workspace_members, public.decisions, public.decision_options to authenticated;
grant usage, select on all sequences in schema public to authenticated;

create policy "Users can view own profile or fellow workspace members"
  on public.users for select
  to authenticated
  using (
    (select auth.uid()) = id
    or exists (
      select 1
      from public.workspace_members wm
      where wm.user_id = public.users.id
        and (select private.is_workspace_member(wm.workspace_id))
    )
  );

create policy "Users can insert their own profile"
  on public.users for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.users for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Members can view their workspaces"
  on public.workspaces for select
  to authenticated
  using (
    owner_id = (select auth.uid())
    or (select private.is_workspace_member(id))
  );

create policy "Authenticated users can create workspaces"
  on public.workspaces for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

create policy "Workspace admins can update workspaces"
  on public.workspaces for update
  to authenticated
  using ((select private.is_workspace_admin(id)))
  with check (owner_id = (select auth.uid()) or (select private.is_workspace_admin(id)));

create policy "Workspace owners can delete workspaces"
  on public.workspaces for delete
  to authenticated
  using (owner_id = (select auth.uid()));

create policy "Workspace members can view membership list"
  on public.workspace_members for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or (select private.is_workspace_member(workspace_id))
  );

create policy "Workspace admins can add members"
  on public.workspace_members for insert
  to authenticated
  with check ((select private.is_workspace_admin(workspace_id)));

create policy "Workspace admins can update members"
  on public.workspace_members for update
  to authenticated
  using ((select private.is_workspace_admin(workspace_id)))
  with check ((select private.is_workspace_admin(workspace_id)));

create policy "Workspace admins or self can remove members"
  on public.workspace_members for delete
  to authenticated
  using (
    user_id = (select auth.uid())
    or (select private.is_workspace_admin(workspace_id))
  );

create policy "Workspace members can view decisions"
  on public.decisions for select
  to authenticated
  using ((select private.is_workspace_member(workspace_id)));

create policy "Workspace members can create decisions"
  on public.decisions for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and (select private.is_workspace_member(workspace_id))
  );

create policy "Decision creator or workspace admin can update decisions"
  on public.decisions for update
  to authenticated
  using (
    created_by = (select auth.uid())
    or (select private.is_workspace_admin(workspace_id))
  )
  with check (
    (select private.is_workspace_member(workspace_id))
  );

create policy "Decision creator or workspace admin can delete decisions"
  on public.decisions for delete
  to authenticated
  using (
    created_by = (select auth.uid())
    or (select private.is_workspace_admin(workspace_id))
  );

create policy "Workspace members can view decision options"
  on public.decision_options for select
  to authenticated
  using (
    exists (
      select 1 from public.decisions d
      where d.id = decision_id
        and (select private.is_workspace_member(d.workspace_id))
    )
  );

create policy "Workspace members can add decision options"
  on public.decision_options for insert
  to authenticated
  with check (
    exists (
      select 1 from public.decisions d
      where d.id = decision_id
        and (select private.is_workspace_member(d.workspace_id))
    )
  );

create policy "Workspace members can update decision options (vote)"
  on public.decision_options for update
  to authenticated
  using (
    exists (
      select 1 from public.decisions d
      where d.id = decision_id
        and (select private.is_workspace_member(d.workspace_id))
    )
  )
  with check (
    exists (
      select 1 from public.decisions d
      where d.id = decision_id
        and (select private.is_workspace_member(d.workspace_id))
    )
  );

create policy "Decision creator or admin can delete options"
  on public.decision_options for delete
  to authenticated
  using (
    exists (
      select 1 from public.decisions d
      where d.id = decision_id
        and (
          d.created_by = (select auth.uid())
          or (select private.is_workspace_admin(d.workspace_id))
        )
    )
  );
