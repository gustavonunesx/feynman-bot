# PLAN — Feynman Bot

Status vivo do projeto. Atualizado a cada "commit" (ver workflow em [CLAUDE.md](../CLAUDE.md)). Fonte de requisitos: [docs/PRD.md](PRD.md).

## Como usar este arquivo

- Ordem: setup → UI (mock data) → integração IA → persistência → SM-2 → painel de revisão → polish → deploy.
- Cada milestone tem branch própria, objetivo, entregas em checkbox e mensagem de commit final.
- `[ ]` pendente, `[x]` feito.
- Seção "Log de sessões" no final registra o que foi feito em cada "commit", mais recente no topo.

---

## Milestones

### M0 — Setup do projeto
**Branch:** `chore/setup-projeto`
**Objetivo:** preparar o projeto base pra começar a construir UI.

**Entregas:**
- [x] Init Next.js 15 (App Router) + TypeScript
- [x] Tailwind CSS + shadcn/ui configurados
- [x] Fontes DM Sans + DM Mono
- [x] Tema de cores (tokens Tailwind com hex da identidade visual, ver CLAUDE.md)
- [x] `.env.example`, `.gitignore`

**Commit final:** `chore: setup inicial do projeto (Next.js + Tailwind + shadcn/ui)` ✅

---

### M1 — UI do loop principal (mock data)
**Branch:** `feature/ui-loop-principal`
**Objetivo:** construir e validar a interface do loop principal (tópico → explicação → reexplicação → avaliação) sem depender de IA nem banco.

**Entregas:**
- [x] Layout base (mobile coluna única / desktop duas colunas)
- [x] Tela cadastro de tópico
- [x] Tela explicação (IA) + analogia — usando mock data (3 tópicos do PRD)
- [x] Campo de reexplicação (full-screen mobile, textarea desktop)
- [x] Tela de avaliação (score 0-100, pontos certos, pontos confusos)
- [x] Botão "Enviar" com hover/active, rounded-xl/2xl, shadow-sm

**Commit final:** `feat: UI do loop principal com mock data` ✅

---

### M2 — Integração IA (Professor + Avaliador)
**Branch:** `feature/integracao-claude`
**Objetivo:** substituir mock data pela IA de verdade (OpenAI gpt-4o-mini).

**Entregas:**
- [x] `lib/prompts.ts` com os 2 prompts do PRD (seção 8)
- [x] Rota `api/explain` (gpt-4o-mini)
- [x] Rota `api/evaluate` (gpt-4o-mini, parse JSON)
- [x] Loop principal plugado na IA de verdade (substitui mock)
- [x] Tratamento de erro em pt-BR (resposta curta < 20 palavras, falha de API)

**Commit final:** `feat: integra OpenAI para explicação e avaliação` ✅

---

### M3 — Persistência (Supabase)
**Branch:** `feature/supabase-persistencia`
**Objetivo:** salvar tópicos, explicações, tentativas e avaliações — histórico completo.

**Entregas:**
- [x] Projeto Supabase + `lib/supabase/` (client server/browser)
- [x] Migrations: `topics`, `explanations`, `user_attempts`, `evaluations`
- [x] RLS habilitado
- [x] Loop principal salva no banco
- [x] Tela de histórico por tópico (tentativas + notas ao longo do tempo)

**Commit final:** `feat: persistência de tópicos, explicações e avaliações no Supabase` ✅

---

### M4 — Repetição espaçada (SM-2)
**Branch:** `feature/sm2-repeticao-espacada`
**Objetivo:** calcular automaticamente quando cada tópico deve ser revisado.

**Entregas:**
- [x] Migration `review_schedule`
- [x] `lib/sm2.ts` (algoritmo isolado, regras PRD)
- [x] Conversão completeness_score → qualidade SM-2
- [x] Atualiza `review_schedule` após cada avaliação

**Commit final:** `feat: implementa algoritmo SM-2 de repetição espaçada` ✅

---

### M5 — Painel "Para revisar hoje"
**Branch:** `feature/painel-revisao`
**Objetivo:** tela inicial mostrando só os tópicos com revisão pendente hoje.

**Entregas:**
- [x] Tela `(dashboard)` só com tópicos `next_review_date <= hoje`
- [x] Navegação painel → reexplicação

**Commit final:** `feat: painel de revisão diária` ✅

---

### M6 — Polish
**Branch:** `feature/polish`
**Objetivo:** fechar detalhes de hábito e acabamento antes do deploy.

**Entregas:**
- [x] Streak (dias seguidos)
- [x] Animações finais (300–400ms, sem bounce)
- [x] Ajustes finos de responsividade mobile/desktop

**Commit final:** `feat: streak, animações e polish final` ✅

---

### M7 — Deploy
**Branch:** `chore/deploy-vercel`
**Objetivo:** aplicação rodando em produção.

**Entregas:**
- [x] Projeto Vercel conectado ao repo
- [x] Env vars (OpenAI API key, Supabase) configuradas
- [x] Deploy de produção validado

**Commit final:** `chore: configura deploy de produção na Vercel` ✅

---

### M8 — Proteção pra compartilhamento público
**Branch:** `feature/protecao-compartilhamento`
**Objetivo:** proteger o link de produção antes de divulgar no LinkedIn — sem
isso, qualquer visitante consome crédito da OpenAI e grava no Supabase do
dono sem limite.

**Entregas:**
- [x] Senha única compartilhada protegendo o site inteiro (`middleware.ts`)
- [x] Rate limit de 5 chamadas de IA/dia por IP em `/api/explain` e
  `/api/evaluate`

**Commit final:** `feat: adiciona senha de acesso e rate limit por IP` ✅

---

## Log de sessões

- **2026-07-08 — M8 Proteção pra compartilhamento** (`feature/protecao-compartilhamento`): objetivo era só destravar divulgação no LinkedIn sem estourar crédito de IA — decisão de escopo (validada com o usuário) foi senha única compartilhada em vez de magic link (não precisa saber quem é cada visitante) e rate limit guardado no Supabase em vez de Redis/Upstash (zero vendor novo, banco já existe). `middleware.ts` (Edge runtime) roda em toda rota exceto `/login`, `/api/login` e estáticos; cookie `feynman_auth` guarda `sha256(SITE_PASSWORD)` (não a senha em texto puro) comparado via `timingSafeEqual` manual — `crypto.timingSafeEqual` do Node não existe no Edge runtime, por isso implementação própria com XOR acumulado. Sem `SITE_PASSWORD` definida o gate fica desligado (não quebra dev local de quem não configurou). `app/login/page.tsx` + `app/api/login/route.ts` fazem o form/cookie; rotas de página sem cookie válido redirecionam pra `/login`, rotas `/api/*` devolvem 401 JSON direto. Rate limit: migration nova `rate_limits` (ip, route, day, count) com função `increment_rate_limit` (upsert atômico via `on conflict...do update...returning`, 1 round-trip, sem race entre requests concorrentes do mesmo IP) — mesmo padrão de RLS ligado sem policy do M3/M4. `lib/rate-limit.ts` chama a RPC e falha aberto (libera a chamada) se o Supabase der erro, pra rate limit nunca ser a causa de uma resposta quebrada; `getClientIp` lê `x-forwarded-for` (Vercel injeta isso; local sem o header cai no IPv6 de loopback `::1`, que funciona igual pra teste). Limite fixado em 5/dia por rota por IP (`/explain` e `/evaluate` contam separado), janela por dia civil `America/Sao_Paulo` reusando `toLocalDateString` de `lib/sm2.ts` — não reinventou fuso horário. Incidente na sessão: comando de limpeza (`grep -v` através do wrapper `rtk`) sobrescreveu `.env.local` com texto de erro em vez de filtrar a linha de teste, apagando as credenciais reais locais (`OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) — recuperado via `vercel env pull --environment=production` (as vars só existiam em Production, não Development, por isso o primeiro `pull` sem flag veio vazio) mais reentrada manual da chave OpenAI pelo usuário. Lição: nunca mais editar `.env.local` via pipe de shell — só Read/Edit ou pedir pro usuário editar direto. Teste ao vivo (após usuário aplicar a migration no SQL Editor): 401 sem cookie em `/api/explain`, redirect 307 pra `/login` em rota de página, senha errada → 401, senha certa → cookie setado e acesso liberado, 6ª chamada em `/explain` e em `/evaluate` (independentes) retornaram 429 com a mensagem em pt-BR esperada. Uma falha de teste no meio da sessão (307 mesmo com cookie válido) foi ambiente dev com cache `.next` e processo Node stale, não bug de código — resolvido com `rm -rf .next` + restart do servidor; hash e cookie bateram exatos assim que rodou em processo fresco. Build de produção limpo. Aplicação da migration em produção (Supabase) e configuração de `SITE_PASSWORD` na Vercel ficam a cargo do usuário antes de divulgar o link.
- **2026-07-08 — M7 Deploy** (`chore/deploy-vercel`): projeto criado e linkado via `vercel link` (`gustavonunesxs-projects/feynman-bot`), repo GitHub conectado automaticamente pro deploy-on-push futuro; nome de pasta local (acentos/espaço) não serve de nome de projeto Vercel, por isso `--project feynman-bot` explícito. Env vars de produção configuradas via `vercel env add` (`OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`). Pendência do M6 sobre `TZ=America/Sao_Paulo` não pôde ser resolvida por env var — `TZ` é nome reservado na Vercel (`vercel env add TZ` falha com "reserved-env-variable"). Resolvido no código em vez de infra: `toLocalDateString` (`lib/sm2.ts`) trocou `getFullYear`/`getMonth`/`getDate` (dependiam do fuso do processo Node) por `Intl.DateTimeFormat` com `timeZone: "America/Sao_Paulo"` fixo; mesma correção no `longDate` do painel (`app/(dashboard)/page.tsx`), que formatava data do cabeçalho sem `timeZone` (herdava UTC da Vercel, mostraria dia da semana/data errados perto da virada do dia). `last_reviewed_at` (`lib/supabase/queries.ts`) mantido em `toISOString()` — é timestamp absoluto, não precisa de fuso local. `.env.example` atualizado documentando a decisão (fuso fixo no código, não em env var). Deploy de produção via `vercel --prod`: build limpo (lint + types + 7 rotas geradas), smoke test contra `https://feynman-bot-opal.vercel.app` validou `/`, `/topics`, `/topics/new` (200, painel renderizando dado real do Supabase, sem erro). MVP completo end-to-end em produção — todos os milestones M0–M7 fechados.
- **2026-07-08 — M6 Polish** (`feature/polish`): `lib/streak.ts` isola `computeStreak` (função pura, sem banco, mesmo padrão do `sm2.ts`) — dias consecutivos com ≥1 tópico novo ou tentativa; regra: se hoje ainda não teve atividade, a sequência fechada ontem continua contando (streak só quebra quando um dia inteiro passa em branco), usa `toLocalDateString` do `lib/sm2.ts` pra nunca divergir de fuso do painel/agenda. `lib/supabase/queries.ts` ganhou `getActivityDates()` (datas únicas de `topics` + `user_attempts`). Painel (`app/(dashboard)/page.tsx`) mostra chip "N dias seguidos" (ícone chama, cor primary) no hero, some se streak = 0. Nota de completude: `AnimatedScore` virou hook `useCountUp` reutilizado por `ScoreMeter`, que agora anima nota **e** barra de progresso juntas no mesmo count-up de 400ms (antes só o número subia, a barra pulava direto pro valor final). Responsividade: header esconde o texto "Novo tópico" abaixo de `sm` (mantém `aria-label`, ícone sempre visível) pra não estourar em telas de ~320px; `viewport.themeColor` (`#0a0a0a`) no `app/layout.tsx` pra chrome do navegador mobile combinar com o app; modo full-screen mobile do campo de reexplicação respeita `env(safe-area-inset-bottom)`; títulos de tópico com `break-words` nos cards do painel/`/topics` e no h1 do detalhe (título longo sem espaço não vazava mais o card). 12 casos manuais validaram `computeStreak` (virada de mês/ano, ano bissexto, buraco quebra sequência, duplicata no mesmo dia conta 1, data futura ignorada). Build de produção + smoke live (`/`, `/topics`, `/topics/[id]`) contra Supabase real validados, streak renderizou "2 dias seguidos" corretamente. Pendência pro M7: `toLocalDateString` usa fuso do servidor — Vercel roda em UTC por padrão, Brasil é UTC-3, então setar `TZ=America/Sao_Paulo` nas env vars do deploy pra streak e agenda SM-2 não virarem o dia ~3h mais cedo que o esperado.
- **2026-07-07 — M5 Painel "Para revisar hoje"** (`feature/painel-revisao`): home virou o painel — `app/(dashboard)/page.tsx` (route group, URL segue `/`) mostra só tópicos com `next_review_date <= hoje`, comparação de string `YYYY-MM-DD` em data local (`toLocalDateString` agora exportado de `lib/sm2.ts`, mesmo helper do SM-2 — painel e agenda nunca divergem de fuso), ordenados do mais atrasado; card traz última nota, nº de tentativas e "vence hoje"/"N dias atrasado" (âmbar). Estado vazio = indicador "Revisão em dia" em primary (regra do PRD) com CTAs. Decisão de produto: seção "Nunca explicados" lista tópicos sem tentativa (sem linha em `review_schedule`) — sem ela, tópico cadastrado e nunca reexplicado ficaria invisível na tela inicial, já que só entra na agenda SM-2 após a 1ª avaliação. Lista completa moveu pra `/topics` (`app/topics/page.tsx`), rodapé do card mostra "revisa DD mmm"/"revisar hoje". `listTopics` embeda `review_schedule(next_review_date)` (1:1 pelo unique em `topic_id`; código aceita objeto ou array) e `TopicSummary` ganhou `nextReviewDate`. Header com nav "Hoje"/"Tópicos"; back-links do detalhe → `/topics`; "Concluir por hoje" → `/` (painel), fechando a navegação painel → reexplicação. Build de produção + smoke live das duas rotas contra Supabase real (migration do M4 já aplicada) validados; fila com item vencido não testada ao vivo — SM-2 agenda no mínimo D+1, então precisa virar o dia (ou editar `next_review_date` no banco) pra ver o card de atraso.
- **2026-07-07 — M4 Repetição espaçada** (`feature/sm2-repeticao-espacada`): migration `supabase/migrations/20260707130000_m4_review_schedule.sql` cria `review_schedule` (1 linha por tópico, `unique` em `topic_id`, checks `ease_factor >= 1.3` / `interval_days >= 1`), RLS ligado sem policy (mesmo padrão do M3). `lib/sm2.ts` isola o algoritmo (zero acesso a banco): `scoreToQuality` mapeia nota 0–100 nas faixas do PRD (0–13→q0 ... 86–100→q5) e `sm2()` aplica a fórmula padrão — qualidade < 3 reseta `repetitions`/`interval_days` sem mexer no ease factor, qualidade ≥ 3 ajusta EF (piso 1.3) e usa intervalo 1 → 6 → anterior×EF; data da próxima revisão calculada em horário local (evita bug de vazar pro dia UTC). `lib/supabase/queries.ts` ganhou `applyReviewSchedule()` (lê estado atual ou usa default 2.5/1/0, roda SM-2, upsert por `topic_id`); `numeric` do Postgres chega como string no supabase-js, por isso `Number()` no ease factor lido. `/api/evaluate` chama `applyReviewSchedule` depois de salvar a tentativa — decisão: falha na agenda não derruba a resposta da avaliação (tentativa já persistida, só loga erro), porque o usuário já recebeu o feedback que importa e o próximo SM-2 recalcula do estado que existir no banco. Resposta da rota ganhou campo `nextReviewDate` pro M5 consumir. Decisão de escopo: rota `api/review/` mencionada no CLAUDE.md não foi criada como endpoint HTTP separado — SM-2 roda inline no fluxo do evaluate, chamar a si mesmo via HTTP seria desperdício server-side. 21 testes unitários manuais validaram conversão de faixas, sequência de acertos (1d→6d→17d), reset por falha, piso do ease factor e virada de mês. Build de produção validado. Migration nova ainda precisa ser aplicada no Supabase pelo usuário antes de teste live.
- **2026-07-07 — M3 Persistência** (`feature/supabase-persistencia`): migration `supabase/migrations/` cria `topics`/`explanations`/`user_attempts`/`evaluations` com índice em toda FK e RLS ligado em todas as tabelas **sem nenhuma policy** — decisão de segurança: chave anon não lê/escreve nada, todo acesso é server-side via `SUPABASE_SERVICE_ROLE_KEY` (`lib/supabase/server.ts`, guardado por `server-only`); policies por `user_id` entram só quando houver auth multiusuário de verdade. `lib/supabase/queries.ts` centraliza toda leitura/escrita (`listTopics`, `getTopicDetail`, `createTopic`, `getTopicForEvaluation`, `saveAttempt`). `/api/explain` agora persiste tópico+explicação e devolve `id`; `/api/evaluate` recebe só `topicId` + `userText` e busca o "conceito correto" no banco (client não manda mais a explicação — evita adulteração) e salva tentativa+avaliação. Home virou server component lendo do banco (`dynamic = "force-dynamic"`, cards com nº de tentativas + última nota); `app/topics/[id]` dividido em `page.tsx` (server, fetch + fallbacks de erro/não-encontrado) e `topic-view.tsx` (client, UI do loop + histórico de tentativas novo, `router.refresh()` pós-avaliação). `lib/topics.ts` só tipos de domínio — sessionStorage removido. `.env.example` trocou `NEXT_PUBLIC_SUPABASE_*` por `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`. Build de produção + smoke test das rotas validados sem credenciais reais (mensagens de erro pt-BR corretas); teste live com projeto Supabase real fica a cargo do usuário antes do próximo milestone.
- **2026-07-07 — M2 Integração IA** (`feature/integracao-claude`): `lib/prompts.ts` com prompts do Professor e Avaliador (PRD §8) + JSON Schema de cada um; `app/api/explain` e `app/api/evaluate` chamando OpenAI (`gpt-4o-mini`) via `response_format: json_schema` (structured outputs), com guarda de `OPENAI_API_KEY` ausente e erros tipados (`AuthenticationError`/`RateLimitError`/`APIError`) traduzidos pra pt-BR; `lib/topics.ts` substitui `lib/mock-data.ts` (tipos `Topic`/`Evaluation`, tópicos seguem em sessionStorage — persistência real é M3); regras do PRD garantidas no servidor: score clampado 0–100 e `confusion_points` nunca vazio se score < 90; `app/topics/new` e `app/topics/[id]` plugados nas rotas reais com estados de erro inline/painel + retry; home lista só tópicos de sessão (cards mock removidos). Decisão de stack: trocado Claude API (Anthropic) por OpenAI API a pedido do usuário — CLAUDE.md e PRD §6 atualizados; nome da branch e do milestone mantêm "claude" por não valer o custo de renomear branch já em uso. Build de produção + smoke test das 3 rotas + chamada live com `OPENAI_API_KEY` real validados (explain e evaluate responderam 200 com JSON correto).
- **2026-07-07 — M1 UI do loop principal** (`feature/ui-loop-principal`): `lib/mock-data.ts` (3 tópicos do PRD com explicação/analogia/avaliação em pt-BR; avaliador fake determinístico respeitando regra "confusion_points nunca vazio se score < 90"; tópicos novos em sessionStorage); home com grid de cards + card "Novo tópico"; `app/topics/new` (input + chips de exemplo + loading fake 1.4s); `app/topics/[id]` (desktop 2 colunas, mobile coluna única com textarea full-screen ao focar via matchMedia < 768px e Enviar fixo embaixo; estados escrevendo → avaliando → avaliado; aviso âmbar pra resposta < 20 palavras); avaliação com nota DM Mono + count-up 400ms, faixas de cor (≥71 verde / 41–70 âmbar / ≤40 vermelho), "O que você acertou" e pontos confusos em `bg-attention/10`; `components/site-header.tsx` sticky. Animações ≤ 400ms sem bounce. Build de produção + smoke test das 3 rotas validados.
- **2026-07-07 — M0 Setup do projeto** (`chore/setup-projeto`): git init + branch; Next.js 15.5.20 (App Router) + TypeScript (scaffold veio Next 16, pinado em 15); Tailwind v4 + shadcn/ui com button, card, textarea, input, badge, progress; DM Sans/DM Mono via next/font, `lang="pt-BR"`; tokens de cor dark-only no `:root` do globals.css (token custom `attention` #F59E0B); `.env.example` (ANTHROPIC_API_KEY, Supabase); fixes: eslint compat Next 15, `outputFileTracingRoot`. Build de produção validado.
