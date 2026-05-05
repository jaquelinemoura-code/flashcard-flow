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

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/* ---------- Auth ---------- */
export function getAuth(): { email: string } | null {
  return read<{ email: string } | null>(AUTH_KEY, null);
}
export function login(email: string) {
  localStorage.setItem(AUTH_KEY, JSON.stringify({ email }));
  emit();
}
export function logout() {
  localStorage.removeItem(AUTH_KEY);
  emit();
}
export function useAuth() {
  const [snap, setSnap] = useState<{ email: string } | null>(null);
  useEffect(() => {
    setSnap(getAuth());
    return subscribe(() => setSnap(getAuth()));
  }, []);
  return snap;
}

/* ---------- Cards ---------- */
function getCards(): Flashcard[] {
  return read<Flashcard[]>(CARDS_KEY, []);
}
function setCards(cards: Flashcard[]) {
  localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
  emit();
}

export function useCards(): Flashcard[] {
  return useSyncExternalStore(
    subscribe,
    getCards,
    () => [],
  );
}

export function addCard(input: Omit<Flashcard, "id" | "stats" | "lastResult" | "createdAt">) {
  const card: Flashcard = {
    ...input,
    id: crypto.randomUUID(),
    stats: { right: 0, partial: 0, wrong: 0 },
    lastResult: "unseen",
    createdAt: Date.now(),
  };
  setCards([card, ...getCards()]);
}

export function deleteCard(id: string) {
  setCards(getCards().filter((c) => c.id !== id));
}

export function recordResult(id: string, result: "right" | "partial" | "wrong") {
  setCards(
    getCards().map((c) =>
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
  if (getCards().length > 0) return;
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
  setCards(demos);
}