import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

type ProtectedRouteProps = {
  children: React.JSX.Element;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div>Loading...</div>;
  // if no user => redirect to login
  console.log({ user });
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
