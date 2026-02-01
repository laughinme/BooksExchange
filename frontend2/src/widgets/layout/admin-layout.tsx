import { Outlet } from "react-router-dom";

import { AdminSidebar } from "./admin-sidebar";

export const AdminLayout = () => {
  return (
    <div className="relative flex min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 -z-10 be-app-bg" />
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
};
