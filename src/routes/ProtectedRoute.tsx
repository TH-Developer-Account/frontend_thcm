import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/Auth/useAuth";

type ProtectedRouteProps = {
  children: React.JSX.Element;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoading } = useAuth();
  if (isLoading) return <div>Loading...</div>;
  const access_token = localStorage.getItem("authToken");
  if (!access_token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
