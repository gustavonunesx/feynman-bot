import OpenAI from "openai";
import { NextResponse } from "next/server";

import { MODEL, PROFESSOR_SCHEMA, buildProfessorPrompt } from "@/lib/prompts";

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Chave da API não configurada — defina OPENAI_API_KEY no .env.local." },
      { status: 500 }
    );
  }
  const client = new OpenAI();

  let topic: unknown;
  try {
    ({ topic } = await request.json());
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  if (typeof topic !== "string" || !topic.trim()) {
    return NextResponse.json(
      { error: "Informe o tópico que você quer aprender." },
      { status: 400 }
    );
  }

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 1024,
      response_format: {
        type: "json_schema",
        json_schema: { name: "professor_response", strict: true, schema: PROFESSOR_SCHEMA },
      },
      messages: [{ role: "user", content: buildProfessorPrompt(topic.trim()) }],
    });

    const content = response.choices[0]?.message?.content;
    if (!content || response.choices[0]?.finish_reason === "content_filter") {
      return NextResponse.json(
        { error: "O professor não conseguiu explicar esse tópico. Tente reformular." },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(content) as {
      explanation: string;
      analogy: string;
    };

    return NextResponse.json({
      explanation: parsed.explanation,
      analogy: parsed.analogy,
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
    return "O professor está sobrecarregado agora. Espere um pouco e tente de novo.";
  }
  if (error instanceof OpenAI.APIError || error instanceof SyntaxError) {
    return "Não foi possível gerar a explicação agora. Tente novamente em instantes.";
  }
  return "Não foi possível falar com a IA agora. Verifique sua conexão e tente de novo.";
}
