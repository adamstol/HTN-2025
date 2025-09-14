-- Acton North Demo CRM — Triggers & Helpers

-- Example: updated_at trigger for tables with updated_at column (not used above but provided for extension)
-- create extension if not exists moddatetime;
-- select add_updated_at('public', 'some_table');

-- Example: maintain contacts.conversation_ids newest-first on insert into conversations
create or replace function fn_conversation_ids_prepend() returns trigger as $$
begin
  update contacts
    set conversation_ids = array_prepend(new.id, array_remove(conversation_ids, new.id))
  where id = new.contact_id;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_conversation_ids_prepend on conversations;
create trigger trg_conversation_ids_prepend
after insert on conversations
for each row execute function fn_conversation_ids_prepend();

