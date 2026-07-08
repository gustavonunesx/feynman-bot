import "server-only";

import type {
  Attempt,
  Evaluation,
  TopicDetail,
  TopicSummary,
} from "@/lib/topics";
import { INITIAL_SM2_STATE, scoreToQuality, sm2 } from "@/lib/sm2";
import { getSupabaseServer } from "./server";

/**
 * Todo o acesso a dados do app passa por aqui (server-side). As funções
 * lançam Error em falha inesperada do banco — quem chama traduz pra UI.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface EvaluationRow {
  completeness_score: number;
  what_was_right: string | null;
  confusion_points: string[] | null;
  created_at: string;
}

interface AttemptRow {
  id: string;
  user_text: string;
  created_at: string;
  evaluations: EvaluationRow[];
}

const byNewest = (a: { created_at: string }, b: { created_at: string }) =>
  b.created_at.localeCompare(a.created_at);

function toEvaluation(row: EvaluationRow | undefined): Evaluation | null {
  if (!row) return null;
  return {
    completenessScore: row.completeness_score,
    whatWasRight: row.what_was_right ?? "",
    confusionPoints: row.confusion_points ?? [],
  };
}

function toAttempt(row: AttemptRow): Attempt {
  return {
    id: row.id,
    userText: row.user_text,
    createdAt: row.created_at,
    evaluation: toEvaluation([...row.evaluations].sort(byNewest)[0]),
  };
}

/** Tópicos mais recentes primeiro, com contagem de tentativas e última nota. */
export async function listTopics(): Promise<TopicSummary[]> {
  const { data, error } = await getSupabaseServer()
    .from("topics")
    .select(
      "id, title, created_at, user_attempts(created_at, evaluations(completeness_score, created_at))"
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((topic) => {
    const attempts = [...topic.user_attempts].sort(byNewest);
    const lastEvaluation = attempts
      .flatMap((a) => a.evaluations)
      .sort(byNewest)[0];
    return {
      id: topic.id,
      title: topic.title,
      createdAt: topic.created_at,
      attemptCount: attempts.length,
      lastScore: lastEvaluation?.completeness_score ?? null,
    };
  });
}

/** Tópico + explicação + histórico de tentativas (mais recente primeiro). */
export async function getTopicDetail(id: string): Promise<TopicDetail | null> {
  if (!UUID_RE.test(id)) return null;

  const { data, error } = await getSupabaseServer()
    .from("topics")
    .select(
      `id, title, created_at,
       explanations(ai_explanation, ai_analogy, created_at),
       user_attempts(id, user_text, created_at,
         evaluations(completeness_score, what_was_right, confusion_points, created_at))`
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const explanation = [...data.explanations].sort(byNewest)[0];
  if (!explanation) return null; // tópico órfão (insert da explicação falhou)

  return {
    id: data.id,
    title: data.title,
    createdAt: data.created_at,
    explanation: explanation.ai_explanation,
    analogy: explanation.ai_analogy,
    attempts: (data.user_attempts as AttemptRow[])
      .sort(byNewest)
      .map(toAttempt),
  };
}

/** Cria tópico + explicação; desfaz o tópico se a explicação falhar. */
export async function createTopic(input: {
  title: string;
  explanation: string;
  analogy: string;
}): Promise<string> {
  const supabase = getSupabaseServer();

  const { data: topic, error: topicError } = await supabase
    .from("topics")
    .insert({ title: input.title })
    .select("id")
    .single();

  if (topicError) throw new Error(topicError.message);

  const { error: explanationError } = await supabase.from("explanations").insert({
    topic_id: topic.id,
    ai_explanation: input.explanation,
    ai_analogy: input.analogy,
  });

  if (explanationError) {
    await supabase.from("topics").delete().eq("id", topic.id);
    throw new Error(explanationError.message);
  }

  return topic.id;
}

/** Contexto que o Avaliador precisa — direto do banco, não do client. */
export async function getTopicForEvaluation(
  id: string
): Promise<{ title: string; explanation: string; analogy: string } | null> {
  if (!UUID_RE.test(id)) return null;

  const { data, error } = await getSupabaseServer()
    .from("topics")
    .select("title, explanations(ai_explanation, ai_analogy, created_at)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  const explanation = data && [...data.explanations].sort(byNewest)[0];
  if (!explanation) return null;

  return {
    title: data.title,
    explanation: explanation.ai_explanation,
    analogy: explanation.ai_analogy,
  };
}

/** Salva tentativa + avaliação depois que o Avaliador respondeu. */
export async function saveAttempt(
  topicId: string,
  userText: string,
  evaluation: Evaluation
): Promise<void> {
  const supabase = getSupabaseServer();

  const { data: attempt, error: attemptError } = await supabase
    .from("user_attempts")
    .insert({ topic_id: topicId, user_text: userText })
    .select("id")
    .single();

  if (attemptError) throw new Error(attemptError.message);

  const { error: evaluationError } = await supabase.from("evaluations").insert({
    attempt_id: attempt.id,
    completeness_score: evaluation.completenessScore,
    what_was_right: evaluation.whatWasRight,
    confusion_points: evaluation.confusionPoints,
  });

  if (evaluationError) throw new Error(evaluationError.message);
}

/**
 * Aplica uma iteração do SM-2 ao tópico depois de uma avaliação e grava a
 * agenda (upsert — a linha nasce na primeira avaliação). Retorna a data da
 * próxima revisão (`YYYY-MM-DD`).
 */
export async function applyReviewSchedule(
  topicId: string,
  completenessScore: number
): Promise<string> {
  const supabase = getSupabaseServer();

  const { data: current, error: readError } = await supabase
    .from("review_schedule")
    .select("ease_factor, interval_days, repetitions")
    .eq("topic_id", topicId)
    .maybeSingle();

  if (readError) throw new Error(readError.message);

  const state = current
    ? {
        // numeric do Postgres chega como string no supabase-js
        easeFactor: Number(current.ease_factor),
        intervalDays: current.interval_days,
        repetitions: current.repetitions,
      }
    : INITIAL_SM2_STATE;

  const next = sm2(state, scoreToQuality(completenessScore));

  const { error: writeError } = await supabase.from("review_schedule").upsert(
    {
      topic_id: topicId,
      ease_factor: next.easeFactor,
      interval_days: next.intervalDays,
      repetitions: next.repetitions,
      next_review_date: next.nextReviewDate,
      last_reviewed_at: new Date().toISOString(),
    },
    { onConflict: "topic_id" }
  );

  if (writeError) throw new Error(writeError.message);

  return next.nextReviewDate;
}
