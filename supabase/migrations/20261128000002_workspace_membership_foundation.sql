-- ============================================================================
-- Phase 6.1: Workspace Membership Foundation (Roles, RLS Hardening & Member RPC)
-- ============================================================================

-- 1. Idempotent backfill: ensure every existing workspace creator has an 'admin' row
insert into public.workspace_members (workspace_id, user_id, role)
select w.id, w.owner_id, 'admin'
from public.workspaces w
on conflict (workspace_id, user_id)
do update set role = 'admin'
where public.workspace_members.role <> 'admin';

-- 2. Helper to check whether a given user is the owner/creator of a workspace
create or replace function private.is_workspace_owner(ws_id bigint, target_user_id uuid)
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
      and w.owner_id = target_user_id
  );
$$;

revoke all on function private.is_workspace_owner(bigint, uuid) from public, anon;
grant execute on function private.is_workspace_owner(bigint, uuid) to authenticated;

-- 3. Trigger to prevent mutating membership identity, self role escalation, or owner demotion
create or replace function private.protect_workspace_member_integrity()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_caller uuid := (select auth.uid());
begin
  if new.workspace_id is distinct from old.workspace_id
     or new.user_id is distinct from old.user_id then
    raise exception 'Cannot change the user or workspace of an existing membership.';
  end if;

  if v_caller is not null
     and old.user_id = v_caller
     and new.role is distinct from old.role then
    raise exception 'You cannot change your own workspace role.';
  end if;

  if (select private.is_workspace_owner(new.workspace_id, new.user_id))
     and new.role <> 'admin' then
    raise exception 'The workspace creator must remain an admin.';
  end if;

  return new;
end;
$$;

revoke all on function private.protect_workspace_member_integrity() from public, anon;
grant execute on function private.protect_workspace_member_integrity() to authenticated;

drop trigger if exists trg_protect_workspace_member_integrity on public.workspace_members;
create trigger trg_protect_workspace_member_integrity
  before update on public.workspace_members
  for each row execute function private.protect_workspace_member_integrity();

-- 4. Tighten UPDATE and DELETE RLS policies on public.workspace_members
drop policy if exists "Workspace admins can update members" on public.workspace_members;
drop policy if exists "Workspace admins can update other members roles" on public.workspace_members;
create policy "Workspace admins can update other members roles"
  on public.workspace_members for update
  to authenticated
  using (
    (select private.is_workspace_admin(workspace_id))
    and user_id <> (select auth.uid())
    and not (select private.is_workspace_owner(workspace_id, user_id))
  )
  with check (
    (select private.is_workspace_admin(workspace_id))
    and user_id <> (select auth.uid())
    and role in ('admin', 'member')
    and not (select private.is_workspace_owner(workspace_id, user_id))
  );

drop policy if exists "Workspace admins or self can remove members" on public.workspace_members;
drop policy if exists "Workspace admins or non-owner self can remove members" on public.workspace_members;
create policy "Workspace admins or non-owner self can remove members"
  on public.workspace_members for delete
  to authenticated
  using (
    (
      user_id = (select auth.uid())
      or (select private.is_workspace_admin(workspace_id))
    )
    and not (select private.is_workspace_owner(workspace_id, user_id))
  );

-- 5. Secure admin-only RPC to add an existing authenticated user by email
--    without exposing public.users to general enumeration.
create or replace function public.add_workspace_member_by_email(
  p_workspace_id bigint,
  p_email text,
  p_role text default 'member'
)
returns table (
  id bigint,
  workspace_id bigint,
  user_id uuid,
  role text,
  joined_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid := (select auth.uid());
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_target_user_id uuid;
begin
  if v_caller is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if p_workspace_id is null or p_workspace_id <= 0 then
    raise exception 'Invalid workspace ID.' using errcode = '22023';
  end if;

  if not (select private.is_workspace_admin(p_workspace_id)) then
    raise exception 'Only workspace admins can add members.' using errcode = '42501';
  end if;

  if p_role not in ('admin', 'member') then
    raise exception 'Role must be either admin or member.' using errcode = '22023';
  end if;

  if v_email = '' or position('@' in v_email) = 0 then
    raise exception 'Please enter a valid email address.' using errcode = '22023';
  end if;

  select u.id
  into v_target_user_id
  from public.users u
  where lower(btrim(u.email)) = v_email
  limit 1;

  if v_target_user_id is null then
    raise exception 'No registered Decide Together user found for that email address.' using errcode = 'P0002';
  end if;

  if exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = v_target_user_id
  ) then
    raise exception 'This user is already a member of the workspace.' using errcode = '23505';
  end if;

  return query
  insert into public.workspace_members (workspace_id, user_id, role)
  values (p_workspace_id, v_target_user_id, p_role)
  returning
    public.workspace_members.id,
    public.workspace_members.workspace_id,
    public.workspace_members.user_id,
    public.workspace_members.role,
    public.workspace_members.joined_at;
end;
$$;

revoke all on function public.add_workspace_member_by_email(bigint, text, text) from public, anon;
grant execute on function public.add_workspace_member_by_email(bigint, text, text) to authenticated;
