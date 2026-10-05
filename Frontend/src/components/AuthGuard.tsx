import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getAuthToken } from "@/lib/dishyApi";

const AuthGuard = ({ children }: { children: ReactNode }) => {
  const location = useLocation();

  if (!getAuthToken()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default AuthGuard;
