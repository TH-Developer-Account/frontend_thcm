import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type ProtectedRouteProps = {
  children: React.JSX.Element;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { token } = useAuth();

  // if no token => redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
