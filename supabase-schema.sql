create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  role text default 'visualizador' check (role in ('admin','engenharia','projetista','encarregado','visualizador')),
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.obras (
  id uuid primary key default uuid_generate_v4(),
  nome text not null unique,
  endereco text,
  status text default 'ativa',
  created_at timestamptz default now()
);

create table if not exists public.projetos (
  id uuid primary key default uuid_generate_v4(),
  obra_id uuid references public.obras(id) on delete cascade,
  codigo text not null,
  titulo text not null,
  setor text,
  disciplina text,
  revisao text not null default 'R00',
  status text not null default 'em_analise' check (status in ('vigente','em_analise','obsoleto','bloqueado')),
  responsavel text,
  arquivo_nome text,
  arquivo_path text,
  arquivo_url text,
  qr_text text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  unique(codigo, revisao)
);

create table if not exists public.tarefas (
  id uuid primary key default uuid_generate_v4(),
  obra_id uuid references public.obras(id) on delete set null,
  projeto_id uuid references public.projetos(id) on delete set null,
  titulo text not null,
  descricao text,
  responsavel text,
  prazo date,
  prioridade text default 'media',
  status text default 'pendente',
  created_at timestamptz default now()
);

create table if not exists public.auditoria (
  id bigserial primary key,
  user_id uuid references auth.users(id),
  acao text not null,
  entidade text,
  entidade_id text,
  detalhe jsonb,
  created_at timestamptz default now()
);

insert into public.obras(nome,endereco) values
('AG Genebra','Rua Japurá, 411 - Renascença, Belo Horizonte/MG'),
('AG Bilbao',''),
('AG Pompeia','')
on conflict (nome) do nothing;

alter table public.profiles enable row level security;
alter table public.obras enable row level security;
alter table public.projetos enable row level security;
alter table public.tarefas enable row level security;
alter table public.auditoria enable row level security;

create policy "profiles select" on public.profiles for select using (auth.uid() is not null);
create policy "profiles insert self" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles update admin" on public.profiles for update using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));

create policy "obras read" on public.obras for select using (auth.uid() is not null);
create policy "obras write admin engenharia" on public.obras for all using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','engenharia'))) with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','engenharia')));

create policy "projetos read" on public.projetos for select using (auth.uid() is not null);
create policy "projetos write" on public.projetos for all using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','engenharia','projetista'))) with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','engenharia','projetista')));

create policy "tarefas read" on public.tarefas for select using (auth.uid() is not null);
create policy "tarefas write" on public.tarefas for all using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','engenharia','projetista','encarregado'))) with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','engenharia','projetista','encarregado')));

create policy "auditoria read admin engenharia" on public.auditoria for select using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','engenharia')));
create policy "auditoria insert" on public.auditoria for insert with check (auth.uid() is not null);

insert into storage.buckets (id, name, public) values ('projetos','projetos', true) on conflict (id) do nothing;
create policy "storage read projetos" on storage.objects for select using (bucket_id='projetos' and auth.uid() is not null);
create policy "storage upload projetos" on storage.objects for insert with check (bucket_id='projetos' and auth.uid() is not null);
create policy "storage update projetos" on storage.objects for update using (bucket_id='projetos' and auth.uid() is not null);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id,email,full_name,role)
  values (new.id,new.email,coalesce(new.raw_user_meta_data->>'full_name',''),'visualizador')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
