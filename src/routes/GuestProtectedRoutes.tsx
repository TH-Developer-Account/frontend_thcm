import type { JSX } from "react";
import { Navigate } from "react-router-dom";

type GuestProtectedRouteProps = {
  children: JSX.Element;
};

export default function GuestProtectedRoute({
  children,
}: GuestProtectedRouteProps) {
  const token = localStorage.getItem("guestAuthToken");
  if (!token) return <Navigate to="/guest/login" replace />;

  return children;
}
