import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <svg
        viewBox="0 0 240 200"
        className="h-44 w-auto"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.94 0.04 165)" />
            <stop offset="100%" stopColor="oklch(0.88 0.07 175)" />
          </linearGradient>
        </defs>
        <rect x="40" y="50" width="140" height="100" rx="14" fill="url(#g1)" transform="rotate(-6 110 100)" />
        <rect x="60" y="60" width="140" height="100" rx="14" fill="white" stroke="oklch(0.93 0.008 160)" strokeWidth="1.5" />
        <line x1="80" y1="90" x2="170" y2="90" stroke="oklch(0.85 0.02 160)" strokeWidth="3" strokeLinecap="round" />
        <line x1="80" y1="105" x2="155" y2="105" stroke="oklch(0.9 0.01 160)" strokeWidth="3" strokeLinecap="round" />
        <line x1="80" y1="120" x2="140" y2="120" stroke="oklch(0.9 0.01 160)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="190" cy="55" r="8" fill="oklch(0.72 0.12 165)" />
      </svg>
      <h2 className="mt-6 text-xl font-semibold text-foreground">
        Você ainda não tem flashcards.
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Vamos começar?</p>
      <Link to="/create" className="mt-6">
        <Button size="lg" className="rounded-full px-6">Criar meu primeiro card</Button>
      </Link>
    </div>
  );
}