-- Migración 002: actualizar tareas y preparar estadísticas de compras
-- Ejecutar en Supabase SQL Editor si ya tenés la base creada con schema.sql anterior

-- Migrar datos existentes antes de cambiar constraints
update public.tasks set status = 'pendiente' where status = 'en_progreso';
update public.tasks set priority = 'urgente' where priority = 'alta';
update public.tasks set priority = 'prioritaria' where priority = 'media';
update public.tasks set priority = 'pateable' where priority = 'baja';
update public.tasks set category = 'hogar' where category not in (
  'hogar', 'compras', 'tramites', 'aviva', 'bebi',
  'personales_ivan', 'personales_juli', 'trabajo_ivan'
);

alter table public.tasks drop constraint if exists tasks_status_check;
alter table public.tasks drop constraint if exists tasks_priority_check;
alter table public.tasks drop constraint if exists tasks_category_check;

alter table public.tasks add column if not exists start_date date;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tasks' and column_name = 'due_date'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tasks' and column_name = 'end_date'
  ) then
    alter table public.tasks rename column due_date to end_date;
  end if;
end $$;

alter table public.tasks add column if not exists end_date date;

alter table public.tasks
  add constraint tasks_status_check
  check (status in ('pendiente', 'completada'));

alter table public.tasks
  add constraint tasks_priority_check
  check (priority in ('urgente', 'prioritaria', 'pateable'));

alter table public.tasks
  add constraint tasks_category_check
  check (category in (
    'hogar', 'compras', 'tramites', 'aviva', 'bebi',
    'personales_ivan', 'personales_juli', 'trabajo_ivan'
  ));

-- Vista para productos más comprados (top histórico)
create or replace view public.most_purchased_items as
select
  lower(trim(name)) as name_key,
  min(name) as name,
  sum(quantity)::numeric as total_quantity
from public.shopping_items
where is_purchased = true
group by lower(trim(name))
order by total_quantity desc;

grant select on public.most_purchased_items to authenticated;
