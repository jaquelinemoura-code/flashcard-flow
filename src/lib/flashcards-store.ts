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

const CARDS_KEY = "fc:cards:v1";
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
  const demos: Flashcard[] = [
    {
      id: crypto.randomUUID(),
      question: "O que é uma oração subordinada substantiva?",
      answer: "Oração que exerce função de substantivo (sujeito, objeto, etc.) em relação à oração principal.",
      tag: "Gramática",
      level: 2,
      stats: { right: 0, partial: 0, wrong: 0 },
      lastResult: "unseen",
      createdAt: Date.now(),
    },
    {
      id: crypto.randomUUID(),
      question: "Quais são as principais características do Romantismo brasileiro?",
      answer: "Subjetivismo, sentimentalismo, nacionalismo, idealização da mulher e da natureza, fuga da realidade.",
      tag: "Literatura",
      level: 3,
      stats: { right: 0, partial: 0, wrong: 0 },
      lastResult: "unseen",
      createdAt: Date.now() - 1000,
    },
  ];
  writeCards(demos);
}
