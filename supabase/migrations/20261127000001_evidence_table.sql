-- ============================================================================
-- Phase 5.1: Evidence Management Schema & Row Level Security (RLS)
-- ============================================================================

-- Ensure composite uniqueness on decisions(id, workspace_id) so evidence can
-- enforce a composite foreign key guaranteeing decision_id belongs to workspace_id.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'decisions_id_workspace_id_unique'
      and conrelid = 'public.decisions'::regclass
  ) then
    alter table public.decisions
      add constraint decisions_id_workspace_id_unique unique (id, workspace_id);
  end if;
end $$;

create table if not exists public.evidence (
  id bigint generated always as identity primary key,
  decision_id bigint not null references public.decisions(id) on delete cascade,
  workspace_id bigint not null references public.workspaces(id) on delete cascade,
  title text not null check (char_length(btrim(title)) >= 2 and char_length(title) <= 200),
  description text,
  source_url text check (source_url is null or source_url ~* '^https?://'),
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint evidence_decision_workspace_fkey
    foreign key (decision_id, workspace_id)
    references public.decisions(id, workspace_id)
    on delete cascade
);

create index if not exists evidence_decision_id_idx on public.evidence (decision_id);
create index if not exists evidence_workspace_id_idx on public.evidence (workspace_id);
create index if not exists evidence_created_by_idx on public.evidence (created_by);
create index if not exists evidence_decision_created_at_idx on public.evidence (decision_id, created_at desc);

-- Keep updated_at current on row updates
create or replace function private.set_evidence_updated_at()
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

revoke all on function private.set_evidence_updated_at() from public, anon;
grant execute on function private.set_evidence_updated_at() to authenticated;

create or replace trigger trg_evidence_set_updated_at
  before update on public.evidence
  for each row execute function private.set_evidence_updated_at();

-- Enable RLS and grant least-privilege access to authenticated users only
alter table public.evidence enable row level security;

revoke all on public.evidence from anon;
grant select, insert, update, delete on public.evidence to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- RLS Policies for public.evidence
create policy "Workspace members can view decision evidence"
  on public.evidence for select
  to authenticated
  using (
    (select private.is_workspace_member(workspace_id))
    and exists (
      select 1 from public.decisions d
      where d.id = decision_id
        and d.workspace_id = evidence.workspace_id
    )
  );

create policy "Workspace members can add evidence to decisions in their workspace"
  on public.evidence for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and (select private.is_workspace_member(workspace_id))
    and exists (
      select 1 from public.decisions d
      where d.id = decision_id
        and d.workspace_id = evidence.workspace_id
    )
  );

create policy "Evidence creator or workspace admin can update evidence"
  on public.evidence for update
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
      select 1 from public.decisions d
      where d.id = decision_id
        and d.workspace_id = evidence.workspace_id
    )
  );

create policy "Evidence creator or workspace admin can delete evidence"
  on public.evidence for delete
  to authenticated
  using (
    created_by = (select auth.uid())
    or (select private.is_workspace_admin(workspace_id))
  );
