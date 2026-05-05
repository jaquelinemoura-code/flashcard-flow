import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout, useAuth } from "@/lib/flashcards-store";

export function AppHeader() {
  const auth = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-primary-foreground"
            style={{ background: "var(--gradient-mint)" }}
          >
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-foreground">Flashly</p>
            <p className="text-[11px] text-muted-foreground">Estude com leveza</p>
          </div>
        </Link>

        {auth && (
          <div className="flex items-center gap-2">
            <Link to="/create">
              <Button size="sm" className="rounded-full">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Novo card</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => {
                logout();
                navigate({ to: "/login" });
              }}
              aria-label="Sair"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}