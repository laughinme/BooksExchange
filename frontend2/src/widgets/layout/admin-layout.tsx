import { Outlet } from "react-router-dom";

import { AdminSidebar } from "./admin-sidebar";

export const AdminLayout = () => {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
};
