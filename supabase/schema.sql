-- Sanctuary Home Management — schema inicial
-- Ejecutar en el SQL Editor de tu proyecto Supabase nuevo

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Authenticated users can read profiles"
  on public.profiles for select to authenticated using (true);

create policy "Users can update own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Expenses
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  date date not null default current_date,
  amount numeric(12, 2) not null check (amount >= 0),
  category text not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.expenses enable row level security;

create policy "Authenticated users full access expenses"
  on public.expenses for all to authenticated using (true) with check (true);

-- Tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'pendiente' check (status in ('pendiente', 'completada')),
  priority text not null default 'prioritaria' check (priority in ('urgente', 'prioritaria', 'pateable')),
  category text not null default 'hogar' check (category in (
    'hogar', 'compras', 'tramites', 'aviva', 'bebi',
    'personales_ivan', 'personales_juli', 'trabajo_ivan'
  )),
  start_date date,
  end_date date,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy "Authenticated users full access tasks"
  on public.tasks for all to authenticated using (true) with check (true);

-- Shopping lists
create table if not exists public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'activa' check (status in ('activa', 'completada')),
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.shopping_lists enable row level security;

create policy "Authenticated users full access shopping_lists"
  on public.shopping_lists for all to authenticated using (true) with check (true);

-- Shopping items
create table if not exists public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.shopping_lists (id) on delete cascade,
  name text not null,
  quantity numeric(10, 2) not null default 1 check (quantity > 0),
  unit text not null default 'unidad',
  store text not null default 'supermercado' check (store in ('supermercado', 'farmacia', 'otros')),
  category text not null default 'supermercado',
  is_purchased boolean not null default false,
  estimated_price numeric(12, 2),
  added_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.shopping_items enable row level security;

create policy "Authenticated users full access shopping_items"
  on public.shopping_items for all to authenticated using (true) with check (true);

-- Updated_at trigger for tasks and expenses
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

create trigger expenses_updated_at before update on public.expenses
  for each row execute function public.set_updated_at();

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
