"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  History,
  Lightbulb,
  RotateCcw,
  Send,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  MIN_WORDS,
  countWords,
  type Evaluation,
  type TopicDetail,
} from "@/lib/topics";

type Phase = "writing" | "evaluating" | "short" | "evaluated" | "error";

function scoreBand(score: number) {
  if (score >= 71)
    return {
      label: "Mandou bem!",
      text: "text-primary",
      bar: "[&_[data-slot=progress-indicator]]:bg-primary",
    };
  if (score >= 41)
    return {
      label: "Quase lá",
      text: "text-attention",
      bar: "[&_[data-slot=progress-indicator]]:bg-attention",
    };
  return {
    label: "Precisa revisar",
    text: "text-destructive",
    bar: "[&_[data-slot=progress-indicator]]:bg-destructive",
  };
}

const attemptDate = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/** Nota sobe de 0 até o valor em ~400ms (regra: sem bounce, máx 400ms). */
function AnimatedScore({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 400;
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * value));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{display}</>;
}

export function TopicView({ topic }: { topic: TopicDetail }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("writing");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // histórico vem do servidor; a próxima tentativa é sempre a seguinte
  const attempt = topic.attempts.length + 1;

  useEffect(() => {
    if ((phase === "evaluated" || phase === "short" || phase === "error") && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [phase]);

  const words = countWords(text);
  const tooShort = words > 0 && words < MIN_WORDS;

  async function handleSubmit() {
    if (!text.trim() || phase === "evaluating") return;
    setFocusMode(false);

    // Aviso de resposta curta resolvido no client — não gasta chamada de IA
    if (countWords(text) < MIN_WORDS) {
      setPhase("short");
      return;
    }

    setPhase("evaluating");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId: topic.id, userText: text }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? "Não foi possível avaliar sua resposta agora.");
        setPhase("error");
        return;
      }

      setEvaluation(data as Evaluation);
      setPhase("evaluated");
      // tentativa já está salva — recarrega o histórico vindo do servidor
      router.refresh();
    } catch {
      setErrorMsg(
        "Não foi possível falar com a IA agora. Verifique sua conexão e tente de novo."
      );
      setPhase("error");
    }
  }

  function handleRetry() {
    setPhase("writing");
  }

  function handleFocus() {
    // full-screen só no mobile (PRD: campo vira tela cheia ao focar)
    if (window.matchMedia("(max-width: 767px)").matches) {
      setFocusMode(true);
    }
  }

  const writingPanel = (
    <div
      className={cn(
        "flex flex-col gap-3",
        focusMode &&
          "fixed inset-0 z-50 bg-background p-4 md:static md:z-auto md:bg-transparent md:p-0"
      )}
    >
      {focusMode && (
        <div className="flex items-center justify-between md:hidden">
          <span className="truncate text-sm font-semibold">{topic.title}</span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Sair da tela cheia"
            onClick={() => setFocusMode(false)}
          >
            <ChevronDown />
          </Button>
        </div>
      )}

      <div className={cn("flex flex-col gap-3", focusMode && "min-h-0 flex-1")}>
        <div className={cn(focusMode && "hidden md:block")}>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Sua vez — tentativa{" "}
            <span className="font-mono text-foreground">{attempt}</span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Reexplique com as suas palavras, sem olhar pro lado. Lacunas que
            aparecerem aqui são exatamente o que você ainda não domina.
          </p>
        </div>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={handleFocus}
          disabled={phase === "evaluating"}
          placeholder="Comece com “É basicamente…” e vá até o fim sem consultar nada."
          aria-label="Sua reexplicação"
          className={cn(
            "rounded-xl bg-card text-base leading-relaxed",
            focusMode ? "min-h-0 flex-1 resize-none" : "min-h-56 md:min-h-72"
          )}
        />

        <div className="flex items-center justify-between gap-3">
          <span
            className={cn(
              "font-mono text-xs",
              tooShort ? "text-attention" : "text-muted-foreground"
            )}
          >
            {words} {words === 1 ? "palavra" : "palavras"}
            {tooShort && ` · mínimo ${MIN_WORDS} pra avaliar`}
          </span>
          <Button
            onClick={handleSubmit}
            disabled={!text.trim() || phase === "evaluating"}
            size="lg"
            className="rounded-xl px-6 font-semibold transition-all active:scale-[0.98]"
          >
            {phase === "evaluating" ? (
              "Avaliando…"
            ) : (
              <>
                <Send data-icon="inline-start" />
                Enviar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  const evaluatingPanel = (
    <div
      className="flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-sm ring-1 ring-foreground/10"
      role="status"
      aria-label="Avaliando sua reexplicação"
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="size-4 animate-pulse text-primary" />
        O avaliador está lendo sua explicação…
      </div>
      <div className="space-y-2.5">
        <div className="h-3 w-2/3 animate-pulse rounded-full bg-muted" />
        <div className="h-3 w-full animate-pulse rounded-full bg-muted [animation-delay:150ms]" />
        <div className="h-3 w-4/5 animate-pulse rounded-full bg-muted [animation-delay:300ms]" />
      </div>
    </div>
  );

  const shortPanel = (
    <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-sm ring-1 ring-attention/40 duration-400">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-attention" />
        <div>
          <h3 className="font-semibold">Resposta curta demais</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Sua reexplicação tem só{" "}
            <span className="font-mono text-attention">{words}</span>{" "}
            {words === 1 ? "palavra" : "palavras"} — com menos de {MIN_WORDS} a
            IA não consegue avaliar de verdade. Desenvolva mais: como você
            explicaria isso pra alguém que nunca ouviu falar do assunto?
          </p>
        </div>
      </div>
      <Button
        variant="secondary"
        className="self-start rounded-xl"
        onClick={() => setPhase("writing")}
      >
        Continuar escrevendo
      </Button>
    </div>
  );

  const errorPanel = (
    <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-sm ring-1 ring-destructive/40 duration-400">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
        <div>
          <h3 className="font-semibold">Não deu pra avaliar agora</h3>
          <p className="mt-1 text-sm text-muted-foreground">{errorMsg}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          className="rounded-xl active:scale-[0.98]"
          onClick={handleSubmit}
        >
          <RotateCcw data-icon="inline-start" />
          Tentar de novo
        </Button>
        <Button
          variant="secondary"
          className="rounded-xl"
          onClick={() => setPhase("writing")}
        >
          Voltar ao texto
        </Button>
      </div>
    </div>
  );

  const evaluatedPanel = evaluation && (
    <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-6 rounded-2xl bg-card p-6 shadow-sm ring-1 ring-foreground/10 duration-400">
      <div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Nota de completude
            </p>
            <p
              className={cn(
                "font-mono text-5xl font-medium leading-none tracking-tight",
                scoreBand(evaluation.completenessScore).text
              )}
            >
              <AnimatedScore value={evaluation.completenessScore} />
              <span className="text-lg text-muted-foreground">/100</span>
            </p>
          </div>
          <span
            className={cn(
              "text-sm font-semibold",
              scoreBand(evaluation.completenessScore).text
            )}
          >
            {scoreBand(evaluation.completenessScore).label}
          </span>
        </div>
        <Progress
          value={evaluation.completenessScore}
          className={cn("mt-4 h-1.5", scoreBand(evaluation.completenessScore).bar)}
        />
      </div>

      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-primary">
          <CheckCircle2 className="size-4" />O que você acertou
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-foreground/90">
          {evaluation.whatWasRight}
        </p>
      </div>

      {evaluation.confusionPoints.length > 0 && (
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-attention">
            <AlertTriangle className="size-4" />
            Pontos confusos ou incompletos
          </h3>
          <ul className="mt-2 space-y-2">
            {evaluation.confusionPoints.map((point, i) => (
              <li
                key={i}
                style={{ animationDelay: `${150 + i * 100}ms` }}
                className="animate-in fade-in slide-in-from-bottom-1 fill-mode-both rounded-xl bg-attention/10 px-3.5 py-2.5 text-sm leading-relaxed text-foreground/90 duration-300"
              >
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={handleRetry}
          variant="secondary"
          className="rounded-xl active:scale-[0.98]"
        >
          <RotateCcw data-icon="inline-start" />
          Tentar de novo
        </Button>
        <Button asChild variant="ghost" className="rounded-xl">
          <Link href="/">Concluir por hoje</Link>
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <div className="mt-8 grid items-start gap-6 md:grid-cols-2 md:gap-8">
        {/* Explicação do professor */}
        <section className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-sm ring-1 ring-foreground/10 delay-100 duration-400">
          <Badge
            variant="outline"
            className="w-fit gap-1.5 rounded-xl border-primary/30 text-primary"
          >
            <Sparkles className="size-3" />
            Professor IA
          </Badge>
          <p className="text-[15px] leading-relaxed text-foreground/90">
            {topic.explanation}
          </p>
          <div className="rounded-xl bg-primary/8 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Lightbulb className="size-4" />
              Analogia
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground/85">
              {topic.analogy}
            </p>
          </div>
        </section>

        {/* Reexplicação / avaliação */}
        <section
          ref={resultRef}
          className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both scroll-mt-20 delay-200 duration-400"
        >
          {phase === "writing" && writingPanel}
          {phase === "evaluating" && evaluatingPanel}
          {phase === "short" && shortPanel}
          {phase === "error" && errorPanel}
          {phase === "evaluated" && evaluatedPanel}
        </section>
      </div>

      {/* Histórico de tentativas (persistido no Supabase) */}
      {topic.attempts.length > 0 && (
        <section className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both mt-12 delay-300 duration-400">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <History className="size-4" />
            Histórico de tentativas
          </h2>
          <ol className="mt-3 flex flex-col gap-2">
            {topic.attempts.map((a, i) => (
              <li
                key={a.id}
                className="rounded-xl bg-card px-4 py-3 shadow-sm ring-1 ring-foreground/10"
              >
                <div className="flex items-center justify-between gap-3 font-mono text-xs text-muted-foreground">
                  <span suppressHydrationWarning>
                    tentativa {topic.attempts.length - i} ·{" "}
                    {attemptDate.format(new Date(a.createdAt))}
                  </span>
                  {a.evaluation ? (
                    <span
                      className={cn(
                        "text-sm font-medium",
                        scoreBand(a.evaluation.completenessScore).text
                      )}
                    >
                      {a.evaluation.completenessScore}
                      <span className="text-xs text-muted-foreground">/100</span>
                    </span>
                  ) : (
                    <span>sem avaliação</span>
                  )}
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-foreground/80">
                  {a.userText}
                </p>
              </li>
            ))}
          </ol>
        </section>
      )}
    </>
  );
}
