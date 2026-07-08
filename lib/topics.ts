/**
 * Tipos de domínio do loop principal. Desde o M3 os tópicos vivem no
 * Supabase — o acesso ao banco fica em lib/supabase/, aqui só o modelo.
 */

export interface Topic {
  id: string;
  title: string;
  explanation: string;
  analogy: string;
  createdAt: string;
}

export interface Evaluation {
  completenessScore: number;
  whatWasRight: string;
  confusionPoints: string[];
}

/** Tentativa de reexplicação; avaliação pode faltar se o save falhou no meio. */
export interface Attempt {
  id: string;
  userText: string;
  createdAt: string;
  evaluation: Evaluation | null;
}

export interface TopicDetail extends Topic {
  attempts: Attempt[];
}

/** Card da home: tópico + resumo do histórico. */
export interface TopicSummary {
  id: string;
  title: string;
  createdAt: string;
  attemptCount: number;
  lastScore: number | null;
}

/** Sugestões de tópicos pra tela de cadastro (chips de exemplo do PRD). */
export const EXAMPLE_TOPIC_TITLES = [
  "Recursão em programação",
  "Closures em JavaScript",
  "Programação Orientada a Objetos",
];

/** Conta palavras do jeito que o PRD define o aviso de resposta curta (< 20). */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export const MIN_WORDS = 20;
