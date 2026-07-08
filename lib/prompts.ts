/**
 * Prompts do Professor e do Avaliador (PRD seção 8), usados pelas rotas
 * /api/explain e /api/evaluate. As duas rotas usam structured outputs
 * (JSON garantido pela API), então os prompts descrevem o conteúdo dos
 * campos — o formato é imposto pelo schema, não pelo texto.
 */

export const MODEL = "gpt-4o-mini";

export function buildProfessorPrompt(topic: string): string {
  return `Você é um professor que explica conceitos técnicos usando a Técnica de
Feynman: linguagem simples, como se explicasse para alguém que nunca ouviu
falar do assunto, sempre com uma analogia do dia a dia. Responda em
português do Brasil. Tópico: ${topic}

Preencha os campos da resposta assim:
- "explanation": explicação simples (máximo 150 palavras, sem jargão não explicado)
- "analogy": uma analogia concreta do cotidiano que ilustre o conceito`;
}

export const PROFESSOR_SCHEMA = {
  type: "object",
  properties: {
    explanation: {
      type: "string",
      description:
        "Explicação simples do tópico, máximo 150 palavras, sem jargão não explicado, em português do Brasil.",
    },
    analogy: {
      type: "string",
      description:
        "Uma analogia concreta do dia a dia que ilustre o conceito, em português do Brasil.",
    },
  },
  required: ["explanation", "analogy"],
  additionalProperties: false,
} as const;

export function buildEvaluatorPrompt(
  topic: string,
  aiExplanation: string,
  userText: string
): string {
  return `Você é um avaliador rigoroso, mas construtivo, aplicando a Técnica de
Feynman. Compare a reexplicação do usuário abaixo com o conceito correto
sobre "${topic}" e responda em português do Brasil.

Conceito correto: ${aiExplanation}
Reexplicação do usuário: ${userText}

Preencha os campos da resposta assim:
- "completeness_score": número de 0 a 100
- "what_was_right": o que o usuário entendeu corretamente — sempre cite ao
  menos 1 ponto específico da reexplicação dele, nunca um "está certo" genérico
- "confusion_points": lista de pontos confusos, incompletos ou incorretos
  (nunca deixe essa lista vazia se completeness_score < 90)`;
}

export const EVALUATOR_SCHEMA = {
  type: "object",
  properties: {
    completeness_score: {
      type: "integer",
      description: "Nota de completude da reexplicação, inteiro de 0 a 100.",
    },
    what_was_right: {
      type: "string",
      description:
        "O que o usuário entendeu corretamente, citando ao menos 1 ponto específico, em português do Brasil.",
    },
    confusion_points: {
      type: "array",
      items: { type: "string" },
      description:
        "Pontos confusos, incompletos ou incorretos da reexplicação, em português do Brasil. Nunca vazia se completeness_score < 90.",
    },
  },
  required: ["completeness_score", "what_was_right", "confusion_points"],
  additionalProperties: false,
} as const;
