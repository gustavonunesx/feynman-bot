# Feynman Bot

Tutor de estudos com IA baseado na Técnica de Feynman. PRD completo: [docs/PRD.md](docs/PRD.md) — ler antes de trabalhar em feature nova. Milestones e progresso: [docs/PLAN.md](docs/PLAN.md).

## Workflow com o usuário

- **"contexto"** (início de sessão): ler CLAUDE.md + docs/PLAN.md inteiros. Identificar próximo milestone não concluído (ou o que ficou pendente) e dar prosseguimento a partir daí, sem pedir confirmação de novo do que já está definido no docs/PLAN.md.
- **"commit"** (fim de feature): nessa ordem —
  1. Atualizar docs/PLAN.md: marcar item/milestone concluído, registrar o que foi feito na sessão.
  2. Atualizar CLAUDE.md se a feature mudou stack, estrutura de pastas ou convenção.
  3. `git add` + commit na branch da feature (mensagem descrevendo a feature).
  4. `git push` da branch.
  5. Abrir PR pra `main` (`gh pr create`).

## O que é

Usuário cadastra tópico difícil → IA explica simples + analogia → usuário reexplica com próprias palavras → IA avalia (nota 0-100 + pontos certos/confusos) → tópico entra em repetição espaçada (SM-2, estilo Anki). Projeto pessoal, usuário único, prioridade custo zero.

## Stack

- **Frontend:** Next.js 15 (App Router) + React + TypeScript
- **Estilo:** Tailwind CSS + shadcn/ui
- **Banco:** Supabase (Postgres), RLS ligado desde já mesmo mono-usuário
- **IA:** Claude API (Anthropic), modelo **Haiku** (custo baixo) — nunca trocar por modelo mais caro sem necessidade explícita
- **Deploy:** Vercel

## Estrutura de pastas (Next.js App Router)

```
app/
  (dashboard)/          # painel "para revisar hoje"
  topics/
    new/                # cadastro de tópico
    [id]/               # detalhe: explicação + reexplicação + histórico
  api/
    explain/            # rota que chama Claude (prompt "Professor")
    evaluate/           # rota que chama Claude (prompt "Avaliador")
    review/             # cálculo SM-2, atualiza review_schedule
components/
  ui/                    # shadcn/ui primitives
lib/
  supabase/              # client server/browser
  sm2.ts                 # algoritmo de repetição espaçada
  prompts.ts             # prompts do Professor e Avaliador (ver PRD seção 8)
docs/
  PRD.md
```

## Convenções

- Todo conteúdo visível ao usuário (UI, respostas da IA, erros) em **pt-BR**.
- Prompts Claude sempre instruem explicitamente "responda em português do Brasil".
- Avaliação da IA nunca é só "certo/errado" — sempre cita ≥1 ponto específico (ver PRD seção 13, regra crítica).
- Algoritmo SM-2 implementado em `lib/sm2.ts`, isolado e testável — não embutir lógica de intervalo direto nas rotas de API.
- Schema SQL já modelado com `user_id` em `topics` mesmo sendo mono-usuário — não remover essa coluna, é preparo pro multiusuário futuro.

## Identidade visual

| Nome | Hex | Uso |
|---|---|---|
| Primary | `#1D9E75` | CTA, indicador "revisão em dia" |
| Background | `#0A0A0A` | Fundo geral |
| Card | `#141414` | Cards de tópico, área de explicação |
| Text principal | `#F5F5F5` | Texto principal |
| Text secundário | `#A3A3A3` | Legendas, metadados |
| Accent (atenção) | `#F59E0B` | Trechos que a IA aponta como confusos |

- **Fontes:** DM Sans (headings + body/botões), DM Mono (números: score, datas, streak)
- **Border radius:** nunca reto — `rounded-xl`/`rounded-2xl` sempre
- **Botões CTA:** sempre com hover/active visível
- **Sombras:** leves só, `shadow-sm` no máximo
- **Animações:** 300–400ms máx, sem bounce/elastic
- Linha geral: foco e ausência de distração, tipo editor de notas — não landing page de vendas

## Responsividade

- Mobile: coluna única; campo de reexplicação fica full-screen ao focar; botão "Enviar" fixo embaixo
- Desktop: duas colunas (explicação à esquerda, reexplicação à direita)

## Ordem de build (MVP)

Ver [docs/PLAN.md](docs/PLAN.md) pra milestones detalhados (branch, entregas, commit) e status atual. Visão geral:

1. Loop principal sem banco (tópico → explicação IA → reexplicação → avaliação IA)
2. Persistência Supabase (histórico completo)
3. SM-2 + `review_schedule`
4. Painel "para revisar hoje"
5. Polish (streak, gamificação leve, animações)

Mock data pra testar UI antes da IA: "Recursão em programação", "Closures em JavaScript", "Programação Orientada a Objetos".
