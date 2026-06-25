import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/Auth/useAuth";
import { matchRoute } from "./routeConfig";

type ProtectedRouteProps = {
  children: React.JSX.Element;
  redirectTo?: string;
};

export default function ProtectedRoute({
  children,
  redirectTo = "/forbidden",
}: ProtectedRouteProps) {
  const { isLoading, can } = useAuth();
  const { pathname } = useLocation();

  // Still resolving auth state — don't redirect yet
  if (isLoading) return <div>Loading...</div>;

  // No token → send to login
  const token = localStorage.getItem("authToken");
  if (!token) return <Navigate to="/login" replace />;

  // Look up whether this path has a permission requirement
  const route = matchRoute(pathname);
  const permission = route?.permission;

  // Has a requirement and doesn't meet it → forbidden
  if (
    permission &&
    !can(permission.action, permission.app, permission.module)
  ) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
