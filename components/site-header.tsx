import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl text-sm font-bold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <span
            aria-hidden
            className="size-2 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]"
          />
          Feynman Bot
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className="rounded-xl px-2.5 py-1.5 text-sm font-medium text-muted-foreground outline-none transition-colors duration-300 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            Hoje
          </Link>
          <Link
            href="/topics"
            className="rounded-xl px-2.5 py-1.5 text-sm font-medium text-muted-foreground outline-none transition-colors duration-300 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            Tópicos
          </Link>
          <Button asChild size="sm" className="rounded-xl active:scale-[0.98]">
            <Link href="/topics/new">
              <Plus data-icon="inline-start" />
              Novo tópico
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
