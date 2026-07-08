import OpenAI from "openai";
import { NextResponse } from "next/server";

import { MODEL, EVALUATOR_SCHEMA, buildEvaluatorPrompt } from "@/lib/prompts";
import { MIN_WORDS, countWords } from "@/lib/topics";

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Chave da API não configurada — defina OPENAI_API_KEY no .env.local." },
      { status: 500 }
    );
  }
  const client = new OpenAI();

  let body: { topic?: unknown; aiExplanation?: unknown; userText?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const { topic, aiExplanation, userText } = body;
  if (
    typeof topic !== "string" ||
    typeof aiExplanation !== "string" ||
    typeof userText !== "string" ||
    !topic.trim() ||
    !aiExplanation.trim() ||
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
          content: buildEvaluatorPrompt(topic.trim(), aiExplanation, userText),
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

    return NextResponse.json({
      completenessScore: score,
      whatWasRight: parsed.what_was_right,
      confusionPoints,
    });
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
