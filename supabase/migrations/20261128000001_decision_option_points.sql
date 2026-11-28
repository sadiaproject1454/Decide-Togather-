-- ============================================================================
-- Phase 5.2: Pros & Cons Management (decision_option_points)
-- ============================================================================

-- Ensure composite uniqueness on decision_options(id, decision_id) so points
-- can enforce a composite FK guaranteeing the option belongs to the decision.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'decision_options_id_decision_id_unique'
      and conrelid = 'public.decision_options'::regclass
  ) then
    alter table public.decision_options
      add constraint decision_options_id_decision_id_unique unique (id, decision_id);
  end if;
end $$;

create table if not exists public.decision_option_points (
  id bigint generated always as identity primary key,
  decision_id bigint not null references public.decisions(id) on delete cascade,
  decision_option_id bigint not null references public.decision_options(id) on delete cascade,
  workspace_id bigint not null references public.workspaces(id) on delete cascade,
  type text not null check (type in ('pro', 'con')),
  content text not null check (char_length(btrim(content)) >= 2 and char_length(content) <= 500),
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dop_option_decision_fkey
    foreign key (decision_option_id, decision_id)
    references public.decision_options(id, decision_id)
    on delete cascade,
  constraint dop_decision_workspace_fkey
    foreign key (decision_id, workspace_id)
    references public.decisions(id, workspace_id)
    on delete cascade
);

create index if not exists dop_decision_id_idx
  on public.decision_option_points (decision_id);
create index if not exists dop_option_id_idx
  on public.decision_option_points (decision_option_id);
create index if not exists dop_workspace_id_idx
  on public.decision_option_points (workspace_id);
create index if not exists dop_created_by_idx
  on public.decision_option_points (created_by);
create index if not exists dop_option_type_created_idx
  on public.decision_option_points (decision_option_id, type, created_at asc);

create or replace function private.set_decision_option_point_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.set_decision_option_point_updated_at() from public, anon;
grant execute on function private.set_decision_option_point_updated_at() to authenticated;

create or replace trigger trg_dop_set_updated_at
  before update on public.decision_option_points
  for each row execute function private.set_decision_option_point_updated_at();

alter table public.decision_option_points enable row level security;

revoke all on public.decision_option_points from anon;
grant select, insert, update, delete on public.decision_option_points to authenticated;
grant usage, select on all sequences in schema public to authenticated;

create policy "Workspace members can view option pros and cons"
  on public.decision_option_points for select
  to authenticated
  using (
    (select private.is_workspace_member(workspace_id))
    and exists (
      select 1
      from public.decision_options opt
      join public.decisions d on d.id = opt.decision_id
      where opt.id = decision_option_id
        and d.id = decision_id
        and d.workspace_id = decision_option_points.workspace_id
    )
  );

create policy "Workspace members can add option pros and cons"
  on public.decision_option_points for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and (select private.is_workspace_member(workspace_id))
    and exists (
      select 1
      from public.decision_options opt
      join public.decisions d on d.id = opt.decision_id
      where opt.id = decision_option_id
        and d.id = decision_id
        and d.workspace_id = decision_option_points.workspace_id
    )
  );

create policy "Point creator or workspace admin can update pros and cons"
  on public.decision_option_points for update
  to authenticated
  using (
    created_by = (select auth.uid())
    or (select private.is_workspace_admin(workspace_id))
  )
  with check (
    (
      created_by = (select auth.uid())
      or (select private.is_workspace_admin(workspace_id))
    )
    and (select private.is_workspace_member(workspace_id))
    and exists (
      select 1
      from public.decision_options opt
      join public.decisions d on d.id = opt.decision_id
      where opt.id = decision_option_id
        and d.id = decision_id
        and d.workspace_id = decision_option_points.workspace_id
    )
  );

create policy "Point creator or workspace admin can delete pros and cons"
  on public.decision_option_points for delete
  to authenticated
  using (
    created_by = (select auth.uid())
    or (select private.is_workspace_admin(workspace_id))
  );
