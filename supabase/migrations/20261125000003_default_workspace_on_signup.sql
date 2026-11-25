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

  insert into public.workspaces (name, description, owner_id)
  values (
    'My Workspace',
    'Your default space for team decisions.',
    new.id
  );

  return new;
end;
$$;
