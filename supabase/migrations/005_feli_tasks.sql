-- Migración 005: tareas de la sección Feli
create table if not exists public.feli_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'pendiente' check (status in ('pendiente', 'completada')),
  priority text not null default 'prioritaria' check (priority in ('urgente', 'prioritaria', 'pateable')),
  start_date date,
  end_date date,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.feli_tasks enable row level security;

create policy "Authenticated users full access feli_tasks"
  on public.feli_tasks for all to authenticated using (true) with check (true);

create trigger feli_tasks_updated_at before update on public.feli_tasks
  for each row execute function public.set_updated_at();
