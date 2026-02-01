import { Outlet, NavLink } from "react-router-dom";
import { BookOpen, Map, Plus, Repeat, User as UserIcon } from "lucide-react";

import { UserHeader } from "./user-header";

export const UserLayout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <div className="absolute inset-0 -z-10 be-app-bg" />
      <UserHeader />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 pb-20 md:pb-10">
        <Outlet />
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border/70 bg-sidebar/95 backdrop-blur px-4 py-2 text-[11px] font-medium text-muted-foreground">
        <div className="flex items-center justify-between">
          <NavLink
            to="/home"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-md px-3 py-1.5 ${isActive ? "text-primary" : ""}`
            }
          >
            <BookOpen className="size-5" />
            <span>Главная</span>
          </NavLink>
          <NavLink
            to="/map"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-md px-3 py-1.5 ${isActive ? "text-primary" : ""}`
            }
          >
            <Map className="size-5" />
            <span>Карта</span>
          </NavLink>
          <NavLink to="/add-book" className="relative -top-4">
            <div className="rounded-full bg-primary text-primary-foreground p-3 shadow-lg shadow-black/40">
              <Plus className="size-6" />
            </div>
          </NavLink>
          <NavLink
            to="/my-exchanges"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-md px-3 py-1.5 ${isActive ? "text-primary" : ""}`
            }
          >
            <Repeat className="size-5" />
            <span>Обмены</span>
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-md px-3 py-1.5 ${isActive ? "text-primary" : ""}`
            }
          >
            <UserIcon className="size-5" />
            <span>Профиль</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
};
