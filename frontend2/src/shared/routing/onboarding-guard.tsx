import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useProfileQuery } from "@/entities/profile/model/hooks";
import { Spinner } from "@/shared/ui/spinner";

export const OnboardingGuard = ({ children }: { children?: React.ReactNode }) => {
  const location = useLocation();
  const { data: profile, isPending, error } = useProfileQuery();

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if ((error || !profile || !profile.isOnboarded) && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  if (profile?.isOnboarded && location.pathname === "/onboarding") {
    return <Navigate to="/home" replace />;
  }

  return children ?? <Outlet />;
};
