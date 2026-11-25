-- Automatically add workspace owner to workspace_members as 'admin'
create or replace function private.handle_new_workspace()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.owner_id, 'admin')
  on conflict (workspace_id, user_id) do nothing;
  return new;
end;
$$;

revoke all on function private.handle_new_workspace() from public, anon, authenticated;

create or replace trigger on_workspace_created
  after insert on public.workspaces
  for each row execute function private.handle_new_workspace();

-- Atomic vote increment (SECURITY INVOKER so RLS still enforces workspace membership)
create or replace function public.increment_option_vote(p_option_id bigint)
returns integer
language sql
security invoker
set search_path = ''
as $$
  update public.decision_options
  set votes = votes + 1
  where id = p_option_id
  returning votes;
$$;

revoke all on function public.increment_option_vote(bigint) from public, anon;
grant execute on function public.increment_option_vote(bigint) to authenticated;
