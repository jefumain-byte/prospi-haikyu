-- ============================================================
-- このファイルの「中身だけ」を Supabase SQL Editor に貼り付けて Run
-- 「supabase/schema.sql」という文字列は入力しないでください
-- ============================================================

create table if not exists public.prospi_sync (
  sync_id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.prospi_sync enable row level security;

drop policy if exists "prospi_sync_public_access" on public.prospi_sync;

create policy "prospi_sync_public_access"
  on public.prospi_sync
  for all
  using (true)
  with check (true);

-- Realtime（既に追加済みの場合はエラーになることがありますが、同期自体は動きます）
do $$
begin
  alter publication supabase_realtime add table public.prospi_sync;
exception
  when duplicate_object then null;
end $$;
