"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MOCK_TOPICS, createSessionTopic } from "@/lib/mock-data";

export default function NewTopicPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || loading) return;

    setLoading(true);

    // Simula a latência da chamada à IA (vira /api/explain no M2)
    setTimeout(() => {
      const known = MOCK_TOPICS.find(
        (t) => t.title.toLowerCase() === trimmed.toLowerCase()
      );
      const topic = known ?? createSessionTopic(trimmed);
      router.push(`/topics/${topic.id}`);
    }, 1400);
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
        </form>

        <div className="animate-in fade-in fill-mode-both mt-8 delay-200 duration-400">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Ou comece por um exemplo
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {MOCK_TOPICS.map((topic) => (
              <button
                key={topic.id}
                type="button"
                disabled={loading}
                onClick={() => {
                  setTitle(topic.title);
                }}
                className="rounded-xl bg-secondary px-3 py-1.5 text-sm text-secondary-foreground transition-colors duration-300 hover:bg-primary/15 hover:text-primary disabled:opacity-50"
              >
                {topic.title}
              </button>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
