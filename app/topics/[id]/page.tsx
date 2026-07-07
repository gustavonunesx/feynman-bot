"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Lightbulb,
  RotateCcw,
  Send,
  Sparkles,
} from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  MIN_WORDS,
  countWords,
  getAnyTopic,
  mockEvaluate,
  type MockEvaluation,
  type MockTopic,
} from "@/lib/mock-data";

type Phase = "writing" | "evaluating" | "short" | "evaluated";

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

export default function TopicPage() {
  const { id } = useParams<{ id: string }>();
  // undefined = ainda carregando (tópicos de sessão só existem no client)
  const [topic, setTopic] = useState<MockTopic | null | undefined>(undefined);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("writing");
  const [evaluation, setEvaluation] = useState<MockEvaluation | null>(null);
  const [attempt, setAttempt] = useState(1);
  const [focusMode, setFocusMode] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTopic(getAnyTopic(id) ?? null);
  }, [id]);

  useEffect(() => {
    if ((phase === "evaluated" || phase === "short") && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [phase]);

  if (topic === undefined) return <SiteHeader />;

  if (topic === null) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-12 text-center">
          <h1 className="text-2xl font-bold">Tópico não encontrado</h1>
          <p className="text-muted-foreground">
            Esse tópico não existe ou era de uma sessão anterior (os tópicos
            criados no M1 vivem só na sessão do navegador).
          </p>
          <Button asChild variant="secondary" className="rounded-xl">
            <Link href="/">
              <ArrowLeft data-icon="inline-start" />
              Voltar aos tópicos
            </Link>
          </Button>
        </main>
      </>
    );
  }

  const words = countWords(text);
  const tooShort = words > 0 && words < MIN_WORDS;

  function handleSubmit() {
    if (!text.trim() || phase === "evaluating") return;
    setFocusMode(false);
    setPhase("evaluating");

    // Simula a latência do avaliador IA (vira /api/evaluate no M2)
    const isShort = countWords(text) < MIN_WORDS;
    setTimeout(
      () => {
        if (isShort) {
          setPhase("short");
        } else {
          setEvaluation(mockEvaluate(topic!, text));
          setPhase("evaluated");
        }
      },
      isShort ? 800 : 1600
    );
  }

  function handleRetry() {
    setPhase("writing");
    setAttempt((a) => a + 1);
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
      <SiteHeader />
      <main className="relative mx-auto w-full max-w-5xl flex-1 px-4 pt-8 pb-16 sm:px-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-14 h-56 bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,--alpha(var(--color-primary)/6%),transparent)]"
        />

        <div className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-400">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-300 hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Tópicos
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            {topic.title}
          </h1>
        </div>

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
            {phase === "evaluated" && evaluatedPanel}
          </section>
        </div>
      </main>
    </>
  );
}
