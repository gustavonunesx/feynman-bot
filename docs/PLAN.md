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
**Objetivo:** substituir mock data pela IA de verdade (Claude Haiku).

**Entregas:**
- [ ] `lib/prompts.ts` com os 2 prompts do PRD (seção 8)
- [ ] Rota `api/explain` (Claude Haiku)
- [ ] Rota `api/evaluate` (Claude Haiku, parse JSON)
- [ ] Loop principal plugado na IA de verdade (substitui mock)
- [ ] Tratamento de erro em pt-BR (resposta curta < 20 palavras, falha de API)

**Commit final:** `feat: integra Claude Haiku para explicação e avaliação`

---

### M3 — Persistência (Supabase)
**Branch:** `feature/supabase-persistencia`
**Objetivo:** salvar tópicos, explicações, tentativas e avaliações — histórico completo.

**Entregas:**
- [ ] Projeto Supabase + `lib/supabase/` (client server/browser)
- [ ] Migrations: `topics`, `explanations`, `user_attempts`, `evaluations`
- [ ] RLS habilitado
- [ ] Loop principal salva no banco
- [ ] Tela de histórico por tópico (tentativas + notas ao longo do tempo)

**Commit final:** `feat: persistência de tópicos, explicações e avaliações no Supabase`

---

### M4 — Repetição espaçada (SM-2)
**Branch:** `feature/sm2-repeticao-espacada`
**Objetivo:** calcular automaticamente quando cada tópico deve ser revisado.

**Entregas:**
- [ ] Migration `review_schedule`
- [ ] `lib/sm2.ts` (algoritmo isolado, regras PRD)
- [ ] Conversão completeness_score → qualidade SM-2
- [ ] Atualiza `review_schedule` após cada avaliação

**Commit final:** `feat: implementa algoritmo SM-2 de repetição espaçada`

---

### M5 — Painel "Para revisar hoje"
**Branch:** `feature/painel-revisao`
**Objetivo:** tela inicial mostrando só os tópicos com revisão pendente hoje.

**Entregas:**
- [ ] Tela `(dashboard)` só com tópicos `next_review_date <= hoje`
- [ ] Navegação painel → reexplicação

**Commit final:** `feat: painel de revisão diária`

---

### M6 — Polish
**Branch:** `feature/polish`
**Objetivo:** fechar detalhes de hábito e acabamento antes do deploy.

**Entregas:**
- [ ] Streak (dias seguidos)
- [ ] Animações finais (300–400ms, sem bounce)
- [ ] Ajustes finos de responsividade mobile/desktop

**Commit final:** `feat: streak, animações e polish final`

---

### M7 — Deploy
**Branch:** `chore/deploy-vercel`
**Objetivo:** aplicação rodando em produção.

**Entregas:**
- [ ] Projeto Vercel conectado ao repo
- [ ] Env vars (Claude API key, Supabase) configuradas
- [ ] Deploy de produção validado

**Commit final:** `chore: configura deploy de produção na Vercel`

---

## Log de sessões

- **2026-07-07 — M1 UI do loop principal** (`feature/ui-loop-principal`): `lib/mock-data.ts` (3 tópicos do PRD com explicação/analogia/avaliação em pt-BR; avaliador fake determinístico respeitando regra "confusion_points nunca vazio se score < 90"; tópicos novos em sessionStorage); home com grid de cards + card "Novo tópico"; `app/topics/new` (input + chips de exemplo + loading fake 1.4s); `app/topics/[id]` (desktop 2 colunas, mobile coluna única com textarea full-screen ao focar via matchMedia < 768px e Enviar fixo embaixo; estados escrevendo → avaliando → avaliado; aviso âmbar pra resposta < 20 palavras); avaliação com nota DM Mono + count-up 400ms, faixas de cor (≥71 verde / 41–70 âmbar / ≤40 vermelho), "O que você acertou" e pontos confusos em `bg-attention/10`; `components/site-header.tsx` sticky. Animações ≤ 400ms sem bounce. Build de produção + smoke test das 3 rotas validados.
- **2026-07-07 — M0 Setup do projeto** (`chore/setup-projeto`): git init + branch; Next.js 15.5.20 (App Router) + TypeScript (scaffold veio Next 16, pinado em 15); Tailwind v4 + shadcn/ui com button, card, textarea, input, badge, progress; DM Sans/DM Mono via next/font, `lang="pt-BR"`; tokens de cor dark-only no `:root` do globals.css (token custom `attention` #F59E0B); `.env.example` (ANTHROPIC_API_KEY, Supabase); fixes: eslint compat Next 15, `outputFileTracingRoot`. Build de produção validado.
