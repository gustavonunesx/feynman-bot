import OpenAI from "openai";
import { NextResponse } from "next/server";

import { MODEL, EVALUATOR_SCHEMA, buildEvaluatorPrompt } from "@/lib/prompts";
import { MIN_WORDS, countWords } from "@/lib/topics";
import {
  applyReviewSchedule,
  getTopicForEvaluation,
  saveAttempt,
} from "@/lib/supabase/queries";
import { SUPABASE_MISSING_MESSAGE, isSupabaseConfigured } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Chave da API não configurada — defina OPENAI_API_KEY no .env.local." },
      { status: 500 }
    );
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: SUPABASE_MISSING_MESSAGE }, { status: 500 });
  }
  const client = new OpenAI();

  let body: { topicId?: unknown; userText?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const { topicId, userText } = body;
  if (
    typeof topicId !== "string" ||
    typeof userText !== "string" ||
    !topicId.trim() ||
    !userText.trim()
  ) {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  if (countWords(userText) < MIN_WORDS) {
    return NextResponse.json(
      {
        error: `Sua reexplicação precisa de pelo menos ${MIN_WORDS} palavras pra ser avaliada de verdade.`,
      },
      { status: 400 }
    );
  }

  // O conceito correto vem do banco, não do client — evita avaliar
  // contra uma explicação adulterada ou de outro tópico.
  let topic: Awaited<ReturnType<typeof getTopicForEvaluation>>;
  try {
    topic = await getTopicForEvaluation(topicId);
  } catch {
    return NextResponse.json(
      { error: "Não foi possível carregar o tópico agora. Tente de novo." },
      { status: 502 }
    );
  }
  if (!topic) {
    return NextResponse.json({ error: "Tópico não encontrado." }, { status: 404 });
  }

  const aiExplanation = `${topic.explanation}\n\nAnalogia: ${topic.analogy}`;

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 1024,
      response_format: {
        type: "json_schema",
        json_schema: { name: "evaluator_response", strict: true, schema: EVALUATOR_SCHEMA },
      },
      messages: [
        {
          role: "user",
          content: buildEvaluatorPrompt(topic.title, aiExplanation, userText),
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content || response.choices[0]?.finish_reason === "content_filter") {
      return NextResponse.json(
        { error: "O avaliador não conseguiu analisar sua resposta. Tente de novo." },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(content) as {
      completeness_score: number;
      what_was_right: string;
      confusion_points: string[];
    };

    // O schema não expressa limites numéricos nem a regra condicional do PRD
    // (lista nunca vazia se score < 90) — garantimos as duas aqui.
    const score = Math.max(0, Math.min(100, Math.round(parsed.completeness_score)));
    const confusionPoints = parsed.confusion_points.filter(Boolean);
    if (score < 90 && confusionPoints.length === 0) {
      confusionPoints.push(
        "A explicação ainda tem espaço pra crescer: inclua um exemplo concreto seu pra mostrar domínio prático."
      );
    }

    const evaluation = {
      completenessScore: score,
      whatWasRight: parsed.what_was_right,
      confusionPoints,
    };

    try {
      await saveAttempt(topicId, userText, evaluation);
    } catch {
      return NextResponse.json(
        { error: "Sua resposta foi avaliada, mas não deu pra salvar no histórico. Tente de novo." },
        { status: 502 }
      );
    }

    // A tentativa já está salva — se a agenda falhar, não derruba a resposta
    // (o próximo SM-2 recalcula a partir do estado que existir no banco).
    let nextReviewDate: string | null = null;
    try {
      nextReviewDate = await applyReviewSchedule(topicId, evaluation.completenessScore);
    } catch (scheduleError) {
      console.error("Falha ao atualizar review_schedule:", scheduleError);
    }

    return NextResponse.json({ ...evaluation, nextReviewDate });
  } catch (error) {
    return NextResponse.json(
      { error: apiErrorMessage(error) },
      { status: 502 }
    );
  }
}

function apiErrorMessage(error: unknown): string {
  if (error instanceof OpenAI.AuthenticationError) {
    return "Chave da API não configurada — defina OPENAI_API_KEY no .env.local.";
  }
  if (error instanceof OpenAI.RateLimitError) {
    return "O avaliador está sobrecarregado agora. Espere um pouco e tente de novo.";
  }
  if (error instanceof OpenAI.APIError || error instanceof SyntaxError) {
    return "Não foi possível avaliar sua resposta agora. Tente novamente em instantes.";
  }
  return "Não foi possível falar com a IA agora. Verifique sua conexão e tente de novo.";
}
