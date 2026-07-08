import "server-only";

import { toLocalDateString } from "@/lib/sm2";
import { getSupabaseServer } from "./supabase/server";

/**
 * Limite diário de chamadas de IA por IP, guardado no Supabase
 * (rpc increment_rate_limit — incrementa e devolve o contador num round-trip
 * atômico). Falha do banco não deve travar a rota: em caso de erro,
 * permitimos a chamada (fail-open) e só logamos.
 */
export async function checkRateLimit(
  ip: string,
  route: string,
  limit: number
): Promise<{ allowed: boolean; remaining: number }> {
  const day = toLocalDateString(new Date());

  const { data, error } = await getSupabaseServer().rpc("increment_rate_limit", {
    p_ip: ip,
    p_route: route,
    p_day: day,
  });

  if (error) {
    console.error("Falha ao checar rate limit:", error);
    return { allowed: true, remaining: limit };
  }

  const count = data as number;
  return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return "local";
}
