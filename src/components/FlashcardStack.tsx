import { useMemo, useState } from "react";
import { Eye, RotateCcw, Trash2, Check, Minus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteCard, recordResult, type Flashcard } from "@/lib/flashcards-store";

interface Props {
  cards: Flashcard[];
}

// Deterministic shuffle from a numeric seed (mulberry32) — pure, no state needed.
function shuffleWithSeed<T>(arr: T[], seed: number): T[] {
  const a = arr.slice();
  let t = seed >>> 0;
  const rand = () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function FlashcardStack({ cards }: Props) {
  // shuffleSeed = 0 means "no shuffle / use natural order".
  const [shuffleSeed, setShuffleSeed] = useState(0);
  // currentId tracks which card is on top. If null, fall back to first card of the derived stack.
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  // Derived stack — purely from inputs + shuffleSeed. No state syncing.
  const stack = useMemo(() => {
    if (shuffleSeed === 0) return cards;
    return shuffleWithSeed(cards, shuffleSeed);
  }, [cards, shuffleSeed]);

  // Derive the current index from currentId. Reset to 0 if the id is no longer present.
  const index = useMemo(() => {
    if (currentId == null) return 0;
    const i = stack.findIndex((c) => c.id === currentId);
    return i === -1 ? 0 : i;
  }, [stack, currentId]);

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
    // New random seed → triggers re-derivation of `stack`.
    setShuffleSeed(Math.max(1, (Math.random() * 0xffffffff) | 0));
    setCurrentId(null);
    setRevealed(false);
  };

  const advance = () => {
    setRevealed(false);
    const nextIndex = index + 1 < stack.length ? index + 1 : 0;
    setCurrentId(stack[nextIndex]?.id ?? null);
  };

  const handleResult = (r: "right" | "partial" | "wrong") => {
    recordResult(current.id, r);
    advance();
  };

  const handleDelete = () => {
    if (confirm("Excluir este card?")) {
      // After delete, point to the next card (or wrap). Derivation will resolve naturally.
      const nextId = stack[index + 1]?.id ?? stack[0]?.id ?? null;
      setCurrentId(nextId === current.id ? null : nextId);
      setRevealed(false);
      deleteCard(current.id);
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
        {stack.slice(index, index + 4).reverse().map((c, i, arr) => {
          const depth = arr.length - 1 - i;
          const isTop = depth === 0;
          const shadow = isTop
            ? "0 20px 40px -20px color-mix(in oklab, var(--primary) 25%, transparent), 0 8px 16px -8px rgb(0 0 0 / 0.08)"
            : `0 ${10 + depth * 4}px ${20 + depth * 6}px -12px rgb(0 0 0 / ${0.08 + depth * 0.02})`;
          return (
            <div
              key={c.id}
              className="absolute inset-x-0 mx-auto flex h-full w-full max-w-xl flex-col rounded-3xl border border-border bg-card p-6 transition-all md:p-8"
              style={{
                transform: `translateY(${depth * 14}px) scale(${1 - depth * 0.05})`,
                zIndex: 10 - depth,
                opacity: isTop ? 1 : 1 - depth * 0.18,
                boxShadow: shadow,
                pointerEvents: isTop ? "auto" : "none",
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
