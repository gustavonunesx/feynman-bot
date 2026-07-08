import { toLocalDateString } from "./sm2";

/**
 * Streak de constância (docs/PRD.md, seção 4): dias seguidos em que o usuário
 * fez ao menos 1 revisão ou cadastrou 1 tópico novo. Função pura, sem acesso
 * a banco — quem busca as datas de atividade é lib/supabase/queries.ts.
 */

/** Dia anterior a uma data local `YYYY-MM-DD`. */
function previousDay(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return toLocalDateString(new Date(year, month - 1, day - 1));
}

/**
 * Conta os dias consecutivos com atividade terminando hoje. Se hoje ainda não
 * teve atividade, a sequência que fechou ontem continua valendo — o streak só
 * quebra quando um dia inteiro passa em branco.
 */
export function computeStreak(
  activityDates: Iterable<string>,
  today: string
): number {
  const days = new Set(activityDates);

  let cursor = days.has(today) ? today : previousDay(today);
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = previousDay(cursor);
  }
  return streak;
}
