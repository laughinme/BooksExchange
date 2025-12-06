import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/app/providers/auth-provider";
import { Spinner } from "@/shared/ui/spinner";

export const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const location = useLocation();
  const { token, isAuthReady } = useAuth();

  if (!isAuthReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ?? <Outlet />;
};
