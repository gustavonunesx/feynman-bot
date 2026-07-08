import Link from "next/link";
import { AlertTriangle, ArrowRight, Plus } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { cn } from "@/lib/utils";
import { listTopics } from "@/lib/supabase/queries";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { toLocalDateString } from "@/lib/sm2";
import type { TopicSummary } from "@/lib/topics";

// lista sempre fresca — tentativas novas mudam contagem e última nota
export const dynamic = "force-dynamic";

function scoreColor(score: number) {
  if (score >= 71) return "text-primary";
  if (score >= 41) return "text-attention";
  return "text-destructive";
}

const shortDate = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});

/** `YYYY-MM-DD` local → data curta, sem cair no dia UTC. */
function formatReviewDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return shortDate.format(new Date(year, month - 1, day));
}

export default async function TopicsPage() {
  let topics: TopicSummary[] = [];
  let notice: string | null = null;

  if (!isSupabaseConfigured()) {
    notice =
      "Banco não configurado — defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local e aplique a migration de supabase/migrations.";
  } else {
    try {
      topics = await listTopics();
    } catch {
      notice =
        "Não foi possível carregar seus tópicos agora. Confira a conexão com o Supabase e recarregue a página.";
    }
  }

  const today = toLocalDateString(new Date());

  return (
    <>
      <SiteHeader />
      <main className="relative mx-auto w-full max-w-5xl flex-1 px-4 pt-10 pb-16 sm:px-6">
        {/* brilho sutil de fundo, sem competir com o conteúdo */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-14 h-64 bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,--alpha(var(--color-primary)/7%),transparent)]"
        />

        <section className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-400">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Seus tópicos
          </h1>
          <p className="mt-2 max-w-md text-muted-foreground">
            Tudo que você já estudou, com a próxima revisão de cada um. O que
            vence hoje aparece no{" "}
            <Link
              href="/"
              className="rounded-sm underline underline-offset-4 outline-none transition-colors duration-300 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              painel de revisão
            </Link>
            .
          </p>
        </section>

        {notice && (
          <div
            role="alert"
            className="animate-in fade-in slide-in-from-bottom-1 mt-8 flex items-start gap-2.5 rounded-xl bg-attention/10 px-3.5 py-2.5 text-sm leading-relaxed text-foreground/90 ring-1 ring-attention/40 duration-300"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-attention" />
            {notice}
          </div>
        )}

        <section className="mt-8 grid gap-3 sm:grid-cols-2">
          {topics.map((topic, i) => (
            <Link
              key={topic.id}
              href={`/topics/${topic.id}`}
              style={{ animationDelay: `${80 + i * 60}ms` }}
              className="group animate-in fade-in slide-in-from-bottom-2 fill-mode-both rounded-2xl outline-none duration-400 focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <article className="flex h-full flex-col justify-between gap-6 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-foreground/10 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:ring-primary/40">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="min-w-0 break-words text-base font-semibold leading-snug">
                    {topic.title}
                  </h2>
                  <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-primary group-hover:opacity-100" />
                </div>
                <div className="flex items-center justify-between gap-2 font-mono text-xs text-muted-foreground">
                  <span>
                    {topic.attemptCount === 0
                      ? "sem tentativas ainda"
                      : `${topic.attemptCount} ${
                          topic.attemptCount === 1 ? "tentativa" : "tentativas"
                        }`}
                    {topic.lastScore !== null && (
                      <>
                        {" · última "}
                        <span className={cn("font-medium", scoreColor(topic.lastScore))}>
                          {topic.lastScore}
                        </span>
                      </>
                    )}
                  </span>
                  {topic.nextReviewDate === null ? (
                    <span>{shortDate.format(new Date(topic.createdAt))}</span>
                  ) : topic.nextReviewDate <= today ? (
                    <span className="font-medium text-attention">
                      revisar hoje
                    </span>
                  ) : (
                    <span>
                      revisa {formatReviewDate(topic.nextReviewDate)}
                    </span>
                  )}
                </div>
              </article>
            </Link>
          ))}

          <Link
            href="/topics/new"
            style={{ animationDelay: `${80 + topics.length * 60}ms` }}
            className="group animate-in fade-in slide-in-from-bottom-2 fill-mode-both rounded-2xl outline-none duration-400 focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <article className="flex h-full min-h-32 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border p-5 text-muted-foreground transition-colors duration-300 group-hover:border-primary/50 group-hover:text-foreground">
              <Plus className="size-5 transition-colors duration-300 group-hover:text-primary" />
              <span className="text-sm font-medium">
                {topics.length === 0 ? "Cadastrar meu primeiro tópico" : "Novo tópico"}
              </span>
            </article>
          </Link>
        </section>

        <p className="mt-10 text-center font-mono text-xs text-muted-foreground/70">
          explicações e avaliações geradas por IA — todo o histórico fica salvo
        </p>
      </main>
    </>
  );
}
