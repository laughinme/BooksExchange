import { BookOpen, LayoutDashboard, Repeat, Users } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { useAuth } from "@/app/providers/auth-provider";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

const navItems = [
  { id: "dashboard", label: "Панель", icon: LayoutDashboard, path: "/" },
  { id: "books", label: "Книги", icon: BookOpen, path: "/books" },
  { id: "users", label: "Пользователи", icon: Users, path: "/users" },
  { id: "exchanges", label: "Обмены", icon: Repeat, path: "/exchanges" },
];

export const AdminSidebar = () => {
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col border-r bg-card px-4 py-6">
      <div className="flex items-center gap-2 px-2">
        <BookOpen className="size-6 text-primary" />
        <div>
          <p className="text-sm text-muted-foreground">Админ-панель</p>
          <p className="text-lg font-semibold">Book Exchange</p>
        </div>
      </div>

      <nav className="mt-8 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.id}
              to={item.path}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
                active && "bg-primary text-primary-foreground hover:bg-primary",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-2">
        <Button
          variant="destructive"
          className="w-full"
          onClick={logout}
        >
          Выйти
        </Button>
      </div>
    </aside>
  );
};
