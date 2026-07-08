"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, KeyRound, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Não foi possível entrar agora.");
        setLoading(false);
        return;
      }

      router.push(searchParams.get("next") || "/");
      router.refresh();
    } catch {
      setError("Não foi possível falar com o servidor. Tente de novo.");
      setLoading(false);
    }
  }

  return (
    <main className="relative mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12 sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,--alpha(var(--color-primary)/7%),transparent)]"
      />

      <div className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-400">
        <div className="mb-4 flex items-center gap-2">
          <span
            aria-hidden
            className="size-2 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]"
          />
          <span className="text-sm font-bold tracking-tight">Feynman Bot</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Acesso restrito</h1>
        <p className="mt-2 text-muted-foreground">
          Digite a senha que você recebeu pra entrar.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both mt-8 flex flex-col gap-3 delay-100 duration-400"
      >
        <Input
          autoFocus
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          placeholder="Senha"
          aria-label="Senha de acesso"
          className="h-12 rounded-xl px-4 text-base"
        />
        <Button
          type="submit"
          size="lg"
          disabled={!password || loading}
          className="h-12 rounded-xl text-base font-semibold transition-all active:scale-[0.98]"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" data-icon="inline-start" />
              Entrando…
            </>
          ) : (
            <>
              <KeyRound data-icon="inline-start" />
              Entrar
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
    </main>
  );
}
