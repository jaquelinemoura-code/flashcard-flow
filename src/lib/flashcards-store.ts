import { useEffect, useState, useSyncExternalStore } from "react";

export type Tag = "Gramática" | "Literatura" | "Redação" | "Interpretação" | "Outros";
export type Level = 1 | 2 | 3;
export type Performance = "unseen" | "wrong" | "partial" | "right";

export const ALL_TAGS: Tag[] = ["Gramática", "Literatura", "Redação", "Interpretação", "Outros"];

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  tag: Tag;
  level: Level;
  stats: { right: number; partial: number; wrong: number };
  lastResult: Performance;
  createdAt: number;
}

const CARDS_KEY = "fc:cards:v2";
const AUTH_KEY = "fc:auth:v1";

/* ---------- listeners ---------- */
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/* ---------- Cards: cached snapshot ----------
 * useSyncExternalStore requires getSnapshot() to return a STABLE reference
 * between renders unless the data actually changed. We cache the array and
 * only replace it inside setCards().
 */
const EMPTY_CARDS: Flashcard[] = [];
let cardsSnapshot: Flashcard[] | null = null;

function loadCardsFromStorage(): Flashcard[] {
  if (typeof window === "undefined") return EMPTY_CARDS;
  try {
    const raw = localStorage.getItem(CARDS_KEY);
    if (!raw) return EMPTY_CARDS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Flashcard[]) : EMPTY_CARDS;
  } catch {
    return EMPTY_CARDS;
  }
}

function getCardsSnapshot(): Flashcard[] {
  if (cardsSnapshot === null) {
    cardsSnapshot = loadCardsFromStorage();
  }
  return cardsSnapshot;
}

function getServerCardsSnapshot(): Flashcard[] {
  return EMPTY_CARDS;
}

function writeCards(next: Flashcard[]) {
  cardsSnapshot = next;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(CARDS_KEY, JSON.stringify(next));
    } catch {
      // ignore quota errors
    }
  }
  emit();
}

/* ---------- Auth ---------- */
type Auth = { email: string } | null;
let authSnapshot: Auth | undefined;

function loadAuthFromStorage(): Auth {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as Auth) : null;
  } catch {
    return null;
  }
}

export function getAuth(): Auth {
  if (authSnapshot === undefined) {
    authSnapshot = loadAuthFromStorage();
  }
  return authSnapshot;
}

export function login(email: string) {
  authSnapshot = { email };
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_KEY, JSON.stringify(authSnapshot));
  }
  emit();
}

export function logout() {
  authSnapshot = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_KEY);
  }
  emit();
}

export function useAuth(): Auth {
  // Local state, updated only when listeners notify a real change.
  const [snap, setSnap] = useState<Auth>(() => getAuth());
  useEffect(() => {
    // Sync once on mount in case storage changed before subscribe.
    setSnap(getAuth());
    return subscribe(() => setSnap(getAuth()));
  }, []);
  return snap;
}

/* ---------- Cards hook ---------- */
export function useCards(): Flashcard[] {
  return useSyncExternalStore(subscribe, getCardsSnapshot, getServerCardsSnapshot);
}

/* ---------- Mutations ---------- */
export function addCard(input: Omit<Flashcard, "id" | "stats" | "lastResult" | "createdAt">) {
  const card: Flashcard = {
    ...input,
    id: crypto.randomUUID(),
    stats: { right: 0, partial: 0, wrong: 0 },
    lastResult: "unseen",
    createdAt: Date.now(),
  };
  writeCards([card, ...getCardsSnapshot()]);
}

export function deleteCard(id: string) {
  writeCards(getCardsSnapshot().filter((c) => c.id !== id));
}

export function recordResult(id: string, result: "right" | "partial" | "wrong") {
  writeCards(
    getCardsSnapshot().map((c) =>
      c.id === id
        ? {
            ...c,
            lastResult: result,
            stats: { ...c.stats, [result]: c.stats[result] + 1 },
          }
        : c,
    ),
  );
}

export function seedDemoIfEmpty() {
  if (getCardsSnapshot().length > 0) return;
  const now = Date.now();
  const mk = (
    i: number,
    question: string,
    answer: string,
    tag: Tag,
    level: Level,
    stats: { right: number; partial: number; wrong: number },
    lastResult: Performance,
  ): Flashcard => ({
    id: crypto.randomUUID(),
    question,
    answer,
    tag,
    level,
    stats,
    lastResult,
    createdAt: now - i * 1000,
  });
  const demos: Flashcard[] = [
    mk(0, "O que é uma oração subordinada substantiva?",
      "Oração que exerce função de substantivo (sujeito, objeto, etc.) em relação à oração principal.",
      "Gramática", 2, { right: 1, partial: 0, wrong: 0 }, "right"),
    mk(1, "Quais são as principais características do Romantismo brasileiro?",
      "Subjetivismo, sentimentalismo, nacionalismo, idealização da mulher e da natureza, fuga da realidade.",
      "Literatura", 3, { right: 0, partial: 1, wrong: 0 }, "partial"),
    mk(2, "Qual a diferença entre 'mas' e 'mais'?",
      "'Mas' é conjunção adversativa (porém). 'Mais' é advérbio de intensidade ou quantidade.",
      "Gramática", 1, { right: 2, partial: 0, wrong: 0 }, "right"),
    mk(3, "O que é uma metáfora?",
      "Figura de linguagem que faz comparação implícita entre dois elementos sem usar conectivo.",
      "Literatura", 1, { right: 0, partial: 0, wrong: 0 }, "unseen"),
    mk(4, "Qual a função da vírgula antes de 'e'?",
      "Usa-se quando o 'e' liga orações com sujeitos diferentes ou para evitar ambiguidade.",
      "Gramática", 3, { right: 0, partial: 0, wrong: 2 }, "wrong"),
    mk(5, "O que é tese em uma redação dissertativa?",
      "É a ideia central, o ponto de vista que será defendido ao longo do texto com argumentos.",
      "Redação", 2, { right: 1, partial: 0, wrong: 1 }, "wrong"),
    mk(6, "Quem escreveu 'Memórias Póstumas de Brás Cubas'?",
      "Machado de Assis, publicado em 1881, marco do Realismo brasileiro.",
      "Literatura", 2, { right: 0, partial: 0, wrong: 0 }, "unseen"),
    mk(7, "O que caracteriza a estrutura dissertativo-argumentativa?",
      "Introdução com tese, desenvolvimento com argumentos e conclusão com proposta de intervenção.",
      "Redação", 2, { right: 0, partial: 1, wrong: 0 }, "partial"),
    mk(8, "Qual a regra de concordância para 'haja vista'?",
      "A expressão é invariável quando significa 'visto que'; pode variar quando 'vista' concorda com o substantivo.",
      "Gramática", 3, { right: 0, partial: 0, wrong: 1 }, "wrong"),
    mk(9, "O que é coesão textual?",
      "Conjunto de mecanismos linguísticos que conectam palavras, frases e parágrafos garantindo fluidez.",
      "Redação", 1, { right: 1, partial: 0, wrong: 0 }, "right"),
  ];
  writeCards(demos);
}
