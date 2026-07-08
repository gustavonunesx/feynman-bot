/**
 * Algoritmo SM-2 de repetição espaçada (docs/PRD.md, "Regras de negócio
 * críticas"). Funções puras, sem acesso a banco — quem persiste é
 * lib/supabase/queries.ts.
 */

export type Sm2Quality = 0 | 1 | 2 | 3 | 4 | 5;

export interface Sm2State {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
}

export interface Sm2Result extends Sm2State {
  /** Data da próxima revisão, `YYYY-MM-DD` (coluna `date` no Postgres). */
  nextReviewDate: string;
}

/** Estado de um tópico que nunca foi revisado (defaults do schema). */
export const INITIAL_SM2_STATE: Sm2State = {
  easeFactor: 2.5,
  intervalDays: 1,
  repetitions: 0,
};

export const MIN_EASE_FACTOR = 1.3;

/**
 * Converte a nota de completude (0–100) do Avaliador em qualidade SM-2 (0–5).
 * Faixas do PRD: 0–40 → 0–2, 41–70 → 3, 71–100 → 4–5.
 */
export function scoreToQuality(score: number): Sm2Quality {
  const clamped = Math.max(0, Math.min(100, score));
  if (clamped <= 13) return 0;
  if (clamped <= 27) return 1;
  if (clamped <= 40) return 2;
  if (clamped <= 70) return 3;
  if (clamped <= 85) return 4;
  return 5;
}

/**
 * Uma iteração do SM-2 após uma revisão.
 * - qualidade < 3: reinicia (revisa amanhã); ease factor não muda, como no
 *   SM-2 original.
 * - qualidade >= 3: ajusta ease factor (piso 1.3), então 1ª repetição = 1 dia,
 *   2ª = 6 dias, seguintes = intervalo anterior × ease factor.
 */
export function sm2(
  state: Sm2State,
  quality: Sm2Quality,
  today: Date = new Date()
): Sm2Result {
  let { easeFactor, intervalDays, repetitions } = state;

  if (quality < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    easeFactor = Math.max(
      MIN_EASE_FACTOR,
      round2(easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
    );
    repetitions += 1;
    if (repetitions === 1) {
      intervalDays = 1;
    } else if (repetitions === 2) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(state.intervalDays * easeFactor);
    }
  }

  return {
    easeFactor,
    intervalDays,
    repetitions,
    nextReviewDate: toLocalDateString(addDays(today, intervalDays)),
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Data local em `YYYY-MM-DD` — sem toISOString pra não vazar pro dia UTC. */
export function toLocalDateString(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}
