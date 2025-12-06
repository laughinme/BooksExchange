import { Outlet } from "react-router-dom";

import { UserHeader } from "./user-header";

export const UserLayout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <UserHeader />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};
