-- Acton North Demo CRM — Database Schema (Supabase/Postgres)
-- extensions
create extension if not exists vector;


CREATE TYPE gender AS ENUM (
  'Male',
  'Female',
  'Non-Binary',
  'Other'
);

create type conversation_status as enum ('pending','active','ended');

-- users
create table if not exists users (
  id uuid primary key default auth.uid(),
  email text unique not null,
  name text,
  created_at timestamptz not null default now(),
  gender gender,
  dob date,
);

-- -- contacts
-- create table if not exists contacts (
--   id uuid primary key default gen_random_uuid(),
--   owner_id uuid not null references users(id) on delete cascade,
--   display_name text not null,
--   external_user_id uuid,
--   zep_entity_id text,
--   first_met_at timestamptz,
--   first_met_where text,
--   last_interaction_at timestamptz,
--   notes text,
--   conversation_ids uuid[] default '{}',
--   gender gender,
--   dob date,

-- );
-- create index if not exists contacts_owner_idx on contacts(owner_id);

-- conversations
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  initiator_user_id uuid not null references users(id) on delete cascade,
  scanner_user_id uuid not null references users(id) on delete cascade,
  scanner_email text,
  -- contact_id uuid not null references contacts(id) on delete cascade,
  status conversation_status not null default 'pending',
  started_at timestamptz not null,
  ended_at timestamptz not null,
  location text,
  invite_code text not null,
);
create index if not exists conversations_owner_started_idx on conversations(owner_id, started_at desc);
create index if not exists conversations_contact_idx on conversations(contact_id);

-- -- memories
-- create table if not exists memories (
--   id uuid primary key default gen_random_uuid(),
--   owner_id uuid not null references users(id) on delete cascade,
--   contact_id uuid not null references contacts(id) on delete cascade,
--   title text not null,
--   body text not null,
--   tags text[] default '{}',
--   due_at timestamptz,
--   created_at timestamptz not null default now(),
--   source_conversation_id uuid references conversations(id) on delete set null
-- );
-- create index if not exists memories_owner_contact_idx on memories(owner_id, contact_id);

-- embeddings (optional)
-- create table if not exists embeddings (
--   owner_id uuid not null references users(id) on delete cascade,
--   entity_id uuid not null references entities(id) on delete cascade,
--   model text not null,
--   vec vector(1536) not null,
--   primary key (owner_id, entity_id)
-- );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = auth, public
as $$
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  )
  on conflict (id) do update
    set name = excluded.name;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
