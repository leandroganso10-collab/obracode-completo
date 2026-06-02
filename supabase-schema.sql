-- Banco base para ObraCode Profissional
create table if not exists obras (id uuid primary key default gen_random_uuid(), nome text not null, endereco text, created_at timestamptz default now());
create table if not exists perfis (id uuid primary key default gen_random_uuid(), nome text not null unique);
create table if not exists projetos (id uuid primary key default gen_random_uuid(), obra_id uuid references obras(id), setor text, disciplina text, codigo text not null, titulo text not null, revisao text not null, status text default 'Vigente', arquivo_url text, responsavel text, created_at timestamptz default now());
create table if not exists tarefas (id uuid primary key default gen_random_uuid(), projeto_id uuid references projetos(id), titulo text not null, responsavel text, prazo date, status text default 'Pendente', prioridade text default 'Média', created_at timestamptz default now());
create table if not exists auditoria (id uuid primary key default gen_random_uuid(), usuario text, acao text not null, detalhe text, created_at timestamptz default now());
insert into obras (nome,endereco) values ('AG Genebra','Rua Japurá, 411'),('AG Bilbao',''),('AG Pompeia','') on conflict do nothing;
insert into perfis (nome) values ('admin'),('engenharia'),('projetista'),('encarregado'),('visualizador') on conflict do nothing;
