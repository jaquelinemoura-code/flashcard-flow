import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Filter } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { FlashcardStack } from "@/components/FlashcardStack";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ALL_TAGS,
  getAuth,
  seedDemoIfEmpty,
  useAuth,
  useCards,
  type Flashcard,
} from "@/lib/flashcards-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Flashly — Seus flashcards" },
      { name: "description", content: "Estude com flashcards organizados por tag, nível e desempenho." },
    ],
  }),
  component: Dashboard,
});

type LevelFilter = "all" | "1" | "2" | "3";
type TagFilter = "all" | (typeof ALL_TAGS)[number];
type PerfFilter = "all" | "wrong" | "partial" | "unseen";

function Dashboard() {
  const navigate = useNavigate();
  const auth = useAuth();
  const cards = useCards();

  const [level, setLevel] = useState<LevelFilter>("all");
  const [tag, setTag] = useState<TagFilter>("all");
  const [perf, setPerf] = useState<PerfFilter>("all");

  const didRedirect = useRef(false);
  useEffect(() => {
    if (didRedirect.current) return;
    didRedirect.current = true;
    if (!getAuth()) {
      navigate({ to: "/login" });
    } else {
      seedDemoIfEmpty();
    }
    // Run once on mount only — navigate is stable but we guard anyway.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    return cards.filter((c) => {
      if (level !== "all" && String(c.level) !== level) return false;
      if (tag !== "all" && c.tag !== tag) return false;
      if (perf === "wrong" && c.stats.wrong === 0) return false;
      if (perf === "partial" && c.stats.partial === 0) return false;
      if (perf === "unseen" && c.lastResult !== "unseen") return false;
      return true;
    });
  }, [cards, level, tag, perf]);

  if (!auth) return null;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10">
        <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Olá, {auth.email.split("@")[0]} 👋
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {cards.length === 0
                ? "Crie seu primeiro card para começar."
                : `${filtered.length} de ${cards.length} cards mostrando.`}
            </p>
          </div>
        </div>

        {cards.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Filtros */}
            <div
              className="mt-6 rounded-2xl border border-border bg-card p-3 md:p-4"
              style={{ boxShadow: "var(--shadow-soft)" }}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground md:pr-2">
                  <Filter className="h-4 w-4" /> Filtros
                </div>
                <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
                  <Select value={level} onValueChange={(v) => setLevel(v as LevelFilter)}>
                    <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Nível" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os níveis</SelectItem>
                      <SelectItem value="1">Nível 1</SelectItem>
                      <SelectItem value="2">Nível 2</SelectItem>
                      <SelectItem value="3">Nível 3</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={tag} onValueChange={(v) => setTag(v as TagFilter)}>
                    <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Assunto" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os assuntos</SelectItem>
                      {ALL_TAGS.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={perf} onValueChange={(v) => setPerf(v as PerfFilter)}>
                    <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Desempenho" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="wrong">Mais errei</SelectItem>
                      <SelectItem value="partial">Parciais</SelectItem>
                      <SelectItem value="unseen">Ainda não estudei</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(level !== "all" || tag !== "all" || perf !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full"
                    onClick={() => { setLevel("all"); setTag("all"); setPerf("all"); }}
                  >
                    Limpar
                  </Button>
                )}
              </div>
            </div>

            {/* Layout: stack + side panel (tablet/desktop) */}
            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
              <FlashcardStack cards={filtered} />
              <aside className="hidden lg:block">
                <CardsSidePanel cards={filtered} />
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function CardsSidePanel({ cards }: { cards: Flashcard[] }) {
  return (
    <div
      className="rounded-2xl border border-border bg-card p-4"
      style={{ boxShadow: "var(--shadow-soft)" }}
    >
      <h3 className="mb-3 text-sm font-semibold text-foreground">Todos os cards</h3>
      <div className="max-h-[460px] space-y-2 overflow-y-auto pr-1">
        {cards.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-border/60 bg-background p-3 transition-colors hover:border-primary/40"
          >
            <p className="line-clamp-2 text-sm font-medium text-foreground">{c.question}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary" className="rounded-full text-[10px]">{c.tag}</Badge>
              <Badge variant="outline" className="rounded-full text-[10px]">N{c.level}</Badge>
              {c.stats.wrong > 0 && (
                <span className="text-[10px] text-muted-foreground">✗ {c.stats.wrong}</span>
              )}
              {c.stats.right > 0 && (
                <span className="text-[10px] text-muted-foreground">✓ {c.stats.right}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
