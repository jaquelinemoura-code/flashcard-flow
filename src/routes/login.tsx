import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAuth, login } from "@/lib/flashcards-store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — Flashly" },
      { name: "description", content: "Acesse seus flashcards e estude com leveza." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const didRedirect = useRef(false);
  useEffect(() => {
    if (didRedirect.current) return;
    didRedirect.current = true;
    if (getAuth()) navigate({ to: "/" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    login(email.trim());
    navigate({ to: "/" });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl text-primary-foreground"
            style={{ background: "var(--gradient-mint)" }}
          >
            <Sparkles className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">Bem-vindo ao Flashly</h1>
          <p className="mt-1 text-sm text-muted-foreground">Entre para continuar seus estudos</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-5 rounded-3xl border border-border bg-card p-6 md:p-8"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="voce@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          <Button type="submit" className="h-11 w-full rounded-xl text-base">
            Entrar
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Sessão local — qualquer e-mail funciona neste demo.
          </p>
        </form>
      </div>
    </main>
  );
}