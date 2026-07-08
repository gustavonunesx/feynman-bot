# 📋 PRD — Feynman Bot
### Tutor de estudos com IA baseado na Técnica de Feynman

> Documento gerado seguindo a lógica de preenchimento da Etapa 0 (briefing) +
> complemento obrigatório, já convertido em PRD completo pronto para ir para
> o Claude Code ou Lovable.

---

## 1. Nome do Projeto

**Feynman Bot** — o espelho do seu entendimento: um tutor de IA que te obriga
a provar que você realmente aprendeu um assunto, não só que você o reconhece.

---

## 2. Problema Identificado

Quando alguém estuda um assunto técnico (programação, matemática, qualquer
área complexa), é muito comum sentir que "entendeu" só porque conseguiu
*ler e acompanhar* a explicação. Só que reconhecer um conceito e dominar
esse conceito são coisas diferentes — e essa diferença só aparece na hora
de explicar para outra pessoa, quando as lacunas ficam visíveis.

**Impacto medido/sentido:**
- Tempo perdido revisando o mesmo conteúdo várias vezes sem saber se
  realmente evoluiu ou só está "re-lendo".
- Sensação de insegurança na hora de aplicar o conceito na prática (ex: numa
  entrevista técnica, numa prova, ou escrevendo código de verdade), porque o
  entendimento nunca foi testado de verdade — só foi consumido passivamente.
- Falta de um sistema de revisão: mesmo quando um conceito é bem entendido
  uma vez, sem repetição espaçada ele é esquecido dentro de semanas.

---

## 3. Solução

Um app onde o usuário digita um tópico difícil, recebe uma explicação simples
com analogia gerada por IA, e então **precisa reexplicar o conceito com as
próprias palavras**. A IA compara essa reexplicação com o conceito real e
aponta exatamente onde ficou confuso, incompleto ou errado — funcionando
como um espelho honesto do entendimento do usuário. Tópicos já estudados
entram automaticamente num sistema de repetição espaçada, que decide quando
é a hora certa de revisar cada um.

Isso resolve o problema porque:
1. **Força prova de entendimento** — não basta ler, precisa reexplicar.
2. **Dá feedback específico e imediato** — em vez de "estudei mas não sei se
   entendi", o usuário sabe exatamente qual parte da explicação falhou.
3. **Garante retenção a longo prazo** — o sistema de repetição espaçada
   elimina a necessidade de decidir manualmente "o que revisar hoje".

---

## 4. Funcionalidades Principais

| Funcionalidade | Regra de negócio |
|---|---|
| Cadastro de novo tópico | Usuário digita um tópico livre (texto). Não há lista fechada de temas — qualquer assunto pode ser cadastrado. |
| Explicação inicial com analogia (IA) | A IA sempre responde em 2 partes: explicação simples (linguagem de "explicar pra uma criança") + 1 analogia concreta do dia a dia. Nunca usa jargão técnico não explicado na primeira explicação. |
| Reexplicação do usuário | Campo de texto livre onde o usuário escreve, com as próprias palavras, o que entendeu. Não há limite mínimo de caracteres, mas a IA avisa se a resposta for curta demais para avaliar (< 20 palavras). |
| Avaliação da IA (o "espelho") | A IA compara a reexplicação com o conceito correto e retorna: (1) o que está certo, (2) pontos confusos/incompletos específicos, (3) uma nota de completude de 0 a 100. Nunca apenas diz "certo" ou "errado" sem apontar o motivo. |
| Histórico de tópicos | Todo tópico estudado fica salvo com: explicação original, todas as tentativas de reexplicação, e a nota de cada tentativa ao longo do tempo. |
| Repetição espaçada (estilo Anki) | Cada tópico tem uma data de próxima revisão calculada automaticamente pelo algoritmo SM-2 (ver seção 13). O usuário nunca escolhe manualmente quando revisar. |
| Painel "Para revisar hoje" | Tela inicial mostra só os tópicos cuja data de revisão chegou — não a lista inteira, para não sobrecarregar. |
| Streak / constância | Contador de dias seguidos em que o usuário fez ao menos 1 revisão ou 1 tópico novo — reforço de hábito, não é o foco central do MVP. |

---

## 5. Persona e Tipos de Usuários

Para o MVP, o Feynman Bot é uma ferramenta **pessoal, de usuário único**
(o próprio Gustavo estudando conceitos de programação e outros temas).

| Papel | Pode fazer | Não pode fazer |
|---|---|---|
| Estudante (usuário único) | Cadastrar tópicos, reexplicar, ver histórico, ver painel de revisão, editar/apagar tópicos próprios | Não existe multiusuário na v1 — não há papéis de admin, professor ou visualização de tópicos de terceiros |

> 💡 Nota para o futuro: se um dia isso virar produto para outras pessoas
> usarem (ex: uma versão paga para outros devs/estudantes), aí sim entra
> autenticação multiusuário com Supabase Auth e isolamento de dados por
> `user_id` — a estrutura do banco já é pensada para suportar isso sem
> retrabalho (ver seção 12).

---

## 6. Stack Tecnológica

| Camada | Escolha | Por quê |
|---|---|---|
| Frontend | Next.js 15 (App Router) + React + TypeScript | Você já domina, reaproveita conhecimento do FinDash e Melinhas |
| Estilo | Tailwind CSS + shadcn/ui | Consistência com seus outros projetos, rapidez de build |
| Banco de dados | Supabase (Postgres) | Você já domina; RLS resolve isolamento de dados desde já, mesmo sendo mono-usuário agora |
| IA — explicação e avaliação | OpenAI API — modelo gpt-4o-mini para o dia a dia (custo baixo, resposta rápida) | gpt-4o-mini é suficiente para explicações e avaliações de texto, com custo baixo o bastante para uso pessoal ilimitado |
| Deploy | Vercel | Deploy gratuito, integração nativa com Next.js |

**Restrição importante:** como é projeto pessoal (não é entregável de
cliente), a prioridade é **custo zero ou próximo de zero** rodando — por
isso gpt-4o-mini em vez de um modelo mais caro, e planos gratuitos de
Supabase/Vercel.

---

## 7. Referências de Design

Sem referência visual externa definida ainda. Como é uma ferramenta de uso
pessoal e frequente (você vai abrir isso todo dia), a linha de design
sugerida prioriza **foco e ausência de distração** — parecido com um editor
de notas, não com uma landing page de vendas. Segue a mesma linguagem visual
que você já usa nos seus próprios projetos (FinDash): fundo escuro, verde
como cor de destaque, tipografia limpa.

---

## COMPLEMENTO OBRIGATÓRIO DA ETAPA 0

### Paleta de cores

| Nome | Hex | Onde usar |
|---|---|---|
| Primary | `#1D9E75` | Botões de ação, indicador de "revisão em dia", CTA principal |
| Background | `#0A0A0A` | Fundo geral da aplicação |
| Card | `#141414` | Cards de tópico, área de explicação da IA |
| Text | `#F5F5F5` (principal) / `#A3A3A3` (secundário) | Texto principal e legendas/metadados |
| Accent (atenção) | `#F59E0B` | Destaque nos trechos que a IA aponta como confusos/incompletos na avaliação |

### Tipografia

- **Heading (H1/H2/H3):** DM Sans, bold
- **Body / Botões:** DM Sans, regular/medium
- **Números/Monospace:** DM Mono — usado nas notas de completude (0–100), datas de revisão e contador de streak

### Regras de design — o que NUNCA fazer

- **Border radius:** nunca usar cantos retos (`rounded-none`) — cards e botões sempre `rounded-xl` ou `rounded-2xl`, mantendo a sensação de app calmo, não de formulário burocrático.
- **Botões CTA:** nunca sem estado de `hover`/`active` visível — o botão de "Enviar reexplicação" é a ação mais importante da tela e precisa responder ao clique.
- **Sombras:** nunca sombras pesadas/duras — usar `shadow-sm` no máximo, o app não deve parecer "flutuante" demais.
- **Animações:** duração máxima de 300–400ms, sem efeito bounce/elastic — é uma ferramenta de estudo, a transição não pode competir com a atenção do usuário.

### Idioma do conteúdo final

Todo o conteúdo em **pt-BR** — interface, explicações da IA, avaliações e
mensagens de erro. As chamadas para a API da Claude devem instruir
explicitamente resposta em português (ver prompts na seção 14).

### Responsividade

- **Mobile:** layout em coluna única. O campo de reexplicação vira tela
  cheia (full-screen) ao ser focado, para não competir com o teclado
  virtual. Botão "Enviar" fixo na parte inferior, sempre visível mesmo com
  o teclado aberto.
- **Desktop:** layout em duas colunas — explicação da IA à esquerda, campo
  de reexplicação à direita — permitindo visualizar os dois ao mesmo tempo
  enquanto escreve.

### Modelo de dados (rascunho)

```sql
-- Tópicos cadastrados pelo usuário
create table topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id), -- já preparado para multiusuário futuro
  title text not null,
  created_at timestamptz default now()
);

-- Explicação inicial gerada pela IA para cada tópico
create table explanations (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references topics(id) on delete cascade,
  ai_explanation text not null,
  ai_analogy text not null,
  created_at timestamptz default now()
);

-- Cada tentativa de reexplicação do usuário
create table user_attempts (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references topics(id) on delete cascade,
  user_text text not null,
  created_at timestamptz default now()
);

-- Avaliação da IA sobre cada tentativa
create table evaluations (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid references user_attempts(id) on delete cascade,
  completeness_score int not null check (completeness_score between 0 and 100),
  confusion_points text[], -- lista de pontos confusos/incompletos apontados
  what_was_right text,
  created_at timestamptz default now()
);

-- Agenda de repetição espaçada (1 linha por tópico)
create table review_schedule (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references topics(id) on delete cascade unique,
  ease_factor numeric default 2.5,      -- fator de facilidade do SM-2
  interval_days int default 1,          -- intervalo atual em dias
  repetitions int default 0,            -- quantas revisões corretas seguidas
  next_review_date date not null,
  last_reviewed_at timestamptz
);
```

### Regras de negócio críticas

**Algoritmo de repetição espaçada (SM-2, o mesmo usado pelo Anki):**

> 💡 Explicação simples: depois de cada revisão, o sistema decide "daqui a
> quantos dias devo te lembrar desse assunto de novo?". Se você foi bem, o
> intervalo aumenta (o cérebro está retendo, não precisa revisar logo). Se
> você foi mal, o intervalo cai quase para zero (precisa revisar de novo
> amanhã, porque ainda não fixou).

1. A nota de completude (0–100) da avaliação da IA é convertida em uma
   "qualidade de resposta" de 0 a 5 (padrão do SM-2):
   - 0–40 → qualidade 0–2 (ruim, reinicia intervalo)
   - 41–70 → qualidade 3 (mediano, mantém intervalo curto)
   - 71–100 → qualidade 4–5 (bom, aumenta intervalo)
2. Se qualidade < 3: `repetitions = 0`, `interval_days = 1` (revisa amanhã).
3. Se qualidade >= 3:
   - `repetitions += 1`
   - Se `repetitions == 1`: `interval_days = 1`
   - Se `repetitions == 2`: `interval_days = 6`
   - Se `repetitions > 2`: `interval_days = interval_days_anterior * ease_factor`
   - `ease_factor` é ajustado pela fórmula padrão do SM-2, com piso mínimo de `1.3`.
4. `next_review_date = hoje + interval_days`.

**Regra de avaliação da IA:** a avaliação nunca pode ser só "está certo" ou
"está errado" — ela é obrigada a citar ao menos 1 ponto específico (certo ou
a melhorar) para o usuário confiar no feedback e saber o que ajustar.

---

## 8. Prompts de IA sugeridos

**Prompt do "Professor" (gera explicação inicial):**
```
Você é um professor que explica conceitos técnicos usando a Técnica de
Feynman: linguagem simples, como se explicasse para alguém que nunca ouviu
falar do assunto, sempre com uma analogia do dia a dia. Responda em
português do Brasil. Tópico: {topic}

Formato da resposta:
1. Explicação simples (máximo 150 palavras, sem jargão não explicado)
2. Uma analogia concreta do cotidiano que ilustre o conceito
```

**Prompt do "Avaliador" (compara reexplicação do usuário):**
```
Você é um avaliador rigoroso, mas construtivo, aplicando a Técnica de
Feynman. Compare a reexplicação do usuário abaixo com o conceito correto
sobre "{topic}" e responda em português do Brasil.

Conceito correto: {ai_explanation}
Reexplicação do usuário: {user_text}

Responda em JSON com os campos:
- "completeness_score": número de 0 a 100
- "what_was_right": o que o usuário entendeu corretamente
- "confusion_points": lista de pontos confusos, incompletos ou incorretos
  (nunca deixe essa lista vazia se completeness_score < 90)
```

---

## 9. Prioridade de Build (MVP)

1. **Loop principal isolado:** input de tópico → explicação da IA com
   analogia → reexplicação do usuário → avaliação da IA. Sem banco de
   dados ainda — só para validar se o produto "funciona" na prática.
2. **Persistência:** salvar tópicos, explicações, tentativas e avaliações
   no Supabase (histórico completo).
3. **Repetição espaçada:** implementar o algoritmo SM-2 e a tabela
   `review_schedule`.
4. **Painel "Para revisar hoje":** tela inicial mostrando só o que está na
   data.
5. **Polish:** streak, gamificação leve, animações finais.

### Mock data

Para testar a interface antes de plugar a IA de verdade, usar pelo menos 3
tópicos de exemplo com explicação e avaliação fictícias:
- "Recursão em programação"
- "Closures em JavaScript"
- "Programação Orientada a Objetos"

---

## ✅ Checklist final antes de considerar o PRD pronto

- [x] Nome, problema, solução e funcionalidades detalhadas
- [x] Persona definida (usuário único, com estrutura pronta para multiusuário)
- [x] Stack tecnológica com justificativa e restrição de custo
- [x] Paleta de cores em HEX
- [x] Tipografia definida
- [x] Regras de "nunca fazer" no design
- [x] Idioma especificado (pt-BR)
- [x] Responsividade mobile/desktop descritas separadamente
- [x] Modelo de dados em SQL
- [x] Regra de negócio crítica (algoritmo SM-2) detalhada
- [x] Prompts de IA prontos para uso
- [x] Prioridade de build (MVP) definida
- [x] Mock data sugerido

---

*PRD gerado em Julho 2026 — Gustavo / projeto pessoal.*
