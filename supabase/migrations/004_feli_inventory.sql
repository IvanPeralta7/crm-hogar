-- Migración 004: inventario de la sección Feli
create table if not exists public.feli_inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  quantity integer not null default 1 check (quantity >= 0),
  category text not null,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.feli_inventory_items enable row level security;

create policy "Authenticated users full access feli_inventory_items"
  on public.feli_inventory_items for all to authenticated using (true) with check (true);

create trigger feli_inventory_items_updated_at before update on public.feli_inventory_items
  for each row execute function public.set_updated_at();
