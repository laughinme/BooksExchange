import { ArrowLeft, BookOpen, LayoutDashboard, LogOut, Repeat, Users } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { useAuth } from "@/app/providers/use-auth";
import { Button } from "@/shared/ui/button";
import { Separator } from "@/shared/ui/separator";
import { cn } from "@/shared/lib/utils";

const navItems = [
  { id: "dashboard", label: "Панель", icon: LayoutDashboard, path: "/admin" },
  { id: "books", label: "Книги", icon: BookOpen, path: "/admin/books" },
  { id: "users", label: "Пользователи", icon: Users, path: "/admin/users" },
  { id: "exchanges", label: "Обмены", icon: Repeat, path: "/admin/exchanges" },
];

export const AdminSidebar = () => {
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-shrink-0 flex-col border-r border-border/70 bg-sidebar px-4 py-5">
      <div className="flex items-center gap-3 px-2">
        <div className="flex size-9 items-center justify-center rounded-lg border border-border/70 bg-card be-shadow-none">
          <BookOpen className="size-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">Админ‑панель</p>
          <p className="truncate text-sm font-semibold text-foreground">Book Exchange</p>
        </div>
      </div>

      <Separator className="my-4" />

      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            item.path === "/admin"
              ? location.pathname === "/admin" || location.pathname === "/admin/"
              : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);

          return (
            <Button
              key={item.id}
              asChild
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent/60 hover:text-foreground be-shadow-none",
                active && "bg-accent text-foreground",
              )}
            >
              <Link to={item.path} aria-current={active ? "page" : undefined}>
                <Icon className={cn("size-4", active ? "text-primary" : "text-muted-foreground")} />
                {item.label}
              </Link>
            </Button>
          );
        })}
      </nav>

      <div className="mt-auto px-2 pt-4">
        <Separator className="mb-4" />
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="secondary"
            className="flex-1 min-w-0 justify-start gap-2 overflow-hidden be-shadow-none"
          >
            <Link to="/home">
              <ArrowLeft className="size-4" />
              <span className="truncate">Обратно на FYP</span>
            </Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="be-shadow-none text-muted-foreground hover:text-foreground"
            onClick={logout}
            aria-label="Выйти"
          >
            <LogOut className="size-5" />
          </Button>
        </div>
      </div>
    </aside>
  );
};
