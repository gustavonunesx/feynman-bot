"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Sparkles } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EXAMPLE_TOPIC_TITLES } from "@/lib/topics";

export default function NewTopicPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: trimmed }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Não foi possível gerar a explicação agora.");
        setLoading(false);
        return;
      }

      // rota /api/explain já salvou tópico + explicação no Supabase
      router.push(`/topics/${data.id}`);
    } catch {
      setError("Não foi possível falar com a IA agora. Verifique sua conexão e tente de novo.");
      setLoading(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="relative mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-12 sm:px-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,--alpha(var(--color-primary)/7%),transparent)]"
        />

        <div className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-400">
          <h1 className="text-3xl font-bold tracking-tight">
            O que você quer dominar?
          </h1>
          <p className="mt-2 text-muted-foreground">
            Digite qualquer assunto. O professor vai explicar de um jeito
            simples, com uma analogia do dia a dia — depois é a sua vez.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both mt-8 flex flex-col gap-3 delay-100 duration-400"
        >
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
            placeholder="Ex.: Recursão em programação"
            aria-label="Tópico que você quer estudar"
            className="h-12 rounded-xl px-4 text-base"
          />
          <Button
            type="submit"
            size="lg"
            disabled={!title.trim() || loading}
            className="h-12 rounded-xl text-base font-semibold transition-all active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" data-icon="inline-start" />
                Preparando sua explicação…
              </>
            ) : (
              <>
                <Sparkles data-icon="inline-start" />
                Gerar explicação
              </>
            )}
          </Button>

          {error && (
            <div
              role="alert"
              className="animate-in fade-in slide-in-from-bottom-1 flex items-start gap-2.5 rounded-xl bg-attention/10 px-3.5 py-2.5 text-sm leading-relaxed text-foreground/90 ring-1 ring-attention/40 duration-300"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-attention" />
              {error}
            </div>
          )}
        </form>

        <div className="animate-in fade-in fill-mode-both mt-8 delay-200 duration-400">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Ou comece por um exemplo
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLE_TOPIC_TITLES.map((example) => (
              <button
                key={example}
                type="button"
                disabled={loading}
                onClick={() => {
                  setTitle(example);
                }}
                className="rounded-xl bg-secondary px-3 py-1.5 text-sm text-secondary-foreground transition-colors duration-300 hover:bg-primary/15 hover:text-primary disabled:opacity-50"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
