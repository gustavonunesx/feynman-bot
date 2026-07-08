-- M3 — Persistência do loop principal (docs/PRD.md, seção "Modelo de dados").
-- Aplicar no SQL Editor do projeto Supabase (ou `supabase db push`).
--
-- Segurança: RLS ligado em todas as tabelas e NENHUMA policy criada —
-- as chaves públicas (anon/publishable) não leem nem escrevem nada.
-- Todo acesso ao banco acontece server-side com a service role key,
-- que ignora RLS. Quando entrar auth multiusuário, criam-se policies
-- por user_id sem retrabalho de schema.

-- Tópicos cadastrados pelo usuário
create table public.topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id), -- preparo pro multiusuário futuro (não remover)
  title text not null,
  created_at timestamptz not null default now()
);

-- Explicação inicial gerada pela IA para cada tópico
create table public.explanations (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics (id) on delete cascade,
  ai_explanation text not null,
  ai_analogy text not null,
  created_at timestamptz not null default now()
);

-- Cada tentativa de reexplicação do usuário
create table public.user_attempts (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics (id) on delete cascade,
  user_text text not null,
  created_at timestamptz not null default now()
);

-- Avaliação da IA sobre cada tentativa
create table public.evaluations (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.user_attempts (id) on delete cascade,
  completeness_score int not null check (completeness_score between 0 and 100),
  confusion_points text[] not null default '{}',
  what_was_right text,
  created_at timestamptz not null default now()
);

-- Postgres não indexa FK automaticamente — sem isso, joins e
-- on delete cascade viram seq scan.
create index topics_user_id_idx on public.topics (user_id);
create index explanations_topic_id_idx on public.explanations (topic_id);
create index user_attempts_topic_id_idx on public.user_attempts (topic_id);
create index evaluations_attempt_id_idx on public.evaluations (attempt_id);

alter table public.topics enable row level security;
alter table public.explanations enable row level security;
alter table public.user_attempts enable row level security;
alter table public.evaluations enable row level security;
