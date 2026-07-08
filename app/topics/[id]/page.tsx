import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { getTopicDetail } from "@/lib/supabase/queries";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type { TopicDetail } from "@/lib/topics";
import { TopicView } from "./topic-view";

// histórico de tentativas muda a cada avaliação — nada de cache
export const dynamic = "force-dynamic";

function FallbackPage({ title, message }: { title: string; message: string }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-12 text-center">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{message}</p>
        <Button asChild variant="secondary" className="rounded-xl">
          <Link href="/topics">
            <ArrowLeft data-icon="inline-start" />
            Voltar aos tópicos
          </Link>
        </Button>
      </main>
    </>
  );
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <FallbackPage
        title="Banco não configurado"
        message="Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local e aplique a migration de supabase/migrations."
      />
    );
  }

  let topic: TopicDetail | null;
  try {
    topic = await getTopicDetail(id);
  } catch {
    return (
      <FallbackPage
        title="Não deu pra carregar o tópico"
        message="Falha ao falar com o banco agora. Confira a conexão com o Supabase e recarregue a página."
      />
    );
  }

  if (!topic) {
    return (
      <FallbackPage
        title="Tópico não encontrado"
        message="Esse tópico não existe ou foi removido. Volte pra lista e escolha (ou cadastre) outro."
      />
    );
  }

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
            href="/topics"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-300 hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Tópicos
          </Link>
          <h1 className="mt-2 break-words text-2xl font-bold tracking-tight sm:text-3xl">
            {topic.title}
          </h1>
        </div>

        <TopicView topic={topic} />
      </main>
    </>
  );
}
