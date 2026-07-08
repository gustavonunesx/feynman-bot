import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Client server-side com a service role key (ignora RLS). As tabelas têm
 * RLS ligado sem policies, então este é o ÚNICO caminho de acesso ao
 * banco — nunca importar em client component (o `server-only` garante).
 */

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export const SUPABASE_MISSING_MESSAGE =
  "Banco não configurado — defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local.";

let client: SupabaseClient | null = null;

export function getSupabaseServer(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(SUPABASE_MISSING_MESSAGE);
  }
  client ??= createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    // sem sessão de usuário: chamadas server-to-server apenas
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  return client;
}
