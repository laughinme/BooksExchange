import { useEffect, useRef, useState } from "react";
import { BookOpen, Heart, LogOut, Map, Menu, MessageSquare, Plus, Search, User as UserIcon, Home } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { useProfileQuery } from "@/entities/profile/model/hooks";
import { useAuth } from "@/app/providers/auth-provider";
import { Avatar } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { cn } from "@/shared/lib/utils";

export const UserHeader = () => {
  const { data: profile } = useProfileQuery();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("query") ?? "");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    navigate(trimmed ? `/home?query=${encodeURIComponent(trimmed)}` : "/home");
  };

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex w-full items-center gap-4 border-b border-border/60 bg-sidebar/90 px-4 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-sidebar/75 be-shadow-header">
      <Link to="/home" className="flex items-center gap-2">
        <BookOpen className="size-6 text-primary" />
        <span className="text-lg font-semibold hidden md:inline text-foreground">Book Exchange</span>
      </Link>

      <form onSubmit={handleSubmit} className="relative hidden md:block flex-1 max-w-xl">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Найти книгу..."
          className="pl-10 bg-input border-border/60 focus-visible:ring-primary/40"
          aria-label="Поиск книг"
        />
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      </form>

      <div className="flex items-center gap-2 ml-auto">
        <Button
          variant="secondary"
          size="sm"
          className="hidden sm:inline-flex"
          onClick={() => navigate("/home")}
        >
          <Home className="size-4" />
          Для вас
        </Button>

        <Button
          variant="secondary"
          size="sm"
          className="hidden sm:inline-flex"
          onClick={() => navigate("/add-book")}
        >
          <Plus className="size-4" />
          Добавить книгу
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="hidden sm:flex text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/map")}
          aria-label="Карта точек"
        >
          <Map className="size-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="hidden sm:flex text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/my-exchanges")}
          aria-label="Обмены"
        >
          <MessageSquare className="size-5" />
        </Button>

        <div className="relative" ref={menuRef}>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex items-center gap-2 rounded-full px-2 hover:bg-accent/70 border border-transparent",
              menuOpen && "bg-accent/60 border-border/60",
            )}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <Avatar
              src={profile?.avatarUrl || undefined}
              fallback={profile?.username?.[0] ?? "?"}
              className="size-9"
            />
            <span className="hidden md:inline text-sm font-semibold text-foreground">{profile?.username ?? "Профиль"}</span>
            <Menu className="size-4 hidden md:inline" />
          </Button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-lg border border-border/70 bg-popover p-2 be-shadow-popover">
              <div className="flex items-center gap-3 rounded-md px-3 py-2 bg-muted/40">
                <Avatar
                  src={profile?.avatarUrl || undefined}
                  fallback={profile?.username?.[0] ?? "?"}
                  className="size-10"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{profile?.username}</p>
                  <p className="truncate text-xs text-muted-foreground">{profile?.email}</p>
                </div>
              </div>
              <div className="mt-2 space-y-1">
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent/60"
                >
                  <UserIcon className="size-4" /> Профиль
                </Link>
                <Link
                  to="/liked-books"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent/60"
                >
                  <Heart className="size-4" /> Лайки
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="size-4" /> Выйти
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
