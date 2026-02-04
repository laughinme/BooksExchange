import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuthzReady, useHasRole } from "@/shared/authz";
import { Spinner } from "@/shared/ui/spinner";

export const AdminGuard = ({ children }: { children?: React.ReactNode }) => {
  const location = useLocation();
  const isReady = useAuthzReady();
  const isAdmin = useHasRole("admin");

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/home" state={{ from: location }} replace />;
  }

  return children ?? <Outlet />;
};
