import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../context/Auth/AuthContext";
import FullScreenLoader from "./FullScreenLoader";

type AdministrationRouteProps = {
  superAdminOnly?: boolean;
};

// Hiding a link is not enough: this stops a direct URL from rendering an
// admin screen. The API still enforces the same rules on every call.
export default function AdministrationRoute({
  superAdminOnly = false,
}: AdministrationRouteProps) {
  const { isLoading, isSuperAdmin, canAccessAdministration } = useAuth();

  if (isLoading) return <FullScreenLoader />;

  const isAllowed = superAdminOnly ? isSuperAdmin : canAccessAdministration;
  return isAllowed ? <Outlet /> : <Navigate to="/forbidden" replace />;
}
