-- Rate limit por IP nas rotas de IA (api/explain, api/evaluate), pra
-- proteger o crédito da OpenAI quando o link do projeto for compartilhado
-- publicamente. Aplicar no SQL Editor do projeto Supabase.
--
-- Segurança: mesmo padrão do M3/M4 — RLS ligado e NENHUMA policy; todo
-- acesso é server-side via service role key.

create table public.rate_limits (
  ip text not null,
  route text not null,
  day date not null,
  count int not null default 0,
  primary key (ip, route, day)
);

alter table public.rate_limits enable row level security;

-- Incrementa o contador do dia (cria a linha se não existir) e devolve o
-- valor novo — 1 round-trip atômico, evita race de leitura+escrita separada
-- entre requests concorrentes do mesmo IP.
create function public.increment_rate_limit(p_ip text, p_route text, p_day date)
returns int
language sql
security definer
set search_path = public
as $$
  insert into public.rate_limits (ip, route, day, count)
  values (p_ip, p_route, p_day, 1)
  on conflict (ip, route, day)
  do update set count = public.rate_limits.count + 1
  returning count;
$$;
