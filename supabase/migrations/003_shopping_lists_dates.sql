-- Migración 003: fechas y total en listas de compras
alter table public.shopping_lists
  add column if not exists list_date date not null default current_date;

alter table public.shopping_lists
  add column if not exists total_spent numeric(12, 2);

update public.shopping_lists
set list_date = created_at::date
where list_date is null;
