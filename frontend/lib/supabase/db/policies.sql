-- Acton North Demo CRM — RLS Policies

-- Enable RLS
alter table users enable row level security;
alter table contacts enable row level security;
alter table conversations enable row level security;
alter table entities enable row level security;
alter table relations enable row level security;
alter table memories enable row level security;
alter table embeddings enable row level security;

-- Users: only self
create policy if not exists users_self on users
  for select using (id = auth.uid());

-- Contacts: owner only for all ops
create policy if not exists contacts_owner_all on contacts
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Conversations: owner only
create policy if not exists conversations_owner_all on conversations
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Entities: owner only
create policy if not exists entities_owner_all on entities
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Relations: owner only
create policy if not exists relations_owner_all on relations
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Memories: owner only
create policy if not exists memories_owner_all on memories
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Embeddings: owner only
create policy if not exists embeddings_owner_all on embeddings
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

