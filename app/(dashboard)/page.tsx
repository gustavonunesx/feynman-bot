import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  LayoutGrid,
  Plus,
  Sparkles,
} from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { listTopics } from "@/lib/supabase/queries";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { toLocalDateString } from "@/lib/sm2";
import type { TopicSummary } from "@/lib/topics";

// painel sempre fresco — a fila do dia muda a cada avaliação
export const dynamic = "force-dynamic";

function scoreColor(score: number) {
  if (score >= 71) return "text-primary";
  if (score >= 41) return "text-attention";
  return "text-destructive";
}

/** Dias de atraso entre duas datas `YYYY-MM-DD` (0 = vence hoje). */
function daysLate(nextReviewDate: string, today: string) {
  const parse = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day).getTime();
  };
  return Math.round((parse(today) - parse(nextReviewDate)) / 86_400_000);
}

const longDate = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export default async function ReviewDashboard() {
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
        "Não foi possível carregar sua fila de revisão agora. Confira a conexão com o Supabase e recarregue a página.";
    }
  }

  const today = toLocalDateString(new Date());
  const due = topics
    .filter((t) => t.nextReviewDate !== null && t.nextReviewDate <= today)
    .sort((a, b) => a.nextReviewDate!.localeCompare(b.nextReviewDate!));
  // cadastrados mas nunca reexplicados — ainda fora da agenda SM-2
  const fresh = topics.filter(
    (t) => t.attemptCount === 0 && t.nextReviewDate === null
  );
  const allClear = !notice && due.length === 0;

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
          <p className="font-mono text-xs text-muted-foreground">
            {longDate.format(new Date())}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            Para revisar hoje
          </h1>
          <p className="mt-2 max-w-md text-muted-foreground">
            {due.length === 0
              ? "A repetição espaçada decide o que aparece aqui — só o que vence na data."
              : due.length === 1
                ? "1 tópico chegou na data de revisão. Reexplique com as suas palavras."
                : `${due.length} tópicos chegaram na data de revisão. Reexplique com as suas palavras.`}
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

        {due.length > 0 && (
          <section className="mt-8 grid gap-3 sm:grid-cols-2">
            {due.map((topic, i) => {
              const late = daysLate(topic.nextReviewDate!, today);
              return (
                <Link
                  key={topic.id}
                  href={`/topics/${topic.id}`}
                  style={{ animationDelay: `${80 + i * 60}ms` }}
                  className="group animate-in fade-in slide-in-from-bottom-2 fill-mode-both rounded-2xl outline-none duration-400 focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <article className="flex h-full flex-col justify-between gap-6 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-foreground/10 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:ring-primary/40">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-base font-semibold leading-snug">
                        {topic.title}
                      </h2>
                      <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-primary group-hover:opacity-100" />
                    </div>
                    <div className="flex items-center justify-between gap-2 font-mono text-xs text-muted-foreground">
                      <span>
                        {topic.lastScore !== null && (
                          <>
                            {"última "}
                            <span
                              className={cn(
                                "font-medium",
                                scoreColor(topic.lastScore)
                              )}
                            >
                              {topic.lastScore}
                            </span>
                            {" · "}
                          </>
                        )}
                        {topic.attemptCount}{" "}
                        {topic.attemptCount === 1 ? "tentativa" : "tentativas"}
                      </span>
                      <span
                        className={cn(
                          late > 0 && "font-medium text-attention"
                        )}
                      >
                        {late === 0
                          ? "vence hoje"
                          : late === 1
                            ? "1 dia atrasado"
                            : `${late} dias atrasado`}
                      </span>
                    </div>
                  </article>
                </Link>
              );
            })}
          </section>
        )}

        {allClear && (
          <section className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both mt-14 flex flex-col items-center text-center duration-400 [animation-delay:80ms]">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/30">
              <CheckCircle2 className="size-6 text-primary" />
            </span>
            <h2 className="mt-4 text-xl font-semibold">Revisão em dia</h2>
            <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {topics.length === 0
                ? "Você ainda não tem tópicos. Cadastre um assunto difícil e deixe a agenda trabalhar por você."
                : "Nenhum tópico vence hoje. Volte amanhã — ou adiante um assunto novo."}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button asChild className="rounded-xl active:scale-[0.98]">
                <Link href="/topics/new">
                  <Plus data-icon="inline-start" />
                  {topics.length === 0
                    ? "Cadastrar meu primeiro tópico"
                    : "Novo tópico"}
                </Link>
              </Button>
              {topics.length > 0 && (
                <Button
                  asChild
                  variant="outline"
                  className="rounded-xl active:scale-[0.98]"
                >
                  <Link href="/topics">
                    <LayoutGrid data-icon="inline-start" />
                    Todos os tópicos
                  </Link>
                </Button>
              )}
            </div>
          </section>
        )}

        {fresh.length > 0 && (
          <section
            className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both mt-12 duration-400"
            style={{ animationDelay: `${140 + due.length * 60}ms` }}
          >
            <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Sparkles className="size-4 text-primary" />
              Nunca explicados
            </h2>
            <p className="mt-1 text-sm text-muted-foreground/80">
              Reexplique pela primeira vez pra esses tópicos entrarem na agenda
              de revisão.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {fresh.map((topic) => (
                <Link
                  key={topic.id}
                  href={`/topics/${topic.id}`}
                  className="group rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <article className="flex h-full items-center justify-between gap-3 rounded-2xl border border-dashed border-border bg-card/50 p-5 transition-colors duration-300 group-hover:border-primary/50">
                    <h3 className="text-base font-semibold leading-snug">
                      {topic.title}
                    </h3>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-primary" />
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}

        {!allClear && topics.length > 0 && (
          <p className="mt-12 text-center">
            <Link
              href="/topics"
              className="inline-flex items-center gap-1.5 rounded-xl font-mono text-xs text-muted-foreground underline-offset-4 outline-none transition-colors duration-300 hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              ver todos os tópicos
              <ArrowRight className="size-3.5" />
            </Link>
          </p>
        )}
      </main>
    </>
  );
}
