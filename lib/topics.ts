/**
 * Tipos e armazenamento dos tópicos no M2: a explicação vem da IA de
 * verdade (/api/explain), mas ainda vive só em sessionStorage — a
 * persistência real (Supabase) entra no M3.
 */

export interface Topic {
  id: string;
  title: string;
  explanation: string;
  analogy: string;
}

export interface Evaluation {
  completenessScore: number;
  whatWasRight: string;
  confusionPoints: string[];
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

const SESSION_KEY = "feynman-session-topics";

export function saveSessionTopic(topic: Omit<Topic, "id">): Topic {
  const saved: Topic = { id: `sessao-${Date.now().toString(36)}`, ...topic };
  const existing = readSessionTopics();
  sessionStorage.setItem(SESSION_KEY, JSON.stringify([...existing, saved]));
  return saved;
}

export function readSessionTopics(): Topic[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "[]") as Topic[];
  } catch {
    return [];
  }
}

export function getSessionTopic(id: string): Topic | undefined {
  return readSessionTopics().find((t) => t.id === id);
}
