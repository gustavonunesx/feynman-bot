-- M4 — Repetição espaçada SM-2 (docs/PRD.md, seção "Regras de negócio críticas").
-- Aplicar no SQL Editor do projeto Supabase (ou `supabase db push`).
--
-- Segurança: mesmo padrão do M3 — RLS ligado e NENHUMA policy; todo acesso
-- é server-side via service role key.

-- Agenda de repetição espaçada (1 linha por tópico, criada na 1ª avaliação)
create table public.review_schedule (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics (id) on delete cascade unique,
  ease_factor numeric not null default 2.5 check (ease_factor >= 1.3),
  interval_days int not null default 1 check (interval_days >= 1),
  repetitions int not null default 0 check (repetitions >= 0),
  next_review_date date not null,
  last_reviewed_at timestamptz
);

-- unique em topic_id já cria índice — não precisa de outro pra FK.

alter table public.review_schedule enable row level security;
