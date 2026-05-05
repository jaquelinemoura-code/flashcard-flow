import { useMemo, useState } from "react";
import { Eye, RotateCcw, Trash2, Check, Minus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteCard, recordResult, type Flashcard } from "@/lib/flashcards-store";

interface Props {
  cards: Flashcard[];
}

export function FlashcardStack({ cards }: Props) {
  const [order, setOrder] = useState<string[]>(() => cards.map((c) => c.id));
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  // Re-sync if cards list changes (filtering, add/delete)
  const signature = cards.map((c) => c.id).join("|");
  useMemo(() => {
    setOrder(cards.map((c) => c.id));
    setIndex(0);
    setRevealed(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const cardMap = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);
  const stack = order.map((id) => cardMap.get(id)).filter(Boolean) as Flashcard[];

  if (stack.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Nenhum card corresponde aos filtros atuais.
      </div>
    );
  }

  const current = stack[index];
  const remaining = stack.length - index;

  const shuffle = () => {
    const shuffled = [...order].sort(() => Math.random() - 0.5);
    setOrder(shuffled);
    setIndex(0);
    setRevealed(false);
  };

  const next = () => {
    setRevealed(false);
    setIndex((i) => (i + 1 < stack.length ? i + 1 : 0));
  };

  const handleResult = (r: "right" | "partial" | "wrong") => {
    recordResult(current.id, r);
    next();
  };

  const handleDelete = () => {
    if (confirm("Excluir este card?")) {
      deleteCard(current.id);
      next();
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {remaining} {remaining === 1 ? "card restante" : "cards restantes"}
        </p>
        <Button variant="outline" size="sm" className="rounded-full" onClick={shuffle}>
          <RotateCcw className="h-4 w-4" /> Embaralhar
        </Button>
      </div>

      <div className="relative h-[420px] md:h-[460px]">
        {stack.slice(index, index + 3).reverse().map((c, i, arr) => {
          const depth = arr.length - 1 - i;
          const isTop = depth === 0;
          return (
            <div
              key={c.id}
              className="absolute inset-x-0 mx-auto flex h-full w-full max-w-xl flex-col rounded-3xl border border-border bg-card p-6 transition-all md:p-8"
              style={{
                transform: `translateY(${depth * 12}px) scale(${1 - depth * 0.04})`,
                zIndex: 10 - depth,
                opacity: isTop ? 1 : 0.7,
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="rounded-full bg-[color:var(--primary-soft)] text-accent-foreground"
                  >
                    {c.tag}
                  </Badge>
                  <Badge variant="outline" className="rounded-full">
                    Nível {c.level}
                  </Badge>
                </div>
                {isTop && (
                  <Button variant="ghost" size="icon" className="rounded-full" onClick={handleDelete} aria-label="Excluir">
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>

              <div className="mt-6 flex flex-1 flex-col">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Pergunta</p>
                <h3 className="mt-2 text-xl font-semibold leading-snug text-foreground md:text-2xl">
                  {c.question}
                </h3>

                {isTop && revealed && (
                  <div className="mt-6 border-t border-border pt-5">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Resposta</p>
                    <p className="mt-2 text-base leading-relaxed text-foreground/90">{c.answer}</p>
                  </div>
                )}
              </div>

              {isTop && !revealed && (
                <Button
                  className="mt-6 h-12 w-full rounded-2xl text-base"
                  onClick={() => setRevealed(true)}
                >
                  <Eye className="h-4 w-4" /> Ver resposta
                </Button>
              )}

              {isTop && revealed && (
                <div className="mt-6 grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    className="h-12 rounded-2xl border-[color:var(--destructive)]/30 text-[color:var(--destructive)] hover:bg-[color:var(--destructive)]/10"
                    onClick={() => handleResult("wrong")}
                  >
                    <X className="h-4 w-4" /> Errei
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 rounded-2xl border-[color:var(--warning)]/40 text-[color:var(--warning)] hover:bg-[color:var(--warning)]/10"
                    onClick={() => handleResult("partial")}
                  >
                    <Minus className="h-4 w-4" /> Parcial
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 rounded-2xl border-[color:var(--success)]/40 text-[color:var(--success)] hover:bg-[color:var(--success)]/10"
                    onClick={() => handleResult("right")}
                  >
                    <Check className="h-4 w-4" /> Acertei
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}