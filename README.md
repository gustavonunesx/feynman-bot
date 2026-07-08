# 🪞 Feynman Bot

**Tutor de estudos com IA baseado na Técnica de Feynman** — um espelho do seu entendimento.

Você digita um tópico difícil, a IA explica de forma simples com uma analogia, e então **você precisa reexplicar o conceito com suas próprias palavras**. A IA compara sua reexplicação com o conceito real, aponta exatamente onde ficou confuso ou incompleto, e agenda a próxima revisão automaticamente via repetição espaçada (SM-2, o mesmo algoritmo do Anki).

> Projeto pessoal, uso único (Gustavo), com prioridade de custo zero/próximo de zero.

🔗 **Produção:** [feynman-bot-opal.vercel.app](https://feynman-bot-opal.vercel.app)

---

## Por que existe

Ler ou acompanhar uma explicação técnica dá a falsa sensação de "entendi". A diferença entre reconhecer um conceito e dominá-lo só aparece na hora de explicar para outra pessoa — é aí que as lacunas ficam visíveis (a base da Técnica de Feynman).

O Feynman Bot força essa prova de entendimento a cada tópico novo, dá feedback específico (nunca um genérico "certo/errado"), e garante retenção a longo prazo com repetição espaçada — sem o usuário precisar decidir manualmente o que revisar.

Documento de referência completo: [docs/PRD.md](docs/PRD.md). Roadmap e histórico de build: [docs/PLAN.md](docs/PLAN.md).

---

## Como funciona (loop principal)

1. **Cadastra um tópico** — texto livre, qualquer assunto.
2. **IA "Professor" explica** — resposta em 2 partes: explicação simples (linguagem de "explicar pra uma criança", sem jargão) + 1 analogia do cotidiano.
3. **Você reexplica** com suas próprias palavras, num campo de texto livre.
4. **IA "Avaliador" avalia** — compara sua reexplicação com o conceito correto e retorna:
   - o que você acertou;
   - pontos confusos/incompletos específicos (nunca fica vazio se a nota for < 90);
   - uma nota de completude de 0 a 100.
5. **Repetição espaçada (SM-2)** recalcula automaticamente a próxima data de revisão daquele tópico com base na nota.
6. **Painel "Para revisar hoje"** mostra só os tópicos com revisão pendente — não a lista inteira.

---

## Funcionalidades

| Funcionalidade | Regra de negócio |
|---|---|
| Cadastro de tópico | Texto livre, sem lista fechada de temas |
| Explicação com analogia (IA) | Sempre explicação simples + 1 analogia concreta, sem jargão não explicado |
| Reexplicação do usuário | Texto livre; aviso se resposta < 20 palavras (curta demais pra avaliar) |
| Avaliação da IA | Nota 0–100 + o que acertou + pontos confusos — nunca só "certo/errado" |
| Histórico por tópico | Todas as tentativas de reexplicação e notas ao longo do tempo |
| Repetição espaçada (SM-2) | Próxima revisão calculada automaticamente, usuário nunca escolhe manualmente |
| Painel "Para revisar hoje" | Tela inicial só com tópicos vencidos/vencendo hoje |
| Streak | Contador de dias seguidos com atividade (tópico novo ou revisão) |

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | [Next.js 15](https://nextjs.org) (App Router) + React 19 + TypeScript |
| Estilo | Tailwind CSS v4 (CSS-first, tokens em `app/globals.css`) + [shadcn/ui](https://ui.shadcn.com) |
| Banco | [Supabase](https://supabase.com) (Postgres) — RLS ligado em todas as tabelas, acesso só server-side |
| IA | [OpenAI API](https://platform.openai.com), modelo `gpt-4o-mini` (custo baixo) |
| Deploy | [Vercel](https://vercel.com) |

**Por quê essas escolhas:** stack já dominada pelo autor (reaproveitada de outros projetos pessoais), Supabase resolve isolamento de dados via RLS mesmo sendo mono-usuário hoje, e `gpt-4o-mini` é suficiente para explicações/avaliações de texto com custo baixo o bastante pra uso pessoal ilimitado.

---

## Identidade visual

App dark-only, linha de foco/ausência de distração (tipo editor de notas, não landing page de vendas).

| Nome | Hex | Uso |
|---|---|---|
| Primary | `#1D9E75` | CTA, indicador "revisão em dia" |
| Background | `#0A0A0A` | Fundo geral |
| Card | `#141414` | Cards de tópico, área de explicação |
| Texto principal | `#F5F5F5` | Texto principal |
| Texto secundário | `#A3A3A3` | Legendas, metadados |
| Accent (atenção) | `#F59E0B` | Trechos que a IA aponta como confusos |

- **Fontes:** DM Sans (headings + body/botões) · DM Mono (números: score, datas, streak)
- **Border radius:** nunca reto — sempre `rounded-xl`/`rounded-2xl`
- **Sombras:** leves só, `shadow-sm` no máximo
- **Animações:** 300–400ms máx, sem bounce/elastic
- **Idioma:** todo conteúdo visível (UI, respostas da IA, erros) em pt-BR

**Responsividade:**
- Mobile: coluna única; campo de reexplicação full-screen ao focar; botão "Enviar" fixo embaixo
- Desktop: duas colunas (explicação à esquerda, reexplicação à direita)

---

## Repetição espaçada (SM-2)

Depois de cada avaliação, o sistema decide daqui a quantos dias revisar o tópico de novo. Foi bem → intervalo aumenta. Foi mal → intervalo cai quase a zero.

1. Nota de completude (0–100) vira "qualidade de resposta" 0–5:
   - 0–40 → qualidade 0–2 (ruim, reinicia intervalo)
   - 41–70 → qualidade 3 (mediano, intervalo curto)
   - 71–100 → qualidade 4–5 (bom, aumenta intervalo)
2. Qualidade < 3 → `repetitions = 0`, `interval_days = 1` (revisa amanhã)
3. Qualidade ≥ 3 → `repetitions += 1`; `interval_days` segue 1 → 6 → anterior × `ease_factor` (piso `1.3`)
4. `next_review_date = hoje + interval_days`

Implementado isolado em [lib/sm2.ts](lib/sm2.ts) — puro, sem acesso a banco, testável.

---

## Estrutura do projeto

```
app/
  (dashboard)/          # home ("/"): painel "para revisar hoje"
  topics/                # lista completa de tópicos ("/topics")
    new/                 # cadastro de tópico
    [id]/                # detalhe: explicação + reexplicação + histórico
  api/
    explain/             # rota que chama OpenAI (prompt "Professor")
    evaluate/             # rota que chama OpenAI (prompt "Avaliador") + roda SM-2 inline após salvar
components/
  ui/                     # shadcn/ui primitives
  site-header.tsx         # header sticky compartilhado
lib/
  supabase/
    server.ts             # client server-only (service role, ignora RLS)
    queries.ts             # toda leitura/escrita no banco + applyReviewSchedule
  sm2.ts                  # algoritmo de repetição espaçada, puro
  streak.ts               # cálculo de streak, puro
  prompts.ts              # prompts do Professor e Avaliador
  topics.ts               # tipos de domínio (Topic/Evaluation/Attempt)
supabase/
  migrations/              # SQL aplicado manualmente no projeto Supabase
docs/
  PRD.md                   # requisitos completos do produto
  PLAN.md                  # roadmap e log de sessões de build
```

## Modelo de dados

Postgres via Supabase. RLS habilitado em todas as tabelas, **sem policies** — todo acesso é server-side com `SUPABASE_SERVICE_ROLE_KEY` (chave anon não é usada). Policies por `user_id` entram só quando houver auth multiusuário real; a coluna `user_id` em `topics` já existe hoje preparando esse caminho.

```sql
topics            (id, user_id, title, created_at)
explanations      (id, topic_id → topics, ai_explanation, ai_analogy, created_at)
user_attempts     (id, topic_id → topics, user_text, created_at)
evaluations       (id, attempt_id → user_attempts, completeness_score, confusion_points[], what_was_right, created_at)
review_schedule   (id, topic_id → topics [unique], ease_factor, interval_days, repetitions, next_review_date, last_reviewed_at)
```

---

## Rodando localmente

Pré-requisitos: Node.js 20+, um projeto Supabase e uma chave da OpenAI API.

```bash
npm install
cp .env.example .env.local   # preencher OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
npm run dev
```

Aplicar as migrations em `supabase/migrations/` manualmente no projeto Supabase antes do primeiro uso.

Scripts disponíveis:

| Comando | Ação |
|---|---|
| `npm run dev` | Ambiente de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Roda o build de produção |
| `npm run lint` | Lint (ESLint) |

---

## Status

MVP completo — todos os milestones (M0–M7) fechados, rodando em produção. Detalhes de cada etapa e decisões técnicas em [docs/PLAN.md](docs/PLAN.md).

- [x] M0 — Setup do projeto
- [x] M1 — UI do loop principal (mock data)
- [x] M2 — Integração IA (Professor + Avaliador)
- [x] M3 — Persistência (Supabase)
- [x] M4 — Repetição espaçada (SM-2)
- [x] M5 — Painel "Para revisar hoje"
- [x] M6 — Polish (streak, animações, responsividade)
- [x] M7 — Deploy (Vercel)
