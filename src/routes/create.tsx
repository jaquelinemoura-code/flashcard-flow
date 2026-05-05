import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppHeader } from "@/components/AppHeader";
import { addCard, ALL_TAGS, getAuth, type Level, type Tag } from "@/lib/flashcards-store";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Novo flashcard — Flashly" },
      { name: "description", content: "Crie um novo flashcard com tag e nível." },
    ],
  }),
  component: CreatePage,
});

function CreatePage() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [tag, setTag] = useState<Tag>("Gramática");
  const [level, setLevel] = useState<Level>(1);

  useEffect(() => {
    if (!getAuth()) navigate({ to: "/login" });
  }, [navigate]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;
    addCard({ question: question.trim(), answer: answer.trim(), tag, level });
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-6 md:px-6 md:py-10">
        <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Criar flashcard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Capture uma pergunta e sua resposta para revisar depois.</p>

        <form
          onSubmit={onSubmit}
          className="mt-6 space-y-5 rounded-3xl border border-border bg-card p-5 md:p-7"
          style={{ boxShadow: "var(--shadow-soft)" }}
        >
          <div className="space-y-2">
            <Label htmlFor="q">Título / Pergunta</Label>
            <Input
              id="q"
              placeholder="Ex: O que é uma metáfora?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="a">Descrição / Resposta</Label>
            <Textarea
              id="a"
              rows={5}
              placeholder="Escreva a resposta detalhada..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              required
              className="rounded-xl"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tag / Assunto</Label>
              <Select value={tag} onValueChange={(v) => setTag(v as Tag)}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_TAGS.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nível</Label>
              <Select value={String(level)} onValueChange={(v) => setLevel(Number(v) as Level)}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Nível 1 — Iniciante</SelectItem>
                  <SelectItem value="2">Nível 2 — Intermediário</SelectItem>
                  <SelectItem value="3">Nível 3 — Avançado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Link to="/">
              <Button type="button" variant="ghost" className="rounded-xl">Cancelar</Button>
            </Link>
            <Button type="submit" className="rounded-xl">Salvar card</Button>
          </div>
        </form>
      </main>
    </div>
  );
}