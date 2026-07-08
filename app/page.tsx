"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { readSessionTopics, type Topic } from "@/lib/topics";

export default function Home() {
  const [topics, setTopics] = useState<Topic[]>([]);

  useEffect(() => {
    setTopics(readSessionTopics());
  }, []);

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
            Escolha um tópico pra reexplicar com as suas palavras — ou cadastre
            um assunto novo que você quer dominar.
          </p>
        </section>

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
                  <h2 className="text-base font-semibold leading-snug">
                    {topic.title}
                  </h2>
                  <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-primary group-hover:opacity-100" />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    histórico de tentativas entra no M3
                  </span>
                  <Badge
                    variant="outline"
                    className="rounded-xl font-mono text-[10px] uppercase tracking-wide text-muted-foreground"
                  >
                    sessão
                  </Badge>
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
          explicações e avaliações geradas por IA — tópicos vivem só nesta
          sessão até o M3
        </p>
      </main>
    </>
  );
}
