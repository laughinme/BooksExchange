import { Outlet } from "react-router-dom";

import { AdminSidebar } from "./admin-sidebar";

export const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
